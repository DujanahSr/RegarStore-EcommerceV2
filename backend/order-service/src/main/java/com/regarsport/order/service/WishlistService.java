package com.regarsport.order.service;

import com.regarsport.order.dto.WishlistRequest;
import com.regarsport.order.dto.WishlistResponse;
import com.regarsport.order.entity.WishlistItem;
import com.regarsport.order.mapper.WishlistMapper;
import com.regarsport.order.repository.WishlistItemRepository;
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
public class WishlistService {

    private final WishlistItemRepository wishlistRepository;
    private final WishlistMapper wishlistMapper;

    public List<WishlistResponse> getUserWishlist(Long userId) {
        log.info("Fetching wishlist items for userId: {}", userId);
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(wishlistMapper::toResponse)
                .toList();
    }

    @Transactional
    public WishlistResponse addToWishlist(Long userId, WishlistRequest request) {
        log.info("Adding product id: {} to wishlist for userId: {}", request.productId(), userId);

        Optional<WishlistItem> existing = wishlistRepository.findByUserIdAndProductId(userId, request.productId());
        if (existing.isPresent()) {
            WishlistItem item = existing.get();
            item.setProductName(request.productName());
            item.setPrice(request.price());
            if (request.productImage() != null) {
                item.setProductImage(request.productImage());
            }
            WishlistItem saved = wishlistRepository.save(item);
            return wishlistMapper.toResponse(saved);
        }

        WishlistItem newItem = wishlistMapper.toEntity(request, userId);
        WishlistItem saved = wishlistRepository.save(newItem);
        return wishlistMapper.toResponse(saved);
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        log.info("Removing product id: {} from wishlist for userId: {}", productId, userId);
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    @Transactional
    public void clearWishlist(Long userId) {
        log.info("Clearing all wishlist items for userId: {}", userId);
        wishlistRepository.deleteByUserId(userId);
    }
}
