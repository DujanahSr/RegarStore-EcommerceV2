package com.regarsport.order.service;

import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.dto.CartItemRequest;
import com.regarsport.order.dto.CartItemResponse;
import com.regarsport.order.entity.CartItem;
import com.regarsport.order.mapper.CartMapper;
import com.regarsport.order.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final CartMapper cartMapper;

    @Transactional
    public CartItemResponse addToCart(Long userId, CartItemRequest request) {
        String itemSize = (request.size() != null && !request.size().isBlank()) ? request.size().trim() : "L";
        String customName = (request.customName() != null && !request.customName().isBlank()) ? request.customName().trim().toUpperCase() : null;
        log.info("Adding item to cart for userId: {}, productId: {}, size: {}, custom: {}", userId, request.productId(), itemSize, customName);

        Optional<CartItem> existing = customName != null
                ? cartItemRepository.findByUserIdAndProductIdAndSizeAndCustomName(userId, request.productId(), itemSize, customName)
                : cartItemRepository.findByUserIdAndProductIdAndSize(userId, request.productId(), itemSize);

        CartItem item;
        if (existing.isPresent()) {
            item = existing.get();
            item.setQuantity(item.getQuantity() + request.quantity());
            item.setPrice(request.price());
            item.setProductName(request.productName());
            if (request.productImage() != null) {
                item.setProductImage(request.productImage());
            }
        } else {
            item = cartMapper.toEntity(request);
            item.setUserId(userId);
            item.setSize(itemSize);
        }

        CartItem saved = cartItemRepository.save(item);
        return cartMapper.toResponse(saved);
    }

    public List<CartItemResponse> getUserCart(Long userId) {
        log.info("Fetching cart for userId: {}", userId);
        return cartItemRepository.findByUserId(userId)
                .stream()
                .map(cartMapper::toResponse)
                .toList();
    }

    @Transactional
    public CartItemResponse updateCartQuantity(Long userId, Long cartItemId, Integer newQuantity) {
        log.info("Updating cart quantity for itemId: {}, newQty: {}", cartItemId, newQuantity);
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        if (!item.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You can only update your own cart");
        }

        item.setQuantity(newQuantity);
        CartItem updated = cartItemRepository.save(item);
        return cartMapper.toResponse(updated);
    }

    @Transactional
    public void removeCartItem(Long userId, Long cartItemId) {
        log.info("Removing cart item id: {} for userId: {}", cartItemId, userId);
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        if (!item.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You can only remove your own cart items");
        }

        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(Long userId) {
        log.info("Clearing cart for userId: {}", userId);
        cartItemRepository.deleteByUserId(userId);
    }
}
