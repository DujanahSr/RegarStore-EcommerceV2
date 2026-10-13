package com.regarsport.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.order.dto.CheckoutItemRequest;
import com.regarsport.order.dto.CheckoutRequest;
import com.regarsport.order.dto.OrderResponse;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.service.OrderService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OrderController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("OrderController WebMvc Tests")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/v1/orders/checkout should return 201 Created")
    void testCheckoutEndpoint_Success() throws Exception {
        CheckoutItemRequest itemReq = new CheckoutItemRequest(100L, "L", 1);
        CheckoutRequest request = new CheckoutRequest("Jl. Dago No. 10, Bandung", List.of(itemReq));

        OrderResponse response = new OrderResponse(
                1L, "REGAR-12345", 1L, "Customer", "customer@regarsport.com",
                new BigDecimal("350000.00"), "Jl. Dago No. 10, Bandung", OrderStatus.PENDING,
                List.of(), Instant.now(), Instant.now()
        );

        when(orderService.checkout(anyLong(), anyString(), anyString(), any(CheckoutRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("REGAR-12345"));
    }

    @Test
    @DisplayName("POST /api/v1/orders/checkout with empty shipping address should return 400 Bad Request")
    void testCheckoutEndpoint_EmptyAddress_Returns400() throws Exception {
        CheckoutRequest request = new CheckoutRequest("", List.of());

        mockMvc.perform(post("/api/v1/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} should return 200 OK")
    void testGetOrderByIdEndpoint_Success() throws Exception {
        OrderResponse response = new OrderResponse(
                1L, "REGAR-12345", 1L, "Customer", "customer@regarsport.com",
                new BigDecimal("350000.00"), "Jl. Dago No. 10, Bandung", OrderStatus.PENDING,
                List.of(), Instant.now(), Instant.now()
        );

        when(orderService.getOrderById(eq(1L), anyLong(), anyBoolean()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }
}
