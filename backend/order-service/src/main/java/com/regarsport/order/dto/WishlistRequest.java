package com.regarsport.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record WishlistRequest(
    @NotNull(message = "Product ID is required")
    Long productId,

    @NotBlank(message = "Product name is required")
    String productName,

    String productImage,

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than zero")
    BigDecimal price
) {
}
