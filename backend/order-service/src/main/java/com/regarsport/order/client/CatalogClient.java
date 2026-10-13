package com.regarsport.order.client;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

/** Mengambil data produk resmi dari catalog-service, supaya harga checkout tidak bergantung pada kiriman browser. */
@Component
public class CatalogClient {

    public record CatalogProduct(Long id, String name, BigDecimal price, String imageUrl, Integer stock, Map<String, Integer> sizeStocks) {
        /** Stok per ukuran kalau produk punya ukuran, selain itu stok total. */
        public int availableStock(String size) {
            if (sizeStocks != null && !sizeStocks.isEmpty()) {
                return sizeStocks.getOrDefault(size, 0);
            }
            return stock != null ? stock : 0;
        }
    }

    private final RestClient restClient;

    public CatalogClient(RestClient.Builder builder, @Value("${catalog.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(5_000);
        this.restClient = builder.baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public CatalogProduct getProduct(Long productId) {
        ApiResponse<CatalogProduct> response;
        try {
            response = restClient.get()
                    .uri("/api/v1/products/{id}", productId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (HttpClientErrorException.NotFound e) {
            throw new BadRequestException("Produk dengan id " + productId + " tidak ditemukan atau sudah tidak dijual");
        }
        if (response == null || response.data() == null || response.data().price() == null) {
            throw new IllegalStateException("Respons catalog-service tidak valid untuk produk id " + productId);
        }
        return response.data();
    }
}
