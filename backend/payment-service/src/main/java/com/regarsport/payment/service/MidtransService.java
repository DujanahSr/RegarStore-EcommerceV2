package com.regarsport.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class MidtransService {

    @Value("${midtrans.server-key:SB-Mid-server-TEST_KEY_12345}")
    private String serverKey;

    @Value("${midtrans.is-production:false}")
    private boolean isProduction;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record SnapResult(String token, String redirectUrl) {}

    public SnapResult createSnapToken(String orderNumber, BigDecimal amount, String customerName, String customerEmail) {
        log.info("Generating Midtrans Snap token for order: {}, amount: {}", orderNumber, amount);

        // If a real Midtrans Server Key is configured, connect directly to official Midtrans Snap API
        if (serverKey != null && !serverKey.isBlank() && !serverKey.contains("TEST_KEY")) {
            try {
                String snapApiUrl = isProduction
                        ? "https://app.midtrans.com/snap/v1/transactions"
                        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

                String authHeader = "Basic " + Base64.getEncoder().encodeToString((serverKey.trim() + ":").getBytes(StandardCharsets.UTF_8));

                Map<String, Object> transactionDetails = new HashMap<>();
                transactionDetails.put("order_id", orderNumber);
                transactionDetails.put("gross_amount", amount.longValue());

                Map<String, Object> customerDetails = new HashMap<>();
                customerDetails.put("first_name", (customerName != null && !customerName.isBlank()) ? customerName : "Customer");
                customerDetails.put("email", (customerEmail != null && !customerEmail.isBlank()) ? customerEmail : "customer@regarsport.com");

                Map<String, Object> callbacks = new HashMap<>();
                String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl : "http://localhost:5173";
                callbacks.put("finish", baseUrl + "/dashboard/my-orders");
                callbacks.put("unfinish", baseUrl + "/dashboard/my-orders");
                callbacks.put("error", baseUrl + "/dashboard/my-orders");

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("transaction_details", transactionDetails);
                requestBody.put("customer_details", customerDetails);
                requestBody.put("callbacks", callbacks);

                String jsonBody = objectMapper.writeValueAsString(requestBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(snapApiUrl))
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .header("Authorization", authHeader)
                        .timeout(Duration.ofSeconds(15))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode root = objectMapper.readTree(response.body());
                    String token = root.path("token").asText();
                    String redirectUrl = root.path("redirect_url").asText();

                    if (token != null && !token.isBlank()) {
                        log.info("Successfully received official Snap token from Midtrans: {}", token);
                        return new SnapResult(token, redirectUrl);
                    }
                } else if (response.statusCode() == 400 && response.body().contains("order_id")) {
                    log.info("Order ID already taken in Midtrans, retrying with unique suffix for order: {}", orderNumber);
                    String retryOrderId = orderNumber + "-R" + (System.currentTimeMillis() % 10000);
                    transactionDetails.put("order_id", retryOrderId);
                    String retryJson = objectMapper.writeValueAsString(requestBody);
                    HttpRequest retryRequest = HttpRequest.newBuilder()
                            .uri(URI.create(snapApiUrl))
                            .header("Content-Type", "application/json")
                            .header("Accept", "application/json")
                            .header("Authorization", authHeader)
                            .timeout(Duration.ofSeconds(15))
                            .POST(HttpRequest.BodyPublishers.ofString(retryJson, StandardCharsets.UTF_8))
                            .build();
                    HttpResponse<String> retryResponse = httpClient.send(retryRequest, HttpResponse.BodyHandlers.ofString());
                    if (retryResponse.statusCode() >= 200 && retryResponse.statusCode() < 300) {
                        JsonNode root = objectMapper.readTree(retryResponse.body());
                        String token = root.path("token").asText();
                        String redirectUrl = root.path("redirect_url").asText();
                        if (token != null && !token.isBlank()) {
                            log.info("Successfully received Snap token from retry: {}", token);
                            return new SnapResult(token, redirectUrl);
                        }
                    } else {
                        log.warn("Midtrans Snap retry failed with HTTP {}: {}", retryResponse.statusCode(), retryResponse.body());
                    }
                } else {
                    log.warn("Midtrans Snap API returned HTTP {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.error("Failed to connect to Midtrans Snap API, falling back to local simulation", e);
            }
        }

        // Fallback for development/offline testing
        String token = "SNAP-TOKEN-" + UUID.randomUUID().toString();
        String redirectUrl = isProduction
                ? "https://app.midtrans.com/snap/v2/vtweb/" + token
                : "https://app.sandbox.midtrans.com/snap/v2/vtweb/" + token;

        return new SnapResult(token, redirectUrl);
    }

    public boolean verifySignature(String orderId, String statusCode, String grossAmount, String signatureKey) {
        if (signatureKey == null || signatureKey.isBlank()) {
            return false;
        }

        String raw = orderId + statusCode + grossAmount + serverKey;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().equalsIgnoreCase(signatureKey);
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-512 algorithm not available", e);
            return false;
        }
    }

    public JsonNode checkTransactionStatus(String orderNumber) {
        if (serverKey == null || serverKey.isBlank() || serverKey.contains("TEST_KEY")) {
            return null;
        }

        try {
            String statusUrl = (isProduction ? "https://api.midtrans.com/v2/" : "https://api.sandbox.midtrans.com/v2/")
                    + orderNumber + "/status";

            String authHeader = "Basic " + Base64.getEncoder().encodeToString((serverKey.trim() + ":").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(statusUrl))
                    .header("Accept", "application/json")
                    .header("Authorization", authHeader)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
        } catch (Exception e) {
            log.error("Failed to check status from Midtrans for order: {}", orderNumber, e);
        }
        return null;
    }
}
