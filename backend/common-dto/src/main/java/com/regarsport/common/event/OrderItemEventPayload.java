package com.regarsport.common.event;

import java.io.Serializable;
import java.math.BigDecimal;

public record OrderItemEventPayload(
    Long productId,
    String productName,
    Integer quantity,
    BigDecimal price,
    String size,
    String customName,
    String customNumber,
    String customCollar,
    String customTeam
) implements Serializable {
    public OrderItemEventPayload(Long productId, String productName, Integer quantity, BigDecimal price) {
        this(productId, productName, quantity, price, "L", null, null, null, null);
    }
}
