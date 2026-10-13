package com.regarsport.common.event;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderCreatedEvent(
    Long orderId,
    String orderNumber,
    Long userId,
    String customerName,
    String customerEmail,
    BigDecimal totalAmount,
    String shippingAddress,
    List<OrderItemEventPayload> items,
    Instant createdAt
) implements Serializable {}
