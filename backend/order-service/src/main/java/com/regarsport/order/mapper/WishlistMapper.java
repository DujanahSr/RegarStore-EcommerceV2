package com.regarsport.order.mapper;

import com.regarsport.order.dto.WishlistRequest;
import com.regarsport.order.dto.WishlistResponse;
import com.regarsport.order.entity.WishlistItem;
import org.springframework.stereotype.Component;

@Component
public class WishlistMapper {

    public WishlistResponse toResponse(WishlistItem item) {
        if (item == null) return null;
        return new WishlistResponse(
                item.getId(),
                item.getUserId(),
                item.getProductId(),
                item.getProductName(),
                item.getProductImage(),
                item.getPrice(),
                item.getCreatedAt()
        );
    }

    public WishlistItem toEntity(WishlistRequest request, Long userId) {
        if (request == null) return null;
        return WishlistItem.builder()
                .userId(userId)
                .productId(request.productId())
                .productName(request.productName())
                .productImage(request.productImage())
                .price(request.price())
                .build();
    }
}
