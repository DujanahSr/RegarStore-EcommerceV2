package com.regarsport.order.service;

import com.regarsport.order.dto.CartItemRequest;
import com.regarsport.order.dto.CartItemResponse;
import com.regarsport.order.entity.CartItem;
import com.regarsport.order.mapper.CartMapper;
import com.regarsport.order.repository.CartItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartService Unit Tests")
class CartServiceTest {

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private CartMapper cartMapper;

    @InjectMocks
    private CartService cartService;

    private CartItem sampleCartItem;
    private CartItemResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleCartItem = CartItem.builder()
                .id(1L)
                .userId(10L)
                .productId(100L)
                .productName("Jersey Timnas")
                .productImage("https://example.com/jersey.jpg")
                .price(new BigDecimal("350000.00"))
                .quantity(2)
                .createdAt(Instant.now())
                .build();

        sampleResponse = new CartItemResponse(
                1L, 10L, 100L, "Jersey Timnas", "https://example.com/jersey.jpg",
                new BigDecimal("350000.00"), 2, new BigDecimal("700000.00")
        );
    }

    @Test
    @DisplayName("Should add new item to cart successfully")
    void testAddToCart_NewItem_Success() {
        CartItemRequest request = new CartItemRequest(
                100L, "Jersey Timnas", "https://example.com/jersey.jpg", new BigDecimal("350000.00"), 2
        );

        when(cartItemRepository.findByUserIdAndProductIdAndSize(10L, 100L, "L")).thenReturn(Optional.empty());
        when(cartMapper.toEntity(request)).thenReturn(sampleCartItem);
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(sampleCartItem);
        when(cartMapper.toResponse(sampleCartItem)).thenReturn(sampleResponse);

        CartItemResponse result = cartService.addToCart(10L, request);

        assertThat(result).isNotNull();
        assertThat(result.productId()).isEqualTo(100L);
        assertThat(result.quantity()).isEqualTo(2);
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    @DisplayName("Should increment quantity when item already in cart")
    void testAddToCart_ExistingItem_IncrementsQuantity() {
        CartItemRequest request = new CartItemRequest(
                100L, "Jersey Timnas", "https://example.com/jersey.jpg", new BigDecimal("350000.00"), 1
        );

        when(cartItemRepository.findByUserIdAndProductIdAndSize(10L, 100L, "L")).thenReturn(Optional.of(sampleCartItem));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(sampleCartItem);
        when(cartMapper.toResponse(sampleCartItem)).thenReturn(sampleResponse);

        CartItemResponse result = cartService.addToCart(10L, request);

        assertThat(result).isNotNull();
        assertThat(sampleCartItem.getQuantity()).isEqualTo(3);
        verify(cartItemRepository, times(1)).save(sampleCartItem);
    }

    @Test
    @DisplayName("Should get user cart successfully")
    void testGetUserCart_Success() {
        when(cartItemRepository.findByUserId(10L)).thenReturn(List.of(sampleCartItem));
        when(cartMapper.toResponse(sampleCartItem)).thenReturn(sampleResponse);

        List<CartItemResponse> result = cartService.getUserCart(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).productName()).isEqualTo("Jersey Timnas");
        verify(cartItemRepository, times(1)).findByUserId(10L);
    }

    @Test
    @DisplayName("Should clear user cart successfully")
    void testClearCart_Success() {
        doNothing().when(cartItemRepository).deleteByUserId(10L);

        cartService.clearCart(10L);

        verify(cartItemRepository, times(1)).deleteByUserId(10L);
    }
}
