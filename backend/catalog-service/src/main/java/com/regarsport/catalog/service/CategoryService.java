package com.regarsport.catalog.service;

import com.regarsport.catalog.dto.CategoryRequest;
import com.regarsport.catalog.dto.CategoryResponse;
import com.regarsport.catalog.entity.Category;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.mapper.CategoryMapper;
import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ImageCleanupService imageCleanupService;

    public List<CategoryResponse> getAllCategories() {
        log.info("Fetching all categories from database (cache miss)");
        return categoryRepository.findAll()
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Cacheable(value = "categories", key = "#id")
    public CategoryResponse getCategoryById(Long id) {
        log.info("Fetching category by id: {} from database", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return categoryMapper.toResponse(category);
    }

    @Transactional
    @CacheEvict(value = {"categories", "products"}, allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Creating new category: {}", request.name());
        if (categoryRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new BadRequestException("Category already exists: " + request.name());
        }

        Category category = categoryMapper.toEntity(request);
        category.setName(request.name().trim());
        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"categories", "products"}, allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        log.info("Updating category id: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String trimmedName = request.name().trim();
        if (!category.getName().equalsIgnoreCase(trimmedName) && categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new BadRequestException("Category name already in use: " + trimmedName);
        }

        String oldImageUrl = category.getImageUrl();
        categoryMapper.updateEntityFromRequest(request, category);
        category.setName(trimmedName);
        Category updated = categoryRepository.save(category);
        if (!Objects.equals(oldImageUrl, updated.getImageUrl())) {
            imageCleanupService.deleteIfUnused(oldImageUrl);
        }
        return categoryMapper.toResponse(updated);
    }

    @Transactional
    @CacheEvict(value = {"categories", "products"}, allEntries = true)
    public void deleteCategory(Long id) {
        log.info("Deleting category id: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        // Produk ikut terhapus (cascade), jadi gambar produknya juga dibersihkan
        List<String> imageUrls = new ArrayList<>(category.getProducts().stream().map(Product::getImageUrl).toList());
        imageUrls.add(category.getImageUrl());
        categoryRepository.delete(category);
        imageUrls.forEach(imageCleanupService::deleteIfUnused);
    }
}
