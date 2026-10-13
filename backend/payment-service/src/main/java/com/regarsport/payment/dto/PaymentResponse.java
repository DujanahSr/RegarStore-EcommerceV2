package com.regarsport.payment.dto;

import com.regarsport.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    Long orderId,
    String orderNumber,
    String customerEmail,
    String customerName,
    BigDecimal amount,
    PaymentStatus paymentStatus,
    String paymentType,
    String snapToken,
    String snapRedirectUrl,
    Instant paidAt,
    Instant createdAt
) {}
