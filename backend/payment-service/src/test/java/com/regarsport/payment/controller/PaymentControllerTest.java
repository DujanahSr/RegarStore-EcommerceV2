package com.regarsport.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.payment.dto.MidtransWebhookPayload;
import com.regarsport.payment.dto.PaymentResponse;
import com.regarsport.payment.entity.PaymentStatus;
import com.regarsport.payment.service.PaymentService;
import com.regarsport.payment.service.WebhookService;
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

@WebMvcTest(controllers = PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PaymentController WebMvc Tests")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private WebhookService webhookService;

    @Test
    @DisplayName("POST /api/v1/payments/midtrans/webhook should return 200 OK")
    void testWebhookEndpoint_Success() throws Exception {
        MidtransWebhookPayload payload = new MidtransWebhookPayload(
                "REGAR-12345", "tx-1", "settlement", "200", "350000.00", "qris", "sig", "accept", "2026-09-15"
        );

        when(webhookService.processMidtransWebhook(any(MidtransWebhookPayload.class)))
                .thenReturn("Webhook processed successfully");

        mockMvc.perform(post("/api/v1/payments/midtrans/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Webhook processed successfully"));
    }

    @Test
    @DisplayName("GET /api/v1/payments/order/{orderId} should return 200 OK and payment detail")
    void testGetPaymentByOrderId_Success() throws Exception {
        PaymentResponse response = new PaymentResponse(
                1L, 10L, "REGAR-12345", "customer@regarsport.com", "Customer",
                new BigDecimal("350000.00"), PaymentStatus.SETTLEMENT, "qris",
                "SNAP-123", "https://redirect", Instant.now(), Instant.now()
        );

        when(paymentService.getPaymentByOrderId(10L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/payments/order/10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderId").value(10))
                .andExpect(jsonPath("$.data.paymentStatus").value("SETTLEMENT"));
    }
}
