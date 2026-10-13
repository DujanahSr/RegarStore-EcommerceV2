package com.regarsport.common.event;

import java.io.Serializable;
import java.util.List;

/** Dipublish order-service saat pesanan dibatalkan / kedaluwarsa; catalog-service mengembalikan stoknya. */
public record OrderCancelledEvent(
    Long orderId,
    String orderNumber,
    List<OrderItemEventPayload> items
) implements Serializable {}
