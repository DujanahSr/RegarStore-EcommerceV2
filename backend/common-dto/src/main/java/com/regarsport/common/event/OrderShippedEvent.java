package com.regarsport.common.event;

import java.io.Serializable;
import java.time.Instant;

public record OrderShippedEvent(
    Long orderId,
    String orderNumber,
    String customerName,
    String customerEmail,
    String shippingCourier,
    String trackingNumber,
    Instant shippedAt
) implements Serializable {}
