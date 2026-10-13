package com.regarsport.catalog.dto;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public record ReviewResponse(
    Long id,
    Long productId,
    String productName,
    String productImage,
    Long userId,
    String customerName,
    String customerAvatar,
    Integer rating,
    String comment,
    List<String> images,
    Instant createdAt,
    Instant created_at,
    List<Map<String, Object>> review_replies,
    Map<String, Object> users,
    Map<String, Object> products
) implements Serializable {
    public ReviewResponse(
            Long id,
            Long productId,
            String productName,
            String productImage,
            Long userId,
            String customerName,
            String customerAvatar,
            Integer rating,
            String comment,
            Instant createdAt,
            Instant created_at,
            List<Map<String, Object>> review_replies,
            Map<String, Object> users,
            Map<String, Object> products
    ) {
        this(id, productId, productName, productImage, userId, customerName, customerAvatar, rating, comment, Collections.emptyList(), createdAt, created_at, review_replies, users, products);
    }
}
