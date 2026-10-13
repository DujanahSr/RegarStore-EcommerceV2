package com.regarsport.common.event;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentStatusUpdatedEvent(
    Long orderId,
    String orderNumber,
    String paymentStatus,
    String paymentType,
    BigDecimal amount,
    Instant paidAt,
    String customerName,
    String customerEmail
) implements Serializable {
    public PaymentStatusUpdatedEvent(Long orderId, String orderNumber, String paymentStatus, String paymentType, BigDecimal amount, Instant paidAt) {
        this(orderId, orderNumber, paymentStatus, paymentType, amount, paidAt, null, null);
    }
}
