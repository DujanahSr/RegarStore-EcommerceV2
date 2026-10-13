package com.regarsport.order.dto;

import java.time.Instant;

public record WarrantyClaimResponse(
    Long id,
    String claimNumber,
    Long orderId,
    String orderNumber,
    Long userId,
    Long productId,
    String productName,
    String productImage,
    String category,
    String solution,
    String requestedSize,
    String description,
    String evidenceImages,
    String status,
    String adminNotes,
    String replacementTrackingNumber,
    String returnTrackingNumber,
    Instant createdAt,
    Instant updatedAt
) {
}
