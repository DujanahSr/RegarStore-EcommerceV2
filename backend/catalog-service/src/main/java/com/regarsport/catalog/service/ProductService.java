package com.regarsport.catalog.service;

import com.regarsport.catalog.dto.ProductRequest;
import com.regarsport.catalog.dto.ProductResponse;
import com.regarsport.catalog.entity.Category;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.mapper.ProductMapper;
import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.catalog.repository.ProductRepository;
import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.exception.InsufficientStockException;
import com.regarsport.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final ImageCleanupService imageCleanupService;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(
            String search,
            Long categoryId,
            int page,
            int size,
            String sortBy,
            String sortOrder
    ) {
        log.info("Fetching products with search: '{}', categoryId: {}, page: {}, size: {}", search, categoryId, page, size);
        Sort sort = "desc".equalsIgnoreCase(sortOrder)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)), sort);

        Page<Product> productPage;
        String trimmedSearch = (search != null && !search.trim().isBlank()) ? search.trim() : null;
        boolean hasCategory = categoryId != null;

        if (trimmedSearch != null && hasCategory) {
            productPage = productRepository.searchByCategoryAndName(categoryId, trimmedSearch, pageable);
        } else if (trimmedSearch != null) {
            productPage = productRepository.searchByName(trimmedSearch, pageable);
            if (productPage.isEmpty() && trimmedSearch.contains(" ")) {
                // Multi-word fallback: search by individual meaningful words
                String[] words = trimmedSearch.split("\\s+");
                for (String word : words) {
                    String w = word.trim();
                    if (w.length() >= 3 && !w.equalsIgnoreCase("jersey") && !w.equalsIgnoreCase("dan")) {
                        Page<Product> fallbackPage = productRepository.searchByName(w, pageable);
                        if (!fallbackPage.isEmpty()) {
                            productPage = fallbackPage;
                            break;
                        }
                    }
                }
            }
        } else if (hasCategory) {
            productPage = productRepository.findByCategoryId(categoryId, pageable);
        } else {
            productPage = productRepository.findAllWithCategory(pageable);
        }

        var content = productPage.getContent().stream()
                .map(productMapper::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                productPage.getNumber() + 1,
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                productPage.isFirst(),
                productPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#id")
    public ProductResponse getProductById(Long id) {
        log.info("Fetching product by id: {} (cache miss)", id);
        Product product = productRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return productMapper.toResponse(product);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product: {}", request.name());
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));

        Product product = productMapper.toEntity(request);
        product.setCategory(category);
        product.setName(request.name().trim());

        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product id: {}", id);
        Product product = productRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!product.getCategory().getId().equals(request.categoryId())) {
            Category newCategory = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));
            product.setCategory(newCategory);
        }

        String oldImageUrl = product.getImageUrl();
        productMapper.updateEntityFromRequest(request, product);
        product.setName(request.name().trim());

        Product updated = productRepository.save(product);
        if (!Objects.equals(oldImageUrl, updated.getImageUrl())) {
            imageCleanupService.deleteIfUnused(oldImageUrl);
        }
        return productMapper.toResponse(updated);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        log.info("Deleting product id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        productRepository.delete(product);
        imageCleanupService.deleteIfUnused(product.getImageUrl());
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateStock(Long id, Integer quantityChange, String size) {
        log.info("Updating stock for product id: {}, delta: {}, size: {}", id, quantityChange, size);
        Product product = productRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        var sizes = product.getSizeStocks();
        if (size != null && !size.isBlank()) {
            String targetSize = size.trim();
            int currentSizeStock = sizes.getOrDefault(targetSize, 0);
            int newSizeStock = currentSizeStock + quantityChange;

            if (newSizeStock < 0) {
                throw new InsufficientStockException(
                        String.format("Stok tidak mencukupi untuk ukuran '%s' produk '%s'. Permintaan: %d, Tersedia: %d",
                                targetSize, product.getName(), Math.abs(quantityChange), currentSizeStock)
                );
            }

            sizes.put(targetSize, newSizeStock);
            product.recalculateTotalStock();
        } else {
            int newStock = product.getStock() + quantityChange;
            if (newStock < 0) {
                throw new InsufficientStockException(
                        String.format("Insufficient stock for product '%s'. Requested change: %d, Available: %d",
                                product.getName(), quantityChange, product.getStock())
                );
            }
            product.setStock(newStock);
        }

        Product updated = productRepository.save(product);
        return productMapper.toResponse(updated);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateStock(Long id, Integer quantityChange) {
        return updateStock(id, quantityChange, null);
    }
}
