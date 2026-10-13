package com.regarsport.order.mapper;

import com.regarsport.order.dto.CartItemRequest;
import com.regarsport.order.dto.CartItemResponse;
import com.regarsport.order.entity.CartItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class CartMapper {

    public CartItemResponse toResponse(CartItem item) {
        if (item == null) return null;
        BigDecimal subtotal = (item.getPrice() != null && item.getQuantity() != null)
                ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                : BigDecimal.ZERO;

        return new CartItemResponse(
                item.getId(),
                item.getUserId(),
                item.getProductId(),
                item.getProductName(),
                item.getProductImage(),
                item.getSize() != null ? item.getSize() : "L",
                item.getCustomName(),
                item.getCustomNumber(),
                item.getCustomCollar(),
                item.getCustomTeam(),
                item.getPrice(),
                item.getQuantity(),
                subtotal
        );
    }

    public CartItem toEntity(CartItemRequest request) {
        if (request == null) return null;
        return CartItem.builder()
                .productId(request.productId())
                .productName(request.productName())
                .productImage(request.productImage())
                .size(request.size() != null && !request.size().isBlank() ? request.size() : "L")
                .customName(request.customName() != null ? request.customName().trim().toUpperCase() : null)
                .customNumber(request.customNumber() != null ? request.customNumber().trim() : null)
                .customCollar(request.customCollar() != null ? request.customCollar().trim() : null)
                .customTeam(request.customTeam() != null ? request.customTeam().trim().toUpperCase() : null)
                .price(request.price())
                .quantity(request.quantity())
                .build();
    }
}
