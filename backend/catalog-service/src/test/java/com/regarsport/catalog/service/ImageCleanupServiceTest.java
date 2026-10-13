package com.regarsport.catalog.service;

import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.catalog.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageCleanupServiceTest {

    private static final String URL = "https://res.cloudinary.com/demo/image/upload/v1/regarstore/products/a.png";

    @Mock
    private StorageService storageService;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ImageCleanupService imageCleanupService;

    @Test
    void deletesImageNoLongerUsed() {
        when(productRepository.existsByImageUrl(URL)).thenReturn(false);
        when(categoryRepository.existsByImageUrl(URL)).thenReturn(false);

        imageCleanupService.deleteIfUnused(URL);

        verify(storageService).delete(URL);
    }

    @Test
    void keepsImageStillUsedByAnotherProduct() {
        when(productRepository.existsByImageUrl(URL)).thenReturn(true);

        imageCleanupService.deleteIfUnused(URL);

        verify(storageService, never()).delete(any());
    }
}
