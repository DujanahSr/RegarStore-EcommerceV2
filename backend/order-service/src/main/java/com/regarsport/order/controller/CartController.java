package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.order.dto.CartItemRequest;
import com.regarsport.order.dto.CartItemResponse;
import com.regarsport.order.dto.UpdateCartQuantityRequest;
import com.regarsport.order.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Shopping Cart", description = "Endpoints for managing user shopping cart items")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get user cart", description = "Retrieve all items currently in the authenticated user's cart")
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> getUserCart(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId
    ) {
        List<CartItemResponse> cart = cartService.getUserCart(userId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping
    @Operation(summary = "Add item to cart", description = "Add a product item to the shopping cart")
    public ResponseEntity<ApiResponse<CartItemResponse>> addToCart(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @Valid @RequestBody CartItemRequest request
    ) {
        CartItemResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added to cart", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update item quantity", description = "Update the quantity of an item in the cart")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateQuantity(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCartQuantityRequest request
    ) {
        CartItemResponse response = cartService.updateCartQuantity(userId, id, request.quantity());
        return ResponseEntity.ok(ApiResponse.success("Cart item quantity updated", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove item from cart", description = "Remove a single item from the cart")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @PathVariable Long id
    ) {
        cartService.removeCartItem(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", null));
    }

    @DeleteMapping
    @Operation(summary = "Clear shopping cart", description = "Remove all items from the shopping cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId
    ) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Shopping cart cleared", null));
    }
}
