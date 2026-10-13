package com.regarsport.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record VoucherValidateRequest(
        @NotBlank(message = "Kode voucher wajib diisi")
        String code,

        @NotNull(message = "Total belanja wajib diisi")
        @Positive(message = "Total belanja harus lebih dari 0")
        BigDecimal subtotal
) {}
