package com.regarsport.catalog.repository;

import com.regarsport.catalog.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    List<Review> findByProductId(Long productId);

    @Query("SELECT r FROM Review r WHERE r.productId = :productId AND r.images IS NOT NULL AND TRIM(r.images) != '' ORDER BY r.createdAt DESC")
    Page<Review> findWithPhotosByProductId(@Param("productId") Long productId, Pageable pageable);

    Page<Review> findByProductIdAndRating(Long productId, Integer rating, Pageable pageable);

    java.util.Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    Page<Review> findByRating(Integer rating, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE LOWER(r.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Review> searchReviews(@Param("search") String search, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.rating = :rating AND (LOWER(r.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Review> searchReviewsByRating(@Param("search") String search, @Param("rating") Integer rating, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.productId = :productId")
    Double calculateAverageRating(@Param("productId") Long productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r")
    Double calculateOverallAverageRating();

    long countByRating(Integer rating);
}
