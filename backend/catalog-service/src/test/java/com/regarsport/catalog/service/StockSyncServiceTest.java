package com.regarsport.catalog.service;

import com.regarsport.catalog.entity.ProcessedEvent;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.repository.ProcessedEventRepository;
import com.regarsport.catalog.repository.ProductRepository;
import com.regarsport.common.event.OrderItemEventPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockSyncServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProcessedEventRepository processedEventRepository;

    @InjectMocks
    private StockSyncService stockSyncService;

    private final Set<String> processed = new HashSet<>();
    private Product product;
    private final List<OrderItemEventPayload> items =
            List.of(new OrderItemEventPayload(1L, "Jersey", 2, new BigDecimal("249000"), "L", null, null, null, null));

    @BeforeEach
    void setUp() {
        product = Product.builder().id(1L).name("Jersey").price(new BigDecimal("249000")).stock(0)
                .sizeStocks(new LinkedHashMap<>(java.util.Map.of("L", 5, "M", 3))).build();
        product.recalculateTotalStock();

        // processed_events disimulasikan dengan Set di memori
        lenient().when(processedEventRepository.existsById(anyString())).thenAnswer(inv -> processed.contains(inv.<String>getArgument(0)));
        lenient().when(processedEventRepository.saveAndFlush(any(ProcessedEvent.class))).thenAnswer(inv -> {
            processed.add(inv.<ProcessedEvent>getArgument(0).getEventKey());
            return inv.getArgument(0);
        });
        lenient().when(productRepository.findById(1L)).thenReturn(Optional.of(product));
    }

    @Test
    void reserveDecrementsSizeStockExactlyOnce() {
        stockSyncService.reserve(10L, items);
        stockSyncService.reserve(10L, items); // redelivery RabbitMQ

        assertThat(product.getSizeStocks().get("L")).isEqualTo(3);
        assertThat(product.getStock()).isEqualTo(6);
    }

    @Test
    void releaseWithoutReserveDoesNothing() {
        stockSyncService.release(10L, items);

        assertThat(product.getSizeStocks().get("L")).isEqualTo(5);
    }

    @Test
    void releaseAfterReserveRestoresStockExactlyOnce() {
        stockSyncService.reserve(10L, items);
        stockSyncService.release(10L, items);
        stockSyncService.release(10L, items); // redelivery RabbitMQ

        assertThat(product.getSizeStocks().get("L")).isEqualTo(5);
        assertThat(product.getStock()).isEqualTo(8);
    }

    @Test
    void reserveNeverGoesBelowZero() {
        stockSyncService.reserve(11L, List.of(new OrderItemEventPayload(1L, "Jersey", 9, BigDecimal.ONE, "M", null, null, null, null)));

        assertThat(product.getSizeStocks().get("M")).isZero();
    }
}
