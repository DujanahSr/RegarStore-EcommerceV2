package com.regarsport.order.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record VoucherResponse(
        Long id,
        String code,
        String name,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minSpend,
        BigDecimal maxDiscount,
        Integer usageLimit,
        Integer usedCount,
        Boolean isActive,
        Instant validUntil,
        Instant createdAt
) {}
