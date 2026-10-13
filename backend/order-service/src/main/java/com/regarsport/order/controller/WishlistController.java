package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.order.dto.WishlistRequest;
import com.regarsport.order.dto.WishlistResponse;
import com.regarsport.order.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Endpoints for managing user wishlist items")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @Operation(summary = "Get user wishlist", description = "Retrieve all items currently in the authenticated user's wishlist")
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> getUserWishlist(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId
    ) {
        List<WishlistResponse> wishlist = wishlistService.getUserWishlist(userId);
        return ResponseEntity.ok(ApiResponse.success(wishlist));
    }

    @PostMapping
    @Operation(summary = "Add item to wishlist", description = "Add a product to the user's wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> addToWishlist(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @Valid @RequestBody WishlistRequest request
    ) {
        WishlistResponse response = wishlistService.addToWishlist(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Produk berhasil ditambahkan ke wishlist", response));
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Remove item from wishlist", description = "Remove a product from the user's wishlist by product ID")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @PathVariable Long productId
    ) {
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success("Produk berhasil dihapus dari wishlist", null));
    }

    @GetMapping("/check/{productId}")
    @Operation(summary = "Check if product is in wishlist", description = "Check whether a product is currently wishlisted by the user")
    public ResponseEntity<ApiResponse<Boolean>> checkWishlist(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @PathVariable Long productId
    ) {
        boolean inWishlist = wishlistService.isInWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(inWishlist));
    }

    @DeleteMapping
    @Operation(summary = "Clear user wishlist", description = "Remove all items from the authenticated user's wishlist")
    public ResponseEntity<ApiResponse<Void>> clearWishlist(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId
    ) {
        wishlistService.clearWishlist(userId);
        return ResponseEntity.ok(ApiResponse.success("Semua item wishlist berhasil dihapus", null));
    }
}
