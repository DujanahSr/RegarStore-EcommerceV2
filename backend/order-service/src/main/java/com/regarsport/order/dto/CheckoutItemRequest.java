package com.regarsport.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Harga, nama, dan gambar produk sengaja tidak diterima dari client; order-service mengambilnya dari catalog-service. */
public record CheckoutItemRequest(
    @NotNull(message = "Product ID is required")
    Long productId,
    String size,
    String customName,
    String customNumber,
    String customCollar,
    String customTeam,
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity
) {
    public CheckoutItemRequest(Long productId, String size, Integer quantity) {
        this(productId, size, null, null, null, null, quantity);
    }
}
