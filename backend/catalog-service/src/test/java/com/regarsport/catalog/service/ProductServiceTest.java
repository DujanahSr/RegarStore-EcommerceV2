package com.regarsport.catalog.service;

import com.regarsport.catalog.dto.ProductRequest;
import com.regarsport.catalog.dto.ProductResponse;
import com.regarsport.catalog.entity.Category;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.mapper.ProductMapper;
import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.catalog.repository.ProductRepository;
import com.regarsport.common.exception.InsufficientStockException;
import com.regarsport.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Unit Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ImageCleanupService imageCleanupService;

    @InjectMocks
    private ProductService productService;

    private Category sampleCategory;
    private Product sampleProduct;
    private ProductResponse sampleResponse;
    private ProductRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleCategory = Category.builder()
                .id(1L)
                .name("Jersey")
                .build();

        sampleProduct = Product.builder()
                .id(100L)
                .category(sampleCategory)
                .name("Jersey Timnas Indonesia")
                .description("Jersey Home Replica 2024")
                .price(new BigDecimal("350000.00"))
                .stock(25)
                .imageUrl("https://example.com/jersey.jpg")
                .version(1L)
                .createdAt(Instant.now())
                .build();

        sampleResponse = new ProductResponse(
                100L,
                1L,
                "Jersey",
                "Jersey Timnas Indonesia",
                "Jersey Home Replica 2024",
                new BigDecimal("350000.00"),
                25,
                "https://example.com/jersey.jpg",
                Instant.now(),
                Instant.now()
        );

        sampleRequest = new ProductRequest(
                1L,
                "Jersey Timnas Indonesia",
                "Jersey Home Replica 2024",
                new BigDecimal("350000.00"),
                25,
                "https://example.com/jersey.jpg"
        );
    }

    @Test
    @DisplayName("Should return product by ID when exists")
    void testGetProductById_Success() {
        when(productRepository.findByIdWithCategory(100L)).thenReturn(Optional.of(sampleProduct));
        when(productMapper.toResponse(sampleProduct)).thenReturn(sampleResponse);

        ProductResponse result = productService.getProductById(100L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(100L);
        assertThat(result.name()).isEqualTo("Jersey Timnas Indonesia");
        assertThat(result.price()).isEqualByComparingTo(new BigDecimal("350000.00"));
        verify(productRepository, times(1)).findByIdWithCategory(100L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when product not found")
    void testGetProductById_NotFound() {
        when(productRepository.findByIdWithCategory(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Product not found with id: 999");

        verify(productRepository, times(1)).findByIdWithCategory(999L);
    }

    @Test
    @DisplayName("Should create product successfully when category exists")
    void testCreateProduct_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productMapper.toEntity(sampleRequest)).thenReturn(sampleProduct);
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
        when(productMapper.toResponse(sampleProduct)).thenReturn(sampleResponse);

        ProductResponse result = productService.createProduct(sampleRequest);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Jersey Timnas Indonesia");
        assertThat(result.stock()).isEqualTo(25);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("Should update stock successfully when available stock is sufficient")
    void testUpdateStock_SufficientStock_Success() {
        when(productRepository.findByIdWithCategory(100L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductResponse updatedResponse = new ProductResponse(
                100L, 1L, "Jersey", "Jersey Timnas Indonesia",
                "Desc", new BigDecimal("350000.00"), 20, "url", Instant.now(), Instant.now()
        );
        when(productMapper.toResponse(sampleProduct)).thenReturn(updatedResponse);

        ProductResponse result = productService.updateStock(100L, -5);

        assertThat(result).isNotNull();
        assertThat(sampleProduct.getStock()).isEqualTo(20);
        verify(productRepository, times(1)).save(sampleProduct);
    }

    @Test
    @DisplayName("Should throw InsufficientStockException when reducing stock below zero")
    void testUpdateStock_InsufficientStock_ThrowsException() {
        when(productRepository.findByIdWithCategory(100L)).thenReturn(Optional.of(sampleProduct));

        assertThatThrownBy(() -> productService.updateStock(100L, -30))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock for product 'Jersey Timnas Indonesia'");

        verify(productRepository, never()).save(any(Product.class));
    }
}
