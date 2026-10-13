package com.regarsport.common.event;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Dipublish order-service sekali saat pesanan berubah menjadi PAID; dipakai notification-service untuk e-invoice. */
public record OrderPaidEvent(
    Long orderId,
    String orderNumber,
    String customerName,
    String customerEmail,
    String customerPhone,
    String recipientName,
    String shippingAddress,
    String shippingCity,
    String shippingPostalCode,
    String voucherCode,
    BigDecimal discountAmount,
    BigDecimal totalAmount,
    String paymentType,
    Instant orderedAt,
    Instant paidAt,
    List<OrderItemEventPayload> items
) implements Serializable {}
