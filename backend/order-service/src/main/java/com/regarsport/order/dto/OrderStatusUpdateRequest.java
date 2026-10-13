package com.regarsport.order.dto;

import com.regarsport.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
    @NotNull(message = "Order status is required")
    OrderStatus status
) {}
