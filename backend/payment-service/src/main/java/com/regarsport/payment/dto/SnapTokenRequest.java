package com.regarsport.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record SnapTokenRequest(
    @NotNull(message = "Order ID is required")
    Long orderId,

    @NotBlank(message = "Order number is required")
    String orderNumber,

    @NotBlank(message = "Customer email is required")
    String customerEmail,

    @NotBlank(message = "Customer name is required")
    String customerName,

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    BigDecimal amount
) {}
