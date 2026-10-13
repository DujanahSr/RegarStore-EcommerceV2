package com.regarsport.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.payment.dto.MidtransWebhookPayload;
import com.regarsport.payment.entity.PaymentStatus;
import com.regarsport.payment.entity.PaymentTransaction;
import com.regarsport.payment.entity.WebhookLog;
import com.regarsport.payment.messaging.PaymentEventProducer;
import com.regarsport.payment.repository.PaymentTransactionRepository;
import com.regarsport.payment.repository.WebhookLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import com.regarsport.common.exception.BadRequestException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WebhookService Unit Tests - Idempotency & Lifecycle")
class WebhookServiceTest {

    @Mock
    private WebhookLogRepository webhookLogRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private PaymentEventProducer paymentEventProducer;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private WebhookService webhookService;

    private static final String SERVER_KEY = "SB-Mid-server-unit-test";

    private PaymentTransaction sampleTransaction;
    private MidtransWebhookPayload settlementPayload;

    /** Payload dengan signature_key valid (SHA512 order_id + status_code + gross_amount + server_key). */
    private static MidtransWebhookPayload signed(String status, String grossAmount) {
        String signature = WebhookService.sha512Hex("REGAR-12345" + "200" + grossAmount + SERVER_KEY);
        return new MidtransWebhookPayload("REGAR-12345", "tx-midtrans-999", status, "200",
                grossAmount, "qris", signature, "accept", "2026-09-15 02:00:00");
    }

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(webhookService, "serverKey", SERVER_KEY);
        sampleTransaction = PaymentTransaction.builder()
                .id(1L)
                .orderId(10L)
                .orderNumber("REGAR-12345")
                .customerEmail("customer@regarsport.com")
                .customerName("Customer")
                .amount(new BigDecimal("350000.00"))
                .paymentStatus(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        settlementPayload = signed("settlement", "350000.00");
    }

    @Test
    @DisplayName("Should process settlement webhook and publish event on first attempt")
    void testProcessWebhook_Success_FirstAttempt() {
        String expectedKey = "REGAR-12345_settlement";
        when(webhookLogRepository.existsByIdempotencyKey(expectedKey)).thenReturn(false);
        when(paymentTransactionRepository.findByOrderNumber("REGAR-12345")).thenReturn(Optional.of(sampleTransaction));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenReturn(sampleTransaction);
        when(webhookLogRepository.saveAndFlush(any(WebhookLog.class))).thenAnswer(i -> i.getArgument(0));
        doNothing().when(paymentEventProducer).publishPaymentStatusUpdated(any(PaymentStatusUpdatedEvent.class));

        String result = webhookService.processMidtransWebhook(settlementPayload);

        assertThat(result).isEqualTo("Webhook processed successfully");
        assertThat(sampleTransaction.getPaymentStatus()).isEqualTo(PaymentStatus.SETTLEMENT);
        assertThat(sampleTransaction.getPaidAt()).isNotNull();

        verify(paymentTransactionRepository, times(1)).save(sampleTransaction);
        verify(paymentEventProducer, times(1)).publishPaymentStatusUpdated(any(PaymentStatusUpdatedEvent.class));
    }

    @Test
    @DisplayName("Should reject duplicate webhook callback due to Idempotency Key check")
    void testProcessWebhook_Idempotency_DuplicateRejected() {
        String expectedKey = "REGAR-12345_settlement";
        when(webhookLogRepository.existsByIdempotencyKey(expectedKey)).thenReturn(true);

        String result = webhookService.processMidtransWebhook(settlementPayload);

        assertThat(result).isEqualTo("Already processed");

        // Verify that duplicate calls never re-execute transaction state update or event publishing
        verify(paymentTransactionRepository, never()).findByOrderNumber(anyString());
        verify(paymentTransactionRepository, never()).save(any());
        verify(paymentEventProducer, never()).publishPaymentStatusUpdated(any());
    }

    @Test
    @DisplayName("Should update status to EXPIRE when order expires")
    void testProcessWebhook_ExpireStatus() {
        MidtransWebhookPayload expirePayload = signed("expire", "350000.00");

        when(webhookLogRepository.existsByIdempotencyKey("REGAR-12345_expire")).thenReturn(false);
        when(paymentTransactionRepository.findByOrderNumber("REGAR-12345")).thenReturn(Optional.of(sampleTransaction));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenReturn(sampleTransaction);
        when(webhookLogRepository.saveAndFlush(any(WebhookLog.class))).thenAnswer(i -> i.getArgument(0));

        String result = webhookService.processMidtransWebhook(expirePayload);

        assertThat(result).isEqualTo("Webhook processed successfully");
        assertThat(sampleTransaction.getPaymentStatus()).isEqualTo(PaymentStatus.EXPIRE);
    }

    @Test
    @DisplayName("Should reject forged webhook (invalid signature) before touching idempotency log")
    void testProcessWebhook_InvalidSignature_Rejected() {
        MidtransWebhookPayload forged = new MidtransWebhookPayload("REGAR-12345", "tx-fake", "settlement", "200",
                "350000.00", "qris", "signature-palsu", "accept", null);

        assertThatThrownBy(() -> webhookService.processMidtransWebhook(forged))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Signature");

        verifyNoInteractions(webhookLogRepository, paymentTransactionRepository, paymentEventProducer);
    }

    @Test
    @DisplayName("Should reject webhook whose gross_amount differs from the transaction amount")
    void testProcessWebhook_AmountMismatch_Rejected() {
        MidtransWebhookPayload underpaid = signed("settlement", "1000.00");
        when(webhookLogRepository.existsByIdempotencyKey("REGAR-12345_settlement")).thenReturn(false);
        when(paymentTransactionRepository.findByOrderNumber("REGAR-12345")).thenReturn(Optional.of(sampleTransaction));

        assertThatThrownBy(() -> webhookService.processMidtransWebhook(underpaid))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Nominal");

        assertThat(sampleTransaction.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(webhookLogRepository, never()).saveAndFlush(any());
        verify(paymentEventProducer, never()).publishPaymentStatusUpdated(any());
    }
}
