package com.regarsport.order.repository;

import com.regarsport.order.entity.WarrantyClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, Long> {

    List<WarrantyClaim> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<WarrantyClaim> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<WarrantyClaim> findByClaimNumber(String claimNumber);

    boolean existsByOrderIdAndProductIdAndStatusIn(Long orderId, Long productId, List<String> statuses);

    Page<WarrantyClaim> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<WarrantyClaim> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
