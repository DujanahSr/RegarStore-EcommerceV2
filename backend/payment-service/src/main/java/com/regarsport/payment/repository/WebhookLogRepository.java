package com.regarsport.payment.repository;

import com.regarsport.payment.entity.WebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WebhookLogRepository extends JpaRepository<WebhookLog, Long> {
    Optional<WebhookLog> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
