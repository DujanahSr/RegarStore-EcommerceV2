package com.regarsport.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.regarsport.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Set;

/**
 * Verifikasi ID token dari Google Identity Services (tombol "Sign in with Google" di FE).
 */
@Slf4j
@Service
public class GoogleTokenVerifier {

    public record GoogleProfile(String sub, String email, String name, String picture) {}

    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.client-id:}")
    private String clientId;

    // ponytail: tokeninfo = 1 request ke Google per login; ganti ke verifikasi JWKS lokal kalau trafik login tinggi
    public GoogleProfile verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new BadRequestException("Login Google belum dikonfigurasi di server (GOOGLE_CLIENT_ID kosong).");
        }
        JsonNode claims;
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(
                            "https://oauth2.googleapis.com/tokeninfo?id_token=" + URLEncoder.encode(idToken, StandardCharsets.UTF_8)))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BadRequestException("Token Google tidak valid atau sudah kedaluwarsa. Silakan coba lagi.");
            }
            claims = objectMapper.readTree(response.body());
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to verify Google ID token: {}", e.getMessage());
            throw new BadRequestException("Gagal memverifikasi akun Google. Silakan coba lagi.");
        }

        if (!clientId.equals(claims.path("aud").asText())
                || !ISSUERS.contains(claims.path("iss").asText())
                || !"true".equals(claims.path("email_verified").asText())
                || claims.path("sub").asText().isBlank()
                || claims.path("email").asText().isBlank()) {
            throw new BadRequestException("Token Google tidak valid untuk aplikasi ini.");
        }

        return new GoogleProfile(
                claims.path("sub").asText(),
                claims.path("email").asText().trim().toLowerCase(),
                claims.path("name").asText(null),
                claims.path("picture").asText(null)
        );
    }
}
