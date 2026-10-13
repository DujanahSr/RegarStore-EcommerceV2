package com.regarsport.catalog.service;

import com.regarsport.catalog.dto.CategoryRequest;
import com.regarsport.catalog.dto.CategoryResponse;
import com.regarsport.catalog.entity.Category;
import com.regarsport.catalog.mapper.CategoryMapper;
import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CategoryService Unit Tests")
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @Mock
    private ImageCleanupService imageCleanupService;

    @InjectMocks
    private CategoryService categoryService;

    private Category sampleCategory;
    private CategoryResponse sampleResponse;
    private CategoryRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleCategory = Category.builder()
                .id(1L)
                .name("Sepatu Futsal")
                .imageUrl("https://example.com/futsal.jpg")
                .createdAt(Instant.now())
                .build();

        sampleResponse = new CategoryResponse(1L, "Sepatu Futsal", "https://example.com/futsal.jpg", Instant.now());
        sampleRequest = new CategoryRequest("Sepatu Futsal", "https://example.com/futsal.jpg");
    }

    @Test
    @DisplayName("Should return all categories successfully")
    void testGetAllCategories_Success() {
        when(categoryRepository.findAll()).thenReturn(List.of(sampleCategory));
        when(categoryMapper.toResponse(sampleCategory)).thenReturn(sampleResponse);

        List<CategoryResponse> results = categoryService.getAllCategories();

        assertThat(results).isNotEmpty();
        assertThat(results).hasSize(1);
        assertThat(results.get(0).name()).isEqualTo("Sepatu Futsal");
        verify(categoryRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return category by ID when exists")
    void testGetCategoryById_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryMapper.toResponse(sampleCategory)).thenReturn(sampleResponse);

        CategoryResponse result = categoryService.getCategoryById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Sepatu Futsal");
        verify(categoryRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when category not found")
    void testGetCategoryById_NotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Category not found with id: 99");

        verify(categoryRepository, times(1)).findById(99L);
    }

    @Test
    @DisplayName("Should create category successfully when name is unique")
    void testCreateCategory_Success() {
        when(categoryRepository.existsByNameIgnoreCase("Sepatu Futsal")).thenReturn(false);
        when(categoryMapper.toEntity(sampleRequest)).thenReturn(sampleCategory);
        when(categoryRepository.save(any(Category.class))).thenReturn(sampleCategory);
        when(categoryMapper.toResponse(sampleCategory)).thenReturn(sampleResponse);

        CategoryResponse result = categoryService.createCategory(sampleRequest);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Sepatu Futsal");
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when creating duplicate category name")
    void testCreateCategory_DuplicateName() {
        when(categoryRepository.existsByNameIgnoreCase("Sepatu Futsal")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(sampleRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Category already exists");

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    @DisplayName("Should delete category by ID when exists")
    void testDeleteCategory_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        doNothing().when(categoryRepository).delete(sampleCategory);

        categoryService.deleteCategory(1L);

        verify(categoryRepository, times(1)).findById(1L);
        verify(categoryRepository, times(1)).delete(sampleCategory);
    }
}
