package com.regarsport.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CartItemRequest(
    @NotNull(message = "Product ID is required")
    Long productId,

    @NotBlank(message = "Product name is required")
    String productName,

    String productImage,

    String size,

    String customName,
    String customNumber,
    String customCollar,
    String customTeam,

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than zero")
    BigDecimal price,

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity
) {
    public CartItemRequest(Long productId, String productName, String productImage, String size, BigDecimal price, Integer quantity) {
        this(productId, productName, productImage, size, null, null, null, null, price, quantity);
    }

    public CartItemRequest(Long productId, String productName, String productImage, BigDecimal price, Integer quantity) {
        this(productId, productName, productImage, "L", null, null, null, null, price, quantity);
    }
}
