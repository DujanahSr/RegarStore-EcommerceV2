package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.dto.PageResponse;
import com.regarsport.order.dto.*;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Processing", description = "Endpoints for order checkout, tracking, and status administration")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Checkout order", description = "Create order and publish OrderCreatedEvent to RabbitMQ pipeline")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Customer") String customerName,
            @RequestHeader(value = "X-User-Email", defaultValue = "customer@regarsport.com") String customerEmail,
            @Valid @RequestBody CheckoutRequest request
    ) {
        OrderResponse response = orderService.checkout(userId, customerName, customerEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details", description = "Retrieve full order details including line items")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role
    ) {
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)
                || "ROLE_LOGISTICS".equalsIgnoreCase(role) || "LOGISTICS".equalsIgnoreCase(role);
        OrderResponse response = orderService.getOrderById(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get my orders", description = "Retrieve paginated order history for the logged-in user")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> response = orderService.getMyOrders(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Admin: Get all orders", description = "Retrieve all platform orders with optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> response = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Admin: Update order status", description = "Update the processing status of an order")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        OrderResponse response = orderService.updateOrderStatus(id, request.status(), role);
        return ResponseEntity.ok(ApiResponse.success("Status pesanan berhasil diperbarui", response));
    }

    @PatchMapping("/{id}/ship")
    @Operation(summary = "Admin/Logistics: Ship order", description = "Fulfill order by adding courier name and tracking number")
    public ResponseEntity<ApiResponse<OrderResponse>> shipOrder(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role,
            @Valid @RequestBody com.regarsport.order.dto.ShipOrderRequest request
    ) {
        OrderResponse response = orderService.shipOrder(id, request, role);
        return ResponseEntity.ok(ApiResponse.success("Pesanan berhasil dikirim dengan nomor resi", response));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Customer/Admin: Complete order", description = "Confirm order receipt and mark as completed")
    public ResponseEntity<ApiResponse<OrderResponse>> completeOrder(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role
    ) {
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)
                || "ROLE_LOGISTICS".equalsIgnoreCase(role) || "LOGISTICS".equalsIgnoreCase(role);
        OrderResponse response = orderService.completeOrder(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Pesanan telah selesai dan berhasil diterima", response));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Customer/Admin: Cancel order", description = "Cancel pending order with reason")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role,
            @RequestBody(required = false) CancelOrderRequest request
    ) {
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
        String reason = request != null ? request.reason() : "Dibatalkan oleh pelanggan";
        OrderResponse response = orderService.cancelOrder(id, userId, isAdmin, reason);
        return ResponseEntity.ok(ApiResponse.success("Pesanan berhasil dibatalkan", response));
    }

    // --- VOUCHER & PROMO DISCOUNTS ---

    @GetMapping("/vouchers")
    @Operation(summary = "List all vouchers", description = "Retrieve list of all promotion vouchers")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getAllVouchers() {
        List<VoucherResponse> response = orderService.getAllVouchers();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/vouchers")
    @Operation(summary = "Admin: Create voucher", description = "Create new discount promo code")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(@Valid @RequestBody VoucherRequest request) {
        VoucherResponse response = orderService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kupon promo berhasil dibuat", response));
    }

    @PatchMapping("/vouchers/{id}/toggle")
    @Operation(summary = "Admin: Toggle voucher active", description = "Activate or deactivate voucher")
    public ResponseEntity<ApiResponse<VoucherResponse>> toggleVoucher(@PathVariable Long id) {
        VoucherResponse response = orderService.toggleVoucher(id);
        return ResponseEntity.ok(ApiResponse.success("Status kupon berhasil diperbarui", response));
    }

    @DeleteMapping("/vouchers/{id}")
    @Operation(summary = "Admin: Delete voucher", description = "Delete voucher by ID")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        orderService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success("Kupon promo berhasil dihapus", null));
    }

    @PostMapping("/vouchers/validate")
    @Operation(summary = "Customer: Validate voucher", description = "Check if voucher code is valid and compute discount")
    public ResponseEntity<ApiResponse<VoucherValidateResponse>> validateVoucher(@Valid @RequestBody VoucherValidateRequest request) {
        VoucherValidateResponse response = orderService.validateVoucher(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
