package com.regarsport.order.service;

import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.dto.UpdateClaimStatusRequest;
import com.regarsport.order.dto.WarrantyClaimRequest;
import com.regarsport.order.dto.WarrantyClaimResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.WarrantyClaim;
import com.regarsport.order.repository.OrderRepository;
import com.regarsport.order.repository.WarrantyClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarrantyClaimService {

    private final WarrantyClaimRepository claimRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public WarrantyClaimResponse createClaim(Long userId, WarrantyClaimRequest request) {
        log.info("Creating warranty claim for userId: {}, orderId: {}, productId: {}", userId, request.orderId(), request.productId());

        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Pesanan tidak ditemukan dengan id: " + request.orderId()));

        if (!order.getUserId().equals(userId)) {
            throw new BadRequestException("Anda hanya dapat mengajukan klaim untuk pesanan milik sendiri");
        }

        if (order.getStatus() != com.regarsport.order.entity.OrderStatus.COMPLETED) {
            throw new BadRequestException("Klaim garansi hanya dapat diajukan setelah pesanan selesai diterima (status COMPLETED)");
        }

        // Cek masa aktif garansi 7 hari sejak pesanan selesai
        java.time.Instant completionTime = order.getCompletedAt() != null ? order.getCompletedAt() : order.getUpdatedAt();
        if (completionTime != null) {
            java.time.Instant warrantyExpiry = completionTime.plus(7, java.time.temporal.ChronoUnit.DAYS);
            if (java.time.Instant.now().isAfter(warrantyExpiry)) {
                throw new BadRequestException("Masa berlaku garansi 7 hari untuk pesanan ini telah berakhir");
            }
        }

        // Cek anti-duplikasi klaim aktif
        boolean hasActiveClaim = claimRepository.existsByOrderIdAndProductIdAndStatusIn(
                order.getId(), request.productId(), List.of("PENDING", "APPROVED", "PROCESSING")
        );
        if (hasActiveClaim) {
            throw new BadRequestException("Produk ini sudah memiliki tiket klaim garansi yang sedang diproses");
        }

        // Generate unique claim ticket number: CLM-YYYYMMDD-XXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        String claimNumber = "CLM-" + datePart + "-" + randomPart;

        WarrantyClaim claim = WarrantyClaim.builder()
                .claimNumber(claimNumber)
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber() != null ? order.getOrderNumber() : request.orderNumber())
                .userId(userId)
                .productId(request.productId())
                .productName(request.productName())
                .productImage(request.productImage())
                .category(request.category().toUpperCase())
                .solution(request.solution().toUpperCase())
                .requestedSize(request.requestedSize())
                .description(request.description())
                .evidenceImages(request.evidenceImages())
                .status("PENDING")
                .build();

        WarrantyClaim saved = claimRepository.save(claim);
        log.info("Warranty claim created successfully: {}", saved.getClaimNumber());
        return toResponse(saved);
    }

    public List<WarrantyClaimResponse> getUserClaims(Long userId) {
        return claimRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<WarrantyClaimResponse> getClaimsByOrder(Long orderId) {
        return claimRepository.findByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public WarrantyClaimResponse getClaimByNumber(String claimNumber) {
        WarrantyClaim claim = claimRepository.findByClaimNumber(claimNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Tiket klaim tidak ditemukan: " + claimNumber));
        return toResponse(claim);
    }

    public PageResponse<WarrantyClaimResponse> getAllClaims(String status, int page, int size) {
        log.info("Fetching warranty claims for admin, status: {}, page: {}, size: {}", status, page, size);
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)));

        Page<WarrantyClaim> claimPage;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            claimPage = claimRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase(), pageable);
        } else {
            claimPage = claimRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        var content = claimPage.getContent().stream().map(this::toResponse).toList();
        return new PageResponse<>(
                content,
                claimPage.getNumber() + 1,
                claimPage.getSize(),
                claimPage.getTotalElements(),
                claimPage.getTotalPages(),
                claimPage.isFirst(),
                claimPage.isLast()
        );
    }

    @Transactional
    public WarrantyClaimResponse updateClaimStatus(Long claimId, UpdateClaimStatusRequest request) {
        log.info("Updating warranty claim id: {} with status: {}", claimId, request.status());
        WarrantyClaim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Tiket klaim tidak ditemukan dengan ID: " + claimId));

        if (request.status() != null && !request.status().isBlank()) {
            claim.setStatus(request.status().trim().toUpperCase());
        }
        if (request.adminNotes() != null) {
            claim.setAdminNotes(request.adminNotes().trim());
        }
        if (request.replacementTrackingNumber() != null && !request.replacementTrackingNumber().isBlank()) {
            claim.setReplacementTrackingNumber(request.replacementTrackingNumber().trim());
            if ("APPROVED".equalsIgnoreCase(claim.getStatus()) || "PROCESSING".equalsIgnoreCase(claim.getStatus())) {
                claim.setStatus("RESOLVED");
            }
        }
        if (request.returnTrackingNumber() != null && !request.returnTrackingNumber().isBlank()) {
            claim.setReturnTrackingNumber(request.returnTrackingNumber().trim());
        }

        WarrantyClaim updated = claimRepository.save(claim);
        log.info("Claim {} successfully updated to status: {}", updated.getClaimNumber(), updated.getStatus());
        return toResponse(updated);
    }

    private WarrantyClaimResponse toResponse(WarrantyClaim c) {
        return new WarrantyClaimResponse(
                c.getId(),
                c.getClaimNumber(),
                c.getOrderId(),
                c.getOrderNumber(),
                c.getUserId(),
                c.getProductId(),
                c.getProductName(),
                c.getProductImage(),
                c.getCategory(),
                c.getSolution(),
                c.getRequestedSize(),
                c.getDescription(),
                c.getEvidenceImages(),
                c.getStatus(),
                c.getAdminNotes(),
                c.getReplacementTrackingNumber(),
                c.getReturnTrackingNumber(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
