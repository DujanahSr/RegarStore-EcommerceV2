package com.regarsport.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.payment.dto.MidtransWebhookPayload;
import com.regarsport.payment.dto.PaymentResponse;
import com.regarsport.payment.dto.SnapTokenRequest;
import com.regarsport.payment.entity.PaymentStatus;
import com.regarsport.payment.entity.PaymentTransaction;
import com.regarsport.payment.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MidtransService midtransService;
    private final WebhookService webhookService;

    @Transactional
    public PaymentResponse initializePaymentForOrder(OrderCreatedEvent event) {
        log.info("Initializing payment transaction for orderId: {}, orderNumber: {}",
                event.orderId(), event.orderNumber());

        Optional<PaymentTransaction> existing = paymentTransactionRepository.findByOrderId(event.orderId());
        if (existing.isPresent()) {
            PaymentTransaction tx = existing.get();
            if (tx.getSnapToken() == null || tx.getSnapToken().startsWith("SNAP-TOKEN-")) {
                MidtransService.SnapResult snapResult = midtransService.createSnapToken(
                        event.orderNumber(),
                        event.totalAmount(),
                        event.customerName(),
                        event.customerEmail()
                );
                tx.setSnapToken(snapResult.token());
                tx.setSnapRedirectUrl(snapResult.redirectUrl());
                return toResponse(paymentTransactionRepository.save(tx));
            }
            return toResponse(tx);
        }

        MidtransService.SnapResult snapResult = midtransService.createSnapToken(
                event.orderNumber(),
                event.totalAmount(),
                event.customerName(),
                event.customerEmail()
        );

        PaymentTransaction transaction = PaymentTransaction.builder()
                .orderId(event.orderId())
                .orderNumber(event.orderNumber())
                .customerEmail(event.customerEmail())
                .customerName(event.customerName())
                .amount(event.totalAmount())
                .paymentStatus(PaymentStatus.PENDING)
                .snapToken(snapResult.token())
                .snapRedirectUrl(snapResult.redirectUrl())
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);
        log.info("Created payment transaction id: {} with Snap token: {}", saved.getId(), saved.getSnapToken());
        return toResponse(saved);
    }

    @Transactional
    public PaymentResponse createSnapTokenManual(SnapTokenRequest request) {
        log.info("Manual Snap token request for order: {}", request.orderNumber());

        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(request.orderId())
                .orElseGet(() -> {
                    MidtransService.SnapResult snapResult = midtransService.createSnapToken(
                            request.orderNumber(),
                            request.amount(),
                            request.customerName(),
                            request.customerEmail()
                    );
                    return PaymentTransaction.builder()
                            .orderId(request.orderId())
                            .orderNumber(request.orderNumber())
                            .customerEmail(request.customerEmail())
                            .customerName(request.customerName())
                            .amount(request.amount())
                            .paymentStatus(PaymentStatus.PENDING)
                            .snapToken(snapResult.token())
                            .snapRedirectUrl(snapResult.redirectUrl())
                            .build();
                });

        if (transaction.getSnapToken() == null || transaction.getSnapToken().startsWith("SNAP-TOKEN-")) {
            MidtransService.SnapResult snapResult = midtransService.createSnapToken(
                    request.orderNumber(),
                    request.amount(),
                    request.customerName(),
                    request.customerEmail()
            );
            transaction.setSnapToken(snapResult.token());
            transaction.setSnapRedirectUrl(snapResult.redirectUrl());
        }

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);
        return toResponse(saved);
    }

    public PaymentResponse getPaymentByOrderId(Long orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for orderId: " + orderId));
        return toResponse(transaction);
    }

    @Transactional
    public PaymentResponse syncStatusFromMidtrans(String orderNumber) {
        log.info("Syncing payment status with Midtrans for orderNumber: {}", orderNumber);
        JsonNode statusNode = midtransService.checkTransactionStatus(orderNumber);

        if (statusNode != null) {
            String txStatus = statusNode.path("transaction_status").asText("");
            String fraudStatus = statusNode.path("fraud_status").asText("");
            String paymentType = statusNode.path("payment_type").asText("");
            String transactionId = statusNode.path("transaction_id").asText("");
            String grossAmount = statusNode.path("gross_amount").asText("");
            String statusCode = statusNode.path("status_code").asText("");
            // Respons status API Midtrans menyertakan signature_key dengan rumus yang sama seperti webhook
            String signatureKey = statusNode.path("signature_key").asText("");

            log.info("Midtrans live status for {}: txStatus={}, fraudStatus={}", orderNumber, txStatus, fraudStatus);

            if ("settlement".equalsIgnoreCase(txStatus)
                    || ("capture".equalsIgnoreCase(txStatus) && "accept".equalsIgnoreCase(fraudStatus))
                    || "expire".equalsIgnoreCase(txStatus)
                    || "cancel".equalsIgnoreCase(txStatus)
                    || "deny".equalsIgnoreCase(txStatus)) {
                MidtransWebhookPayload payload = new MidtransWebhookPayload(
                        orderNumber,
                        transactionId,
                        txStatus,
                        statusCode,
                        grossAmount,
                        paymentType,
                        signatureKey,
                        fraudStatus,
                        ""
                );
                webhookService.processMidtransWebhook(payload);
            }
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for order: " + orderNumber));
        return toResponse(transaction);
    }

    private PaymentResponse toResponse(PaymentTransaction tx) {
        return new PaymentResponse(
                tx.getId(),
                tx.getOrderId(),
                tx.getOrderNumber(),
                tx.getCustomerEmail(),
                tx.getCustomerName(),
                tx.getAmount(),
                tx.getPaymentStatus(),
                tx.getPaymentType(),
                tx.getSnapToken(),
                tx.getSnapRedirectUrl(),
                tx.getPaidAt(),
                tx.getCreatedAt()
        );
    }
}
