package com.regarsport.order.mapper;

import com.regarsport.order.dto.OrderItemResponse;
import com.regarsport.order.dto.OrderResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {
        if (order == null) return null;
        List<OrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream().map(this::toItemResponse).toList()
                : Collections.emptyList();

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getUserId(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getCustomerPhone(),
                order.getRecipientName() != null ? order.getRecipientName() : order.getCustomerName(),
                order.getTotalAmount(),
                order.getShippingAddress(),
                order.getShippingCity(),
                order.getShippingPostalCode(),
                order.getShippingNotes(),
                order.getShippingCourier(),
                order.getTrackingNumber(),
                order.getVoucherCode(),
                order.getDiscountAmount() != null ? order.getDiscountAmount() : java.math.BigDecimal.ZERO,
                order.getCancellationReason(),
                order.getStatus(),
                itemResponses,
                order.getShippedAt(),
                order.getCompletedAt(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    public OrderItemResponse toItemResponse(OrderItem item) {
        if (item == null) return null;
        return new OrderItemResponse(
                item.getId(),
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
                item.getSubtotal()
        );
    }

    public List<OrderItemResponse> toItemResponseList(List<OrderItem> items) {
        if (items == null) return Collections.emptyList();
        return items.stream().map(this::toItemResponse).toList();
    }
}
