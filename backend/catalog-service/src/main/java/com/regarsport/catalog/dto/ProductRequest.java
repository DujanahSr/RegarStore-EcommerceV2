package com.regarsport.catalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
    @NotNull(message = "Category ID is required")
    Long categoryId,

    @NotBlank(message = "Product name cannot be blank")
    @Size(min = 2, max = 200, message = "Product name must be between 2 and 200 characters")
    String name,

    String description,

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than zero")
    BigDecimal price,

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    Integer stock,

    String imageUrl,

    java.util.Map<String, Integer> sizeStocks
) {
    public ProductRequest(
            Long categoryId,
            String name,
            String description,
            BigDecimal price,
            Integer stock,
            String imageUrl
    ) {
        this(categoryId, name, description, price, stock, imageUrl, null);
    }
}
