package com.regarsport.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.catalog.dto.ProductRequest;
import com.regarsport.catalog.dto.ProductResponse;
import com.regarsport.catalog.service.ProductService;
import com.regarsport.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ProductController WebMvc Tests")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/v1/products/{id} should return 200 and product details")
    void testGetProductById_Success() throws Exception {
        ProductResponse response = new ProductResponse(
                1L, 1L, "Sepatu", "Specs Accelerator", "Sepatu futsal",
                new BigDecimal("499000.00"), 15, "https://example.com/img.jpg",
                Instant.now(), Instant.now()
        );

        when(productService.getProductById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Specs Accelerator"))
                .andExpect(jsonPath("$.data.stock").value(15));
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} should return 404 when product not found")
    void testGetProductById_NotFound() throws Exception {
        when(productService.getProductById(999L))
                .thenThrow(new ResourceNotFoundException("Product not found with id: 999"));

        mockMvc.perform(get("/api/v1/products/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Product not found with id: 999"));
    }

    @Test
    @DisplayName("POST /api/v1/products with invalid body should return 400 Bad Request")
    void testCreateProduct_InvalidBody_Returns400() throws Exception {
        ProductRequest invalidRequest = new ProductRequest(
                null, "", "", new BigDecimal("-100"), -5, ""
        );

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/v1/products with valid body should return 201 Created")
    void testCreateProduct_ValidBody_Returns201() throws Exception {
        ProductRequest validRequest = new ProductRequest(
                1L, "Specs Accelerator", "Sepatu futsal",
                new BigDecimal("499000.00"), 15, "https://example.com/img.jpg"
        );

        ProductResponse response = new ProductResponse(
                1L, 1L, "Sepatu", "Specs Accelerator", "Sepatu futsal",
                new BigDecimal("499000.00"), 15, "https://example.com/img.jpg",
                Instant.now(), Instant.now()
        );

        when(productService.createProduct(any(ProductRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Specs Accelerator"));
    }
}
