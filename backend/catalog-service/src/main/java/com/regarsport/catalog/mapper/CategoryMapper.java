package com.regarsport.catalog.mapper;

import com.regarsport.catalog.dto.CategoryRequest;
import com.regarsport.catalog.dto.CategoryResponse;
import com.regarsport.catalog.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(Category category) {
        if (category == null) return null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getImageUrl(),
                category.getCreatedAt()
        );
    }

    public Category toEntity(CategoryRequest request) {
        if (request == null) return null;
        return Category.builder()
                .name(request.name().trim())
                .imageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null)
                .build();
    }

    public void updateEntityFromRequest(CategoryRequest request, Category category) {
        if (request == null || category == null) return;
        category.setName(request.name().trim());
        if (request.imageUrl() != null) {
            category.setImageUrl(request.imageUrl().trim());
        }
    }
}
