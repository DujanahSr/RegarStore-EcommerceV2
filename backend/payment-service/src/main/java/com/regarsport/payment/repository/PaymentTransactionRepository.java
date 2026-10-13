package com.regarsport.payment.repository;

import com.regarsport.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findFirstByOrderIdOrderByIdDesc(Long orderId);
    Optional<PaymentTransaction> findFirstByOrderNumberOrderByIdDesc(String orderNumber);
    Optional<PaymentTransaction> findBySnapToken(String snapToken);

    default Optional<PaymentTransaction> findByOrderId(Long orderId) {
        return findFirstByOrderIdOrderByIdDesc(orderId);
    }

    default Optional<PaymentTransaction> findByOrderNumber(String orderNumber) {
        return findFirstByOrderNumberOrderByIdDesc(orderNumber);
    }
}
