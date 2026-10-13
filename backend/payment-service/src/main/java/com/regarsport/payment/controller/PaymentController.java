package com.regarsport.payment.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.payment.dto.MidtransWebhookPayload;
import com.regarsport.payment.dto.PaymentResponse;
import com.regarsport.payment.dto.SnapTokenRequest;
import com.regarsport.payment.service.PaymentService;
import com.regarsport.payment.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment & Checkout Gateway", description = "Endpoints for Midtrans Snap Token, webhook processing, and transaction status")
public class PaymentController {

    private final PaymentService paymentService;
    private final WebhookService webhookService;

    @PostMapping("/create-token")
    @Operation(summary = "Generate Snap Token", description = "Generate Midtrans Snap Payment Token for an order")
    public ResponseEntity<ApiResponse<PaymentResponse>> createSnapToken(@Valid @RequestBody SnapTokenRequest request) {
        PaymentResponse response = paymentService.createSnapTokenManual(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment Snap token generated", response));
    }

    @PostMapping("/midtrans/webhook")
    @Operation(summary = "Midtrans Notification Webhook", description = "Receives payment status notifications from Midtrans with strict idempotency handling")
    public ResponseEntity<ApiResponse<String>> handleMidtransWebhook(@RequestBody MidtransWebhookPayload payload) {
        log.info("Received webhook notification for orderId: {}, status: {}", payload.orderId(), payload.transactionStatus());
        String result = webhookService.processMidtransWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success(result, result));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment by order ID", description = "Retrieve payment transaction status for a specific order")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(@PathVariable Long orderId) {
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/sync/{orderNumber}")
    @Operation(summary = "Sync payment status from Midtrans", description = "Query Midtrans API and sync status to database")
    public ResponseEntity<ApiResponse<PaymentResponse>> syncStatusFromMidtrans(@PathVariable String orderNumber) {
        PaymentResponse response = paymentService.syncStatusFromMidtrans(orderNumber);
        return ResponseEntity.ok(ApiResponse.success("Payment status synchronized", response));
    }
}
