package com.regarsport.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WarrantyClaimRequest(
    @NotNull(message = "Order ID is required")
    Long orderId,

    @NotBlank(message = "Order Number is required")
    String orderNumber,

    @NotNull(message = "Product ID is required")
    Long productId,

    @NotBlank(message = "Product Name is required")
    String productName,

    String productImage,

    @NotBlank(message = "Category is required")
    String category,

    @NotBlank(message = "Solution is required")
    String solution,

    String requestedSize,

    @NotBlank(message = "Description is required")
    String description,

    String evidenceImages
) {
}
