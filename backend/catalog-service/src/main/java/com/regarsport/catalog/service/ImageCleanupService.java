package com.regarsport.catalog.service;

import com.regarsport.catalog.repository.CategoryRepository;
import com.regarsport.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Hapus gambar lama dari storage (Cloudinary) setelah commit, kalau sudah tidak dipakai produk/kategori mana pun. */
@Service
@RequiredArgsConstructor
public class ImageCleanupService {

    private final StorageService storageService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public void deleteIfUnused(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()
                || productRepository.existsByImageUrl(imageUrl) || categoryRepository.existsByImageUrl(imageUrl)) {
            return;
        }
        // Setelah commit: kalau transaksi rollback, gambar tetap aman
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    storageService.delete(imageUrl);
                }
            });
        } else {
            storageService.delete(imageUrl);
        }
    }
}
