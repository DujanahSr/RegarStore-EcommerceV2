package com.regarsport.catalog.service;

import com.regarsport.catalog.entity.ProcessedEvent;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.repository.ProcessedEventRepository;
import com.regarsport.catalog.repository.ProductRepository;
import com.regarsport.common.event.OrderItemEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Sinkron stok dari event pesanan. Tiap event diterapkan tepat sekali per pesanan (tabel processed_events),
 * jadi redelivery RabbitMQ tidak mengurangi/mengembalikan stok dua kali.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockSyncService {

    private final ProductRepository productRepository;
    private final ProcessedEventRepository processedEventRepository;

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void reserve(Long orderId, List<OrderItemEventPayload> items) {
        if (!markProcessed(createdKey(orderId))) {
            return;
        }
        items.forEach(item -> adjust(item, -item.quantity()));
        log.info("Stock reserved for orderId {}", orderId);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void release(Long orderId, List<OrderItemEventPayload> items) {
        // Hanya kembalikan stok yang memang pernah dikurangi untuk pesanan ini
        if (!processedEventRepository.existsById(createdKey(orderId)) || !markProcessed("ORDER_CANCELLED:" + orderId)) {
            return;
        }
        items.forEach(item -> adjust(item, item.quantity()));
        log.info("Stock released for orderId {}", orderId);
    }

    /** false kalau event sudah pernah diterapkan. PK event_key jadi penjaga terakhir untuk event duplikat yang bersamaan. */
    private boolean markProcessed(String eventKey) {
        if (processedEventRepository.existsById(eventKey)) {
            log.info("Skip duplicate event {}", eventKey);
            return false;
        }
        processedEventRepository.saveAndFlush(new ProcessedEvent(eventKey));
        return true;
    }

    private void adjust(OrderItemEventPayload item, int delta) {
        Product product = productRepository.findById(item.productId()).orElse(null);
        if (product == null) {
            log.warn("Product {} not found, stock adjustment {} skipped", item.productId(), delta);
            return;
        }
        if (product.getSizeStocks().isEmpty()) {
            product.setStock(clamp(product.getStock(), delta, product, "total"));
        } else {
            String size = item.size();
            product.getSizeStocks().put(size, clamp(product.getSizeStocks().getOrDefault(size, 0), delta, product, size));
            product.recalculateTotalStock();
        }
    }

    // Stok sudah dicek order-service saat checkout; clamp 0 hanya jaga-jaga kalau dua checkout berebut sisa stok yang sama
    private static int clamp(int current, int delta, Product product, String size) {
        int next = current + delta;
        if (next < 0) {
            log.warn("Oversold product {} size {}: stock {} + {} clamped to 0", product.getId(), size, current, delta);
        }
        return Math.max(0, next);
    }

    private static String createdKey(Long orderId) {
        return "ORDER_CREATED:" + orderId;
    }
}
