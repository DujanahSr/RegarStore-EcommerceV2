package com.regarsport.payment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record MidtransWebhookPayload(
    @JsonProperty("order_id")
    @JsonAlias({"orderId", "order_id"})
    String orderId,

    @JsonProperty("transaction_id")
    @JsonAlias({"transactionId", "transaction_id"})
    String transactionId,

    @JsonProperty("transaction_status")
    @JsonAlias({"transactionStatus", "transaction_status"})
    String transactionStatus,

    @JsonProperty("status_code")
    @JsonAlias({"statusCode", "status_code"})
    String statusCode,

    @JsonProperty("gross_amount")
    @JsonAlias({"grossAmount", "gross_amount"})
    String grossAmount,

    @JsonProperty("payment_type")
    @JsonAlias({"paymentType", "payment_type"})
    String paymentType,

    @JsonProperty("signature_key")
    @JsonAlias({"signatureKey", "signature_key"})
    String signatureKey,

    @JsonProperty("fraud_status")
    @JsonAlias({"fraudStatus", "fraud_status"})
    String fraudStatus,

    @JsonProperty("settlement_time")
    @JsonAlias({"settlementTime", "settlement_time"})
    String settlementTime
) {}
