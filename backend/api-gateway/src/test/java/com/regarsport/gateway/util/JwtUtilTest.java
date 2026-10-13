package com.regarsport.gateway.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtUtil Unit Tests in API Gateway")
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", TEST_SECRET);
    }

    private String generateTestToken(Long userId, String email, String role, String fullName, long expiryMinutes) {
        Instant now = Instant.now();
        Instant expiry = now.plus(expiryMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "userId", userId,
                        "role", role,
                        "fullName", fullName
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    @Test
    @DisplayName("Should validate valid JWT token and extract claims correctly")
    void testValidateToken_Success() {
        String token = generateTestToken(42L, "user@regarsport.com", "ROLE_CUSTOMER", "Abu Siregar", 60);

        boolean isValid = jwtUtil.validateToken(token);
        assertThat(isValid).isTrue();

        assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("user@regarsport.com");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ROLE_CUSTOMER");
        assertThat(jwtUtil.extractFullName(token)).isEqualTo("Abu Siregar");
    }

    @Test
    @DisplayName("Should return false for invalid or corrupted token")
    void testValidateToken_InvalidToken() {
        boolean isValid = jwtUtil.validateToken("invalid.corrupted.token");
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should return false for expired token")
    void testValidateToken_ExpiredToken() {
        String expiredToken = generateTestToken(42L, "user@regarsport.com", "ROLE_CUSTOMER", "Abu", -10);
        boolean isValid = jwtUtil.validateToken(expiredToken);
        assertThat(isValid).isFalse();
    }
}
