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
import com.regarsport.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookLogRepository webhookLogRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentEventProducer paymentEventProducer;
    private final ObjectMapper objectMapper;

    @Value("${midtrans.server-key:}")
    private String serverKey;

    @Transactional
    public String processMidtransWebhook(MidtransWebhookPayload payload) {
        // Validasi dulu sebelum menyimpan apa pun, supaya webhook palsu tidak bisa "mengunci" idempotency key
        verifySignature(payload);

        String idempotencyKey = payload.orderId() + "_" + payload.transactionStatus();
        log.info("Processing Midtrans Webhook with idempotencyKey: {}", idempotencyKey);

        if (webhookLogRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.warn("Duplicate webhook callback detected for key: {}. Skipping execution to prevent duplicate transactions.", idempotencyKey);
            return "Already processed";
        }

        Optional<PaymentTransaction> txOpt = paymentTransactionRepository.findByOrderNumber(payload.orderId());
        if (txOpt.isEmpty() && payload.orderId() != null && payload.orderId().contains("-R")) {
            String baseOrderNumber = payload.orderId().substring(0, payload.orderId().lastIndexOf("-R"));
            txOpt = paymentTransactionRepository.findByOrderNumber(baseOrderNumber);
        }
        if (txOpt.isEmpty()) {
            log.warn("PaymentTransaction not found for orderNumber: {}", payload.orderId());
            return "Order transaction record not found";
        }

        PaymentTransaction transaction = txOpt.get();
        verifyAmount(payload, transaction);

        String rawPayload = "";
        try {
            rawPayload = objectMapper.writeValueAsString(payload);
        } catch (Exception ignored) {}

        // Unique constraint idempotency_key = penjaga terakhir untuk webhook duplikat yang datang bersamaan
        WebhookLog logEntry = webhookLogRepository.saveAndFlush(WebhookLog.builder()
                .idempotencyKey(idempotencyKey)
                .orderNumber(payload.orderId())
                .transactionStatus(payload.transactionStatus())
                .payload(rawPayload)
                .processed(false)
                .build());

        String txStatus = payload.transactionStatus() != null ? payload.transactionStatus().toLowerCase() : "";
        PaymentStatus newStatus;
        boolean isSuccess = false;

        if ("settlement".equals(txStatus) || ("capture".equals(txStatus) && "accept".equalsIgnoreCase(payload.fraudStatus()))) {
            newStatus = PaymentStatus.SETTLEMENT;
            isSuccess = true;
            transaction.setPaidAt(Instant.now());
        } else if ("expire".equals(txStatus)) {
            newStatus = PaymentStatus.EXPIRE;
        } else if ("cancel".equals(txStatus) || "deny".equals(txStatus)) {
            newStatus = PaymentStatus.CANCEL;
        } else {
            newStatus = PaymentStatus.PENDING;
        }

        transaction.setPaymentStatus(newStatus);
        transaction.setMidtransTransactionId(payload.transactionId());
        transaction.setPaymentType(payload.paymentType());
        paymentTransactionRepository.save(transaction);

        // Publish event to RabbitMQ; order-service marks the order PAID and triggers the e-invoice email
        PaymentStatusUpdatedEvent event = new PaymentStatusUpdatedEvent(
                transaction.getOrderId(),
                transaction.getOrderNumber(),
                isSuccess ? "PAID" : newStatus.name(),
                payload.paymentType(),
                transaction.getAmount(),
                transaction.getPaidAt() != null ? transaction.getPaidAt() : Instant.now(),
                transaction.getCustomerName(),
                transaction.getCustomerEmail()
        );
        paymentEventProducer.publishPaymentStatusUpdated(event);

        logEntry.setProcessed(true);
        webhookLogRepository.save(logEntry);

        log.info("Successfully completed processing for idempotencyKey: {}, newStatus: {}", idempotencyKey, newStatus);
        return "Webhook processed successfully";
    }

    /** signature_key = SHA512(order_id + status_code + gross_amount + server_key), sesuai dokumentasi Midtrans. */
    private void verifySignature(MidtransWebhookPayload payload) {
        String expected = sha512Hex(payload.orderId() + payload.statusCode() + payload.grossAmount() + serverKey);
        String given = payload.signatureKey() != null ? payload.signatureKey().toLowerCase() : "";
        if (serverKey.isBlank() || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8))) {
            log.warn("Rejected Midtrans webhook with invalid signature for orderId: {}", payload.orderId());
            throw new BadRequestException("Signature webhook Midtrans tidak valid");
        }
    }

    private void verifyAmount(MidtransWebhookPayload payload, PaymentTransaction transaction) {
        try {
            if (new BigDecimal(payload.grossAmount()).compareTo(transaction.getAmount()) == 0) {
                return;
            }
        } catch (NumberFormatException | NullPointerException ignored) {
            // gross_amount kosong / bukan angka -> ditolak di bawah
        }
        log.warn("Rejected Midtrans webhook for orderId: {} - gross_amount {} != {}", payload.orderId(), payload.grossAmount(), transaction.getAmount());
        throw new BadRequestException("Nominal pembayaran tidak sesuai dengan transaksi");
    }

    static String sha512Hex(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-512").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
