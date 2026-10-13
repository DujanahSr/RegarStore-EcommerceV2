package com.regarsport.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "warranty_claims",
    indexes = {
        @Index(name = "idx_claim_user_id", columnList = "user_id"),
        @Index(name = "idx_claim_order_id", columnList = "order_id"),
        @Index(name = "idx_claim_number", columnList = "claim_number", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_number", nullable = false, unique = true, length = 50)
    private String claimNumber;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(nullable = false, length = 50)
    private String category; // SIZE_EXCHANGE, PRINTING_DEFECT, SEWING_DEFECT, OTHER

    @Column(nullable = false, length = 50)
    private String solution; // EXCHANGE_SIZE, REPLACEMENT, REPAIR

    @Column(name = "requested_size", length = 20)
    private String requestedSize;

    @Column(length = 1000)
    private String description;

    @Column(name = "evidence_images", length = 1500)
    private String evidenceImages;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "replacement_tracking_number", length = 100)
    private String replacementTrackingNumber;

    @Column(name = "return_tracking_number", length = 100)
    private String returnTrackingNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
