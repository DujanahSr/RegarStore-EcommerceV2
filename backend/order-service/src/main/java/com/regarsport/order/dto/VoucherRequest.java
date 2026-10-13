package com.regarsport.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record VoucherRequest(
        @NotBlank(message = "Kode voucher wajib diisi")
        String code,

        @NotBlank(message = "Nama promo wajib diisi")
        String name,

        String discountType, // "PERCENTAGE" or "FIXED_AMOUNT"

        @NotNull(message = "Nilai diskon wajib diisi")
        @Positive(message = "Nilai diskon harus lebih dari 0")
        BigDecimal discountValue,

        BigDecimal minSpend,
        BigDecimal maxDiscount,
        Integer usageLimit,
        Boolean isActive,
        Instant validUntil
) {}
