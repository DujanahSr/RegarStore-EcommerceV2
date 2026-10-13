package com.regarsport.gateway.filter;

import com.regarsport.gateway.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/verify-reset-token",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/google",
            "/api/v1/payments/midtrans/webhook",
            "/uploads",
            "/v3/api-docs",
            "/swagger-ui",
            "/actuator"
    );

    private static final Set<String> ADMIN = Set.of("ROLE_ADMIN");
    private static final Set<String> STAFF = Set.of("ROLE_ADMIN", "ROLE_LOGISTICS");
    private static final Pattern PRODUCT_REVIEW = Pattern.compile("/api/v1/products/\\d+/reviews");

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    public static class Config {}

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            String method = request.getMethod().name();

            // Allow public paths or public GET on catalog
            if (isPublicEndpoint(path, method)) {
                return chain.filter(exchange);
            }

            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.validateToken(token)) {
                return onError(exchange, "Invalid or expired JWT token", HttpStatus.UNAUTHORIZED);
            }

            // Extract claims and inject into headers for downstream microservices
            try {
                Long userId = jwtUtil.extractUserId(token);
                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);
                String fullName = jwtUtil.extractFullName(token);

                Set<String> required = requiredRoles(method, path);
                if (required != null && !required.contains(role)) {
                    log.warn("Forbidden: role {} tried {} {}", role, method, path);
                    return onError(exchange, "Akses ditolak: endpoint ini khusus staf RegarStore", HttpStatus.FORBIDDEN);
                }

                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", userId != null ? String.valueOf(userId) : "")
                        .header("X-User-Email", email != null ? email : "")
                        .header("X-User-Role", role != null ? role : "")
                        .header("X-User-Name", fullName != null ? fullName : "")
                        .build();

                log.debug("Authenticated user id: {}, role: {} routed to: {}", userId, role, path);
                return chain.filter(exchange.mutate().request(mutatedRequest).build());

            } catch (Exception e) {
                log.error("Failed to parse user claims in Gateway: {}", e.getMessage());
                return onError(exchange, "Failed to parse authentication claims", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    /**
     * Role untuk endpoint staf; null = cukup login. Dicek terpusat di gateway karena catalog-service
     * dan sebagian endpoint order-service (voucher, daftar semua pesanan, dashboard) tidak memeriksa role sendiri.
     */
    static Set<String> requiredRoles(String method, String path) {
        boolean read = "GET".equalsIgnoreCase(method);
        if (path.startsWith("/api/v1/admin/") || path.startsWith("/api/v1/orders/admin")) return ADMIN;
        if (path.startsWith("/api/v1/orders/vouchers")) return path.endsWith("/validate") ? null : ADMIN;
        if (path.equals("/api/v1/orders")) return read ? STAFF : null;
        if (read) return null;
        if (path.startsWith("/api/v1/categories")) return ADMIN;
        if (path.startsWith("/api/v1/products")) {
            if (PRODUCT_REVIEW.matcher(path).matches() || path.equals("/api/v1/products/upload")) return null;
            // PUT produk (atur stok per ukuran) & PATCH stok dipakai staf gudang; tambah/hapus produk khusus admin
            return "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method) ? STAFF : ADMIN;
        }
        return null;
    }

    private boolean isPublicEndpoint(String path, String method) {
        for (String endpoint : PUBLIC_ENDPOINTS) {
            if (path.startsWith(endpoint)) {
                return true;
            }
        }
        // Public browse for products and categories (GET only)
        if ("GET".equalsIgnoreCase(method) && (path.startsWith("/api/v1/products") || path.startsWith("/api/v1/categories"))) {
            return true;
        }
        return false;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String json = String.format(
                "{\"success\":false,\"message\":\"%s\",\"data\":null,\"timestamp\":\"%s\"}",
                err, Instant.now()
        );

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
