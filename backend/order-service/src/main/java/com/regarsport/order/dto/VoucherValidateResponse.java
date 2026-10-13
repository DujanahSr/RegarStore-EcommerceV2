package com.regarsport.order.dto;

import java.math.BigDecimal;

public record VoucherValidateResponse(
        boolean valid,
        String message,
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal discountAmount,
        BigDecimal finalAmount
) {}
