package com.regarsport.catalog.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
    Long id,
    Long categoryId,
    String categoryName,
    String name,
    String description,
    BigDecimal price,
    Integer stock,
    String imageUrl,
    java.util.Map<String, Integer> sizeStocks,
    Instant createdAt,
    Instant updatedAt
) implements Serializable {

    public ProductResponse(
            Long id,
            Long categoryId,
            String categoryName,
            String name,
            String description,
            BigDecimal price,
            Integer stock,
            String imageUrl,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(id, categoryId, categoryName, name, description, price, stock, imageUrl, java.util.Collections.emptyMap(), createdAt, updatedAt);
    }
}
