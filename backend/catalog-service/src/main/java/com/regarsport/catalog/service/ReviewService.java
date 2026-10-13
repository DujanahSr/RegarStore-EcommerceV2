package com.regarsport.catalog.service;

import com.regarsport.catalog.dto.CreateReviewRequest;
import com.regarsport.catalog.dto.ReviewReplyRequest;
import com.regarsport.catalog.dto.ReviewResponse;
import com.regarsport.catalog.entity.Product;
import com.regarsport.catalog.entity.Review;
import com.regarsport.catalog.entity.ReviewReply;
import com.regarsport.catalog.repository.ProductRepository;
import com.regarsport.catalog.repository.ReviewReplyRepository;
import com.regarsport.catalog.repository.ReviewRepository;
import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final ProductRepository productRepository;

    public PageResponse<ReviewResponse> getProductReviews(Long productId, Integer rating, Boolean withPhotos, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)), Sort.by("createdAt").descending());
        Page<Review> reviewPage;
        if (Boolean.TRUE.equals(withPhotos)) {
            reviewPage = reviewRepository.findWithPhotosByProductId(productId, pageable);
        } else if (rating != null && rating >= 1 && rating <= 5) {
            reviewPage = reviewRepository.findByProductIdAndRating(productId, rating, pageable);
        } else {
            reviewPage = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        }

        Product product = productRepository.findById(productId).orElse(null);
        String prodName = product != null ? product.getName() : "Jersey RegarStore";
        String prodImage = product != null ? product.getImageUrl() : "";

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(r -> mapToResponse(r, prodName, prodImage))
                .toList();

        return new PageResponse<>(
                content,
                reviewPage.getNumber() + 1,
                reviewPage.getSize(),
                reviewPage.getTotalElements(),
                reviewPage.getTotalPages(),
                reviewPage.isFirst(),
                reviewPage.isLast()
        );
    }

    public Map<String, Object> getProductReviewSummary(Long productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);
        Double avg = reviewRepository.calculateAverageRating(productId);
        Map<Integer, Long> breakdown = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            breakdown.put(i, 0L);
        }

        long withPhotosCount = 0;
        for (Review r : reviews) {
            int rating = r.getRating() != null ? r.getRating() : 5;
            breakdown.put(rating, breakdown.getOrDefault(rating, 0L) + 1);
            if (r.getImages() != null && !r.getImages().trim().isBlank()) {
                withPhotosCount++;
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        summary.put("totalReviews", reviews.size());
        summary.put("totalWithPhotos", withPhotosCount);
        summary.put("breakdown", breakdown);

        return summary;
    }

    public Optional<ReviewResponse> getMyReview(Long productId, Long userId) {
        return reviewRepository.findByProductIdAndUserId(productId, userId)
                .map(r -> {
                    Product product = productRepository.findById(productId).orElse(null);
                    String prodName = product != null ? product.getName() : "Jersey RegarStore";
                    String prodImage = product != null ? product.getImageUrl() : "";
                    return mapToResponse(r, prodName, prodImage);
                });
    }

    @Transactional
    public ReviewResponse createReview(Long productId, Long userId, String customerName, String customerAvatar, CreateReviewRequest request) {
        log.info("Creating or updating review for productId: {}, by userId: {}", productId, userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produk tidak ditemukan dengan id: " + productId));

        Optional<Review> existing = reviewRepository.findByProductIdAndUserId(productId, userId);
        Review review;
        if (existing.isPresent()) {
            review = existing.get();
            review.setRating(request.rating());
            review.setComment(request.comment().trim());
            if (customerAvatar != null && !customerAvatar.isBlank()) {
                review.setCustomerAvatar(customerAvatar);
            }
            if (customerName != null && !customerName.isBlank()) {
                review.setCustomerName(customerName);
            }
            log.info("Updated existing review id: {} for productId: {}", review.getId(), productId);
        } else {
            review = Review.builder()
                    .productId(productId)
                    .userId(userId)
                    .customerName(customerName != null && !customerName.isBlank() ? customerName : "Pelanggan RegarStore")
                    .customerAvatar(customerAvatar)
                    .rating(request.rating())
                    .comment(request.comment().trim())
                    .build();
        }

        if (request.images() != null && !request.images().isEmpty()) {
            List<String> limited = request.images().stream()
                    .filter(img -> img != null && !img.isBlank())
                    .limit(3)
                    .toList();
            review.setImageList(limited);
        } else if (existing.isPresent() && request.images() != null && request.images().isEmpty()) {
            review.setImageList(Collections.emptyList());
        }

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved, product.getName(), product.getImageUrl());
    }

    public PageResponse<ReviewResponse> getAdminReviews(String search, Integer rating, int page, int limit) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, limit)), Sort.by("createdAt").descending());

        Page<Review> reviewPage;
        boolean hasSearch = search != null && !search.trim().isBlank();
        if (hasSearch && rating != null && rating > 0) {
            reviewPage = reviewRepository.searchReviewsByRating(search.trim(), rating, pageable);
        } else if (hasSearch) {
            reviewPage = reviewRepository.searchReviews(search.trim(), pageable);
        } else if (rating != null && rating > 0) {
            reviewPage = reviewRepository.findByRating(rating, pageable);
        } else {
            reviewPage = reviewRepository.findAll(pageable);
        }

        // Cache product names for rapid lookup
        Map<Long, Product> productCache = new HashMap<>();

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(r -> {
                    Product prod = productCache.computeIfAbsent(r.getProductId(), id -> productRepository.findById(id).orElse(null));
                    String pName = prod != null ? prod.getName() : "Jersey #" + r.getProductId();
                    String pImg = prod != null ? prod.getImageUrl() : "";
                    return mapToResponse(r, pName, pImg);
                })
                .toList();

        return new PageResponse<>(
                content,
                reviewPage.getNumber() + 1,
                reviewPage.getSize(),
                reviewPage.getTotalElements(),
                reviewPage.getTotalPages(),
                reviewPage.isFirst(),
                reviewPage.isLast()
        );
    }

    @Transactional
    public ReviewResponse replyToReview(Long reviewId, String adminName, ReviewReplyRequest request) {
        log.info("Admin {} replying to review id: {}", adminName, reviewId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review tidak ditemukan dengan id: " + reviewId));

        // Clear existing replies or update
        reviewReplyRepository.deleteByReviewId(reviewId);

        ReviewReply reply = ReviewReply.builder()
                .review(review)
                .adminName(adminName != null && !adminName.isBlank() ? adminName : "Admin RegarStore")
                .reply(request.reply().trim())
                .build();

        review.addReply(reply);
        Review saved = reviewRepository.save(review);

        Product product = productRepository.findById(saved.getProductId()).orElse(null);
        String pName = product != null ? product.getName() : "Jersey";
        String pImg = product != null ? product.getImageUrl() : "";

        return mapToResponse(saved, pName, pImg);
    }

    @Transactional
    public void deleteReply(Long reviewId) {
        log.info("Deleting reply for review id: {}", reviewId);
        reviewReplyRepository.deleteByReviewId(reviewId);
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        log.info("Deleting review id: {}", reviewId);
        reviewRepository.deleteById(reviewId);
    }

    private ReviewResponse mapToResponse(Review r, String productName, String productImage) {
        List<Map<String, Object>> replies = new ArrayList<>();
        if (r.getReplies() != null) {
            for (ReviewReply reply : r.getReplies()) {
                Map<String, Object> repMap = new HashMap<>();
                repMap.put("id", reply.getId());
                repMap.put("admin_name", reply.getAdminName());
                repMap.put("reply", reply.getReply());
                repMap.put("created_at", reply.getCreatedAt());
                replies.add(repMap);
            }
        }

        Map<String, Object> usersMap = new HashMap<>();
        usersMap.put("full_name", r.getCustomerName());
        usersMap.put("avatar_url", r.getCustomerAvatar() != null ? r.getCustomerAvatar() : "");
        usersMap.put("email", "");

        Map<String, Object> productMap = new HashMap<>();
        productMap.put("name", productName);
        productMap.put("image_url", productImage != null ? productImage : "");

        return new ReviewResponse(
                r.getId(),
                r.getProductId(),
                productName,
                productImage,
                r.getUserId(),
                r.getCustomerName(),
                r.getCustomerAvatar(),
                r.getRating(),
                r.getComment(),
                r.getImageList(),
                r.getCreatedAt(),
                r.getCreatedAt(),
                replies,
                usersMap,
                productMap
        );
    }
}
