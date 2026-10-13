package com.regarsport.order.dto;

import com.regarsport.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long id,
    String orderNumber,
    Long userId,
    String customerName,
    String customerEmail,
    String customerPhone,
    String recipientName,
    BigDecimal totalAmount,
    String shippingAddress,
    String shippingCity,
    String shippingPostalCode,
    String shippingNotes,
    String shippingCourier,
    String trackingNumber,
    String voucherCode,
    BigDecimal discountAmount,
    String cancellationReason,
    OrderStatus status,
    List<OrderItemResponse> items,
    Instant shippedAt,
    Instant completedAt,
    Instant createdAt,
    Instant updatedAt
) {
    public OrderResponse(
        Long id,
        String orderNumber,
        Long userId,
        String customerName,
        String customerEmail,
        BigDecimal totalAmount,
        String shippingAddress,
        String shippingCourier,
        String trackingNumber,
        OrderStatus status,
        List<OrderItemResponse> items,
        Instant shippedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
    ) {
        this(id, orderNumber, userId, customerName, customerEmail, null, customerName, totalAmount, shippingAddress, null, null, null, shippingCourier, trackingNumber, null, BigDecimal.ZERO, null, status, items, shippedAt, completedAt, createdAt, updatedAt);
    }

    public OrderResponse(
        Long id,
        String orderNumber,
        Long userId,
        String customerName,
        String customerEmail,
        BigDecimal totalAmount,
        String shippingAddress,
        OrderStatus status,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
    ) {
        this(id, orderNumber, userId, customerName, customerEmail, null, customerName, totalAmount, shippingAddress, null, null, null, null, null, null, BigDecimal.ZERO, null, status, items, null, null, createdAt, updatedAt);
    }
}
