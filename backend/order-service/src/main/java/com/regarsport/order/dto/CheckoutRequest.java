package com.regarsport.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CheckoutRequest(
    @NotBlank(message = "Shipping address cannot be blank")
    String shippingAddress,

    String customerPhone,
    String recipientName,
    String shippingCity,
    String shippingPostalCode,
    String shippingNotes,
    String voucherCode,

    @NotEmpty(message = "Checkout items cannot be empty")
    @Valid
    List<CheckoutItemRequest> items
) {
    public CheckoutRequest(String shippingAddress, List<CheckoutItemRequest> items) {
        this(shippingAddress, null, null, null, null, null, null, items);
    }
}
