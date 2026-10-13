package com.regarsport.order.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WishlistResponse(
    Long id,
    Long userId,
    Long productId,
    String productName,
    String productImage,
    BigDecimal price,
    Instant createdAt
) {
}
