package com.regarsport.order.repository;

import com.regarsport.order.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
    Optional<CartItem> findByUserIdAndProductIdAndSize(Long userId, Long productId, String size);
    Optional<CartItem> findByUserIdAndProductIdAndSizeAndCustomName(Long userId, Long productId, String size, String customName);
    void deleteByUserId(Long userId);
    void deleteByUserIdAndProductIdIn(Long userId, List<Long> productIds);
}
