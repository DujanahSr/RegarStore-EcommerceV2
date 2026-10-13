package com.regarsport.catalog.mapper;

import com.regarsport.catalog.dto.ProductRequest;
import com.regarsport.catalog.dto.ProductResponse;
import com.regarsport.catalog.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        if (product == null) return null;
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        java.util.Map<String, Integer> safeSizeStocks = new java.util.LinkedHashMap<>();
        try {
            if (product.getSizeStocks() != null) {
                safeSizeStocks.putAll(product.getSizeStocks());
            }
        } catch (Exception ignored) {
        }

        if (safeSizeStocks.isEmpty()) {
            boolean isShoe = (categoryName != null && categoryName.toLowerCase().contains("sepatu"));
            int baseStock = (product.getStock() != null && product.getStock() > 0) ? product.getStock() : 50;
            if (isShoe) {
                String[] shoeSizes = {"39", "40", "41", "42", "43", "44"};
                int perSize = Math.max(1, baseStock / shoeSizes.length);
                for (String s : shoeSizes) safeSizeStocks.put(s, perSize);
            } else {
                String[] apparelSizes = {"S", "M", "L", "XL", "XXL"};
                int perSize = Math.max(1, baseStock / apparelSizes.length);
                for (String s : apparelSizes) safeSizeStocks.put(s, perSize);
            }
        }

        return new ProductResponse(
                product.getId(),
                categoryId,
                categoryName,
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getImageUrl(),
                safeSizeStocks,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    public Product toEntity(ProductRequest request) {
        if (request == null) return null;
        Product product = Product.builder()
                .name(request.name().trim())
                .description(request.description())
                .price(request.price())
                .stock(request.stock())
                .imageUrl(request.imageUrl())
                .build();

        if (request.sizeStocks() != null && !request.sizeStocks().isEmpty()) {
            product.setSizeStocks(new java.util.LinkedHashMap<>(request.sizeStocks()));
            product.recalculateTotalStock();
        } else {
            product.initDefaultSizeStocks();
        }
        return product;
    }

    public void updateEntityFromRequest(ProductRequest request, Product product) {
        if (request == null || product == null) return;
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setImageUrl(request.imageUrl());

        if (request.sizeStocks() != null && !request.sizeStocks().isEmpty()) {
            product.setSizeStocks(new java.util.LinkedHashMap<>(request.sizeStocks()));
            product.recalculateTotalStock();
        } else {
            product.setStock(request.stock());
            product.initDefaultSizeStocks();
        }
    }
}
