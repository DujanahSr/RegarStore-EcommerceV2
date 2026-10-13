package com.regarsport.order.service;

import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderCancelledEvent;
import com.regarsport.common.event.OrderItemEventPayload;
import com.regarsport.common.event.OrderPaidEvent;
import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.client.CatalogClient;
import com.regarsport.order.dto.*;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderItem;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.entity.Voucher;
import com.regarsport.order.mapper.OrderMapper;
import com.regarsport.order.messaging.OrderEventProducer;
import com.regarsport.order.repository.CartItemRepository;
import com.regarsport.order.repository.OrderRepository;
import com.regarsport.order.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final VoucherRepository voucherRepository;
    private final OrderMapper orderMapper;
    private final OrderEventProducer orderEventProducer;
    private final CatalogClient catalogClient;

    @Transactional
    public OrderResponse checkout(Long userId, String customerName, String customerEmail, CheckoutRequest request) {
        log.info("Processing checkout for userId: {}, items count: {}", userId, request.items().size());

        if (request.items().isEmpty()) {
            throw new BadRequestException("Cannot checkout with empty items list");
        }

        String orderNumber = "REGAR-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItemEventPayload> eventItems = new ArrayList<>();
        List<Long> productIds = new ArrayList<>();

        String recipient = (request.recipientName() != null && !request.recipientName().isBlank())
                ? request.recipientName().trim()
                : customerName;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(request.customerPhone() != null ? request.customerPhone().trim() : null)
                .recipientName(recipient)
                .shippingAddress(request.shippingAddress().trim())
                .shippingCity(request.shippingCity() != null ? request.shippingCity().trim() : null)
                .shippingPostalCode(request.shippingPostalCode() != null ? request.shippingPostalCode().trim() : null)
                .shippingNotes(request.shippingNotes() != null ? request.shippingNotes().trim() : null)
                .status(OrderStatus.PENDING)
                .build();

        for (CheckoutItemRequest itemReq : request.items()) {
            // Harga, nama, dan gambar selalu dari catalog-service (harga dari browser bisa dimanipulasi)
            CatalogClient.CatalogProduct product = catalogClient.getProduct(itemReq.productId());
            BigDecimal subtotal = product.price().multiply(BigDecimal.valueOf(itemReq.quantity()));
            totalAmount = totalAmount.add(subtotal);

            String itemSize = (itemReq.size() != null && !itemReq.size().isBlank()) ? itemReq.size().trim() : "L";
            int available = product.availableStock(itemSize);
            if (itemReq.quantity() > available) {
                throw new BadRequestException("Stok " + product.name() + " ukuran " + itemSize + " tidak mencukupi (tersisa " + available + ")");
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.productId())
                    .productName(product.name())
                    .productImage(product.imageUrl())
                    .size(itemSize)
                    .customName(itemReq.customName() != null ? itemReq.customName().trim().toUpperCase() : null)
                    .customNumber(itemReq.customNumber() != null ? itemReq.customNumber().trim() : null)
                    .customCollar(itemReq.customCollar() != null ? itemReq.customCollar().trim() : null)
                    .customTeam(itemReq.customTeam() != null ? itemReq.customTeam().trim().toUpperCase() : null)
                    .price(product.price())
                    .quantity(itemReq.quantity())
                    .subtotal(subtotal)
                    .build();

            order.addItem(orderItem);
            productIds.add(itemReq.productId());

            eventItems.add(new OrderItemEventPayload(
                    itemReq.productId(),
                    product.name(),
                    itemReq.quantity(),
                    product.price(),
                    itemSize,
                    orderItem.getCustomName(),
                    orderItem.getCustomNumber(),
                    orderItem.getCustomCollar(),
                    orderItem.getCustomTeam()
            ));
        }

        // Voucher promo discount computation
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedVoucher = null;

        if (request.voucherCode() != null && !request.voucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCodeIgnoreCase(request.voucherCode().trim())
                    .orElseThrow(() -> new BadRequestException("Kode voucher '" + request.voucherCode() + "' tidak ditemukan"));

            if (Boolean.FALSE.equals(voucher.getIsActive())) {
                throw new BadRequestException("Kupon promo sudah tidak aktif");
            }
            if (voucher.getValidUntil() != null && voucher.getValidUntil().isBefore(Instant.now())) {
                throw new BadRequestException("Kupon promo sudah kedaluwarsa");
            }
            if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
                throw new BadRequestException("Kuota kupon promo sudah habis");
            }
            if (voucher.getMinSpend() != null && totalAmount.compareTo(voucher.getMinSpend()) < 0) {
                throw new BadRequestException("Total belanja belum memenuhi syarat minimal belanja Rp " + voucher.getMinSpend().intValue());
            }

            if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
                BigDecimal pct = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
                discountAmount = totalAmount.multiply(pct).setScale(0, java.math.RoundingMode.HALF_UP);
                if (voucher.getMaxDiscount() != null && discountAmount.compareTo(voucher.getMaxDiscount()) > 0) {
                    discountAmount = voucher.getMaxDiscount();
                }
            } else {
                discountAmount = voucher.getDiscountValue();
            }

            if (discountAmount.compareTo(totalAmount) > 0) {
                discountAmount = totalAmount;
            }

            appliedVoucher = voucher.getCode();
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }

        BigDecimal finalTotal = totalAmount.subtract(discountAmount);
        order.setTotalAmount(finalTotal);
        order.setVoucherCode(appliedVoucher);
        order.setDiscountAmount(discountAmount);

        Order savedOrder = orderRepository.save(order);

        // Remove purchased items from the user's shopping cart
        try {
            cartItemRepository.deleteByUserIdAndProductIdIn(userId, productIds);
        } catch (Exception e) {
            log.warn("Failed to auto-clean cart items after checkout for userId: {}", userId, e);
        }

        // Publish OrderCreatedEvent to RabbitMQ
        OrderCreatedEvent event = new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getUserId(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerEmail(),
                savedOrder.getTotalAmount(),
                savedOrder.getShippingAddress(),
                eventItems,
                Instant.now()
        );
        orderEventProducer.publishOrderCreated(event);

        return orderMapper.toResponse(savedOrder);
    }

    @Transactional
    public boolean autoExpireIfPending(Order order) {
        if (order != null && order.getStatus() == OrderStatus.PENDING && order.getCreatedAt() != null) {
            long hours = Duration.between(order.getCreatedAt(), Instant.now()).toHours();
            if (hours >= 24) {
                // Hanya untuk tampilan (dipanggil dari query read-only). Pembatalan resmi + pengembalian stok
                // terjadi saat notifikasi "expire" dari Midtrans masuk (handlePaymentStatusUpdated).
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancellationReason("Batas waktu pembayaran kedaluwarsa (melebihi 24 jam)");
                orderRepository.save(order);
                log.info("Auto-expired order {} (created at {}, {} hours ago)", order.getOrderNumber(), order.getCreatedAt(), hours);
                return true;
            }
        }
        return false;
    }

    @Transactional
    public OrderResponse getOrderById(Long orderId, Long userId, boolean isAdmin) {
        log.info("Fetching order by id: {}", orderId);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You can only view your own orders");
        }

        autoExpireIfPending(order);

        return orderMapper.toResponse(order);
    }

    @Transactional
    public PageResponse<OrderResponse> getMyOrders(Long userId, int page, int size) {
        log.info("Fetching orders for userId: {}, page: {}, size: {}", userId, page, size);
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(50, Math.max(1, size)), Sort.by("createdAt").descending());

        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        orderPage.getContent().forEach(this::autoExpireIfPending);
        var content = orderPage.getContent().stream().map(orderMapper::toResponse).toList();

        return new PageResponse<>(
                content,
                orderPage.getNumber() + 1,
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.isFirst(),
                orderPage.isLast()
        );
    }

    @Transactional
    public PageResponse<OrderResponse> getAllOrders(OrderStatus status, int page, int size) {
        log.info("Admin fetching all orders with status filter: {}, page: {}, size: {}", status, page, size);
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)), Sort.by("createdAt").descending());

        Page<Order> orderPage = status != null
                ? orderRepository.findByStatus(status, pageable)
                : orderRepository.findAll(pageable);

        orderPage.getContent().forEach(this::autoExpireIfPending);
        var content = orderPage.getContent().stream().map(orderMapper::toResponse).toList();

        return new PageResponse<>(
                content,
                orderPage.getNumber() + 1,
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.isFirst(),
                orderPage.isLast()
        );
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus, String role) {
        log.info("Updating order status for id: {} to: {} by role: {}", orderId, newStatus, role);
        boolean isAdminOrLogistics = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)
                || "ROLE_LOGISTICS".equalsIgnoreCase(role) || "LOGISTICS".equalsIgnoreCase(role);
        if (!isAdminOrLogistics) {
            throw new BadRequestException("Akses ditolak: Hanya Administrator atau Staf Logistik yang berwenang memperbarui status pesanan.");
        }

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + orderId));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == newStatus) {
            return orderMapper.toResponse(order);
        }

        // Terminal states cannot be altered
        if (currentStatus == OrderStatus.COMPLETED) {
            throw new BadRequestException("Pesanan yang sudah SELESAI (COMPLETED) tidak dapat diubah statusnya lagi.");
        }
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Pesanan yang sudah DIBATALKAN (CANCELLED) tidak dapat diaktifkan kembali.");
        }

        // Admin CANNOT arbitrarily mark an unpaid order as PAID!
        if (newStatus == OrderStatus.PAID) {
            throw new BadRequestException("Status LUNAS (PAID) tidak dapat diubah sembarangan secara manual oleh admin. Status PAID hanya dapat diproses otomatis melalui verifikasi pembayaran Midtrans Gateway.");
        }

        // Validate state machine transitions
        switch (currentStatus) {
            case PENDING -> {
                if (newStatus != OrderStatus.CANCELLED) {
                    throw new BadRequestException("Pesanan berstatus PENDING belum dibayar dan tidak dapat langsung diubah ke " + newStatus + ". Pesanan hanya dapat dibatalkan atau menunggu konfirmasi pembayaran Midtrans.");
                }
                order.setCancellationReason("Dibatalkan oleh administrator");
            }
            case PAID -> {
                if (newStatus != OrderStatus.PROCESSING && newStatus != OrderStatus.CANCELLED) {
                    throw new BadRequestException("Pesanan berstatus PAID (Lunas) hanya dapat diubah ke PROCESSING (Produksi) atau CANCELLED.");
                }
                if (newStatus == OrderStatus.CANCELLED) {
                    order.setCancellationReason("Dibatalkan oleh administrator setelah pembayaran");
                }
            }
            case PROCESSING -> {
                if (newStatus != OrderStatus.SHIPPED && newStatus != OrderStatus.CANCELLED) {
                    throw new BadRequestException("Pesanan berstatus PROCESSING hanya dapat diubah ke SHIPPED (Dikirim) atau CANCELLED.");
                }
                if (newStatus == OrderStatus.SHIPPED && (order.getShippingCourier() == null || order.getTrackingNumber() == null)) {
                    throw new BadRequestException("Pesanan tidak dapat diubah ke SHIPPED tanpa menginput nama kurir dan nomor resi pengiriman. Gunakan tombol Input Resi.");
                }
            }
            case SHIPPED -> {
                if (newStatus != OrderStatus.COMPLETED) {
                    throw new BadRequestException("Pesanan yang sudah dikirim (SHIPPED) hanya dapat diubah ke COMPLETED (Selesai).");
                }
                order.setCompletedAt(Instant.now());
            }
            default -> throw new BadRequestException("Transisi status dari " + currentStatus + " ke " + newStatus + " tidak valid.");
        }

        if (newStatus == OrderStatus.CANCELLED) {
            markCancelled(order, order.getCancellationReason());
        } else {
            order.setStatus(newStatus);
        }
        if (newStatus == OrderStatus.SHIPPED && order.getShippedAt() == null) {
            order.setShippedAt(Instant.now());
        } else if (newStatus == OrderStatus.COMPLETED && order.getCompletedAt() == null) {
            order.setCompletedAt(Instant.now());
        }

        Order updated = orderRepository.save(order);
        return orderMapper.toResponse(updated);
    }

    // Overload for backward compatibility / internal calls
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        return updateOrderStatus(orderId, newStatus, "ROLE_ADMIN");
    }

    @Transactional
    public OrderResponse shipOrder(Long orderId, com.regarsport.order.dto.ShipOrderRequest request, String role) {
        log.info("Shipping order id: {} with courier: {}, tracking: {} by role: {}", orderId, request.courier(), request.trackingNumber(), role);
        boolean isAdminOrLogistics = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)
                || "ROLE_LOGISTICS".equalsIgnoreCase(role) || "LOGISTICS".equalsIgnoreCase(role);
        if (!isAdminOrLogistics) {
            throw new BadRequestException("Akses ditolak: Hanya Administrator atau Staf Logistik yang berwenang mengirimkan pesanan.");
        }

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + orderId));

        if (order.getStatus() == OrderStatus.PENDING) {
            throw new BadRequestException("Pesanan belum dibayar (PENDING). Tidak dapat mengirim pesanan sebelum pembayaran lunas.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Pesanan sudah dibatalkan. Tidak dapat melakukan pengiriman.");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Pesanan sudah selesai.");
        }
        if (request.courier() == null || request.courier().isBlank()) {
            throw new BadRequestException("Nama kurir / ekspedisi tidak boleh kosong.");
        }
        if (request.trackingNumber() == null || request.trackingNumber().isBlank()) {
            throw new BadRequestException("Nomor resi pengiriman tidak boleh kosong.");
        }

        order.setStatus(OrderStatus.SHIPPED);
        order.setShippingCourier(request.courier().trim());
        order.setTrackingNumber(request.trackingNumber().trim());
        order.setShippedAt(Instant.now());

        Order updated = orderRepository.save(order);

        // Publish OrderShippedEvent to RabbitMQ
        try {
            orderEventProducer.publishOrderShipped(new com.regarsport.common.event.OrderShippedEvent(
                    updated.getId(),
                    updated.getOrderNumber(),
                    updated.getCustomerName(),
                    updated.getCustomerEmail(),
                    updated.getShippingCourier(),
                    updated.getTrackingNumber(),
                    updated.getShippedAt()
            ));
        } catch (Exception e) {
            log.warn("Failed to publish OrderShippedEvent for orderId: {}", orderId, e);
        }

        return orderMapper.toResponse(updated);
    }

    // Overload for backward compatibility / internal calls
    @Transactional
    public OrderResponse shipOrder(Long orderId, com.regarsport.order.dto.ShipOrderRequest request) {
        return shipOrder(orderId, request, "ROLE_ADMIN");
    }

    @Transactional
    public OrderResponse completeOrder(Long orderId, Long userId, boolean isAdmin) {
        log.info("Completing order id: {} by userId: {}, isAdmin: {}", orderId, userId, isAdmin);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new BadRequestException("Akses ditolak: Anda hanya dapat menyelesaikan pesanan milik Anda sendiri.");
        }

        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new BadRequestException("Pesanan hanya dapat diselesaikan jika sudah dalam status pengiriman (SHIPPED). Status pesanan saat ini: " + order.getStatus());
        }

        order.setStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(Instant.now());

        Order updated = orderRepository.save(order);
        return orderMapper.toResponse(updated);
    }

    // Overload for backward compatibility / internal calls
    @Transactional
    public OrderResponse completeOrder(Long orderId) {
        return completeOrder(orderId, 1L, true);
    }

    @Transactional
    public void handlePaymentStatusUpdated(PaymentStatusUpdatedEvent event) {
        log.info("Handling PaymentStatusUpdatedEvent for orderId: {}, status: {}", event.orderId(), event.paymentStatus());

        Order order = orderRepository.findByIdWithItems(event.orderId()).orElse(null);
        if (order == null) {
            log.warn("Order not found with id: {} during payment status update event", event.orderId());
            return;
        }

        boolean becamePaid = false;
        if ("PAID".equalsIgnoreCase(event.paymentStatus()) || "SETTLEMENT".equalsIgnoreCase(event.paymentStatus())) {
            becamePaid = order.getStatus() != OrderStatus.PAID;
            order.setStatus(OrderStatus.PAID);
        } else if ("EXPIRE".equalsIgnoreCase(event.paymentStatus()) || "CANCEL".equalsIgnoreCase(event.paymentStatus()) || "DENY".equalsIgnoreCase(event.paymentStatus())) {
            markCancelled(order, "Batas waktu pembayaran kedaluwarsa (Expired by Midtrans)");
        }

        orderRepository.save(order);
        log.info("Successfully updated order id: {} to status: {}", order.getId(), order.getStatus());

        // Sekali per pesanan (Midtrans bisa kirim capture + settlement) -> e-invoice ke email pembeli
        if (becamePaid) {
            orderEventProducer.publishOrderPaid(new OrderPaidEvent(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getCustomerName(),
                    order.getCustomerEmail(),
                    order.getCustomerPhone(),
                    order.getRecipientName(),
                    order.getShippingAddress(),
                    order.getShippingCity(),
                    order.getShippingPostalCode(),
                    order.getVoucherCode(),
                    order.getDiscountAmount(),
                    order.getTotalAmount(),
                    event.paymentType(),
                    order.getCreatedAt(),
                    event.paidAt() != null ? event.paidAt() : java.time.Instant.now(),
                    toEventItems(order)
            ));
        }
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId, boolean isAdmin, String reason) {
        log.info("Cancelling order id: {} by userId: {}, isAdmin: {}", orderId, userId, isAdmin);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Pesanan ini sudah dibatalkan sebelumnya");
        }

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new BadRequestException("Akses ditolak: Anda hanya dapat membatalkan pesanan milik Anda sendiri");
        }

        if (order.getStatus() != OrderStatus.PENDING && !isAdmin) {
            throw new BadRequestException("Hanya pesanan berstatus PENDING yang dapat dibatalkan mandiri oleh pembeli");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Pesanan yang sudah dikirim atau selesai tidak dapat dibatalkan");
        }

        markCancelled(order, reason != null && !reason.isBlank() ? reason.trim() : "Dibatalkan oleh pelanggan");

        Order updated = orderRepository.save(order);
        return orderMapper.toResponse(updated);
    }

    public VoucherValidateResponse validateVoucher(VoucherValidateRequest request) {
        String code = request.code().trim();
        BigDecimal subtotal = request.subtotal();

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code).orElse(null);
        if (voucher == null) {
            return new VoucherValidateResponse(false, "Kode voucher tidak ditemukan", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (Boolean.FALSE.equals(voucher.getIsActive())) {
            return new VoucherValidateResponse(false, "Kupon promo sudah tidak aktif", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (voucher.getValidUntil() != null && voucher.getValidUntil().isBefore(Instant.now())) {
            return new VoucherValidateResponse(false, "Kupon promo sudah kedaluwarsa", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return new VoucherValidateResponse(false, "Kuota pemakaian kupon promo sudah habis", code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }
        if (voucher.getMinSpend() != null && subtotal.compareTo(voucher.getMinSpend()) < 0) {
            return new VoucherValidateResponse(false, "Minimal belanja untuk kupon ini adalah Rp " + voucher.getMinSpend().intValue(), code, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal);
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(voucher.getDiscountType())) {
            BigDecimal pct = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
            discount = subtotal.multiply(pct).setScale(0, java.math.RoundingMode.HALF_UP);
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        BigDecimal finalAmount = subtotal.subtract(discount);
        return new VoucherValidateResponse(true, "Kupon promo berhasil diterapkan!", voucher.getCode(), voucher.getDiscountType(), voucher.getDiscountValue(), discount, finalAmount);
    }

    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll(Sort.by("createdAt").descending()).stream()
                .map(this::toVoucherResponse)
                .toList();
    }

    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        if (voucherRepository.existsByCodeIgnoreCase(request.code().trim())) {
            throw new BadRequestException("Kode voucher '" + request.code() + "' sudah ada");
        }
        Voucher voucher = Voucher.builder()
                .code(request.code().trim().toUpperCase())
                .name(request.name().trim())
                .discountType(request.discountType() != null ? request.discountType().toUpperCase() : "PERCENTAGE")
                .discountValue(request.discountValue())
                .minSpend(request.minSpend() != null ? request.minSpend() : BigDecimal.ZERO)
                .maxDiscount(request.maxDiscount())
                .usageLimit(request.usageLimit() != null ? request.usageLimit() : 100)
                .usedCount(0)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .validUntil(request.validUntil())
                .build();
        return toVoucherResponse(voucherRepository.save(voucher));
    }

    @Transactional
    public VoucherResponse toggleVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher tidak ditemukan dengan id: " + id));
        voucher.setIsActive(!Boolean.TRUE.equals(voucher.getIsActive()));
        return toVoucherResponse(voucherRepository.save(voucher));
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher tidak ditemukan dengan id: " + id));
        voucherRepository.delete(voucher);
    }

    private VoucherResponse toVoucherResponse(Voucher v) {
        return new VoucherResponse(
                v.getId(),
                v.getCode(),
                v.getName(),
                v.getDiscountType(),
                v.getDiscountValue(),
                v.getMinSpend(),
                v.getMaxDiscount(),
                v.getUsageLimit(),
                v.getUsedCount(),
                v.getIsActive(),
                v.getValidUntil(),
                v.getCreatedAt()
        );
    }

    /** Satu pintu pembatalan: stok dikembalikan catalog-service lewat event (idempotent per pesanan di sana). */
    private void markCancelled(Order order, String reason) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        orderEventProducer.publishOrderCancelled(new OrderCancelledEvent(order.getId(), order.getOrderNumber(), toEventItems(order)));
    }

    private static List<OrderItemEventPayload> toEventItems(Order order) {
        return order.getItems().stream().map(item -> new OrderItemEventPayload(
                item.getProductId(),
                item.getProductName(),
                item.getQuantity(),
                item.getPrice(),
                item.getSize(),
                item.getCustomName(),
                item.getCustomNumber(),
                item.getCustomCollar(),
                item.getCustomTeam()
        )).toList();
    }
}
