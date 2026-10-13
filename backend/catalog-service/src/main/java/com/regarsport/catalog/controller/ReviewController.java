package com.regarsport.catalog.controller;

import com.regarsport.catalog.dto.CreateReviewRequest;
import com.regarsport.catalog.dto.ReviewReplyRequest;
import com.regarsport.catalog.dto.ReviewResponse;
import com.regarsport.catalog.repository.ReviewRepository;
import com.regarsport.catalog.service.ReviewService;
import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Endpoints for customer product ratings, reviews, and admin moderation")
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;

    @GetMapping("/api/v1/products/{productId}/reviews")
    @Operation(summary = "Get product reviews", description = "Retrieve paginated reviews for a specific product with optional rating or photo filter")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean withPhotos,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ReviewResponse> response = reviewService.getProductReviews(productId, rating, withPhotos, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/v1/products/{productId}/reviews/summary")
    @Operation(summary = "Get product review summary", description = "Retrieve average rating and review breakdown for a product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductReviewSummary(@PathVariable Long productId) {
        Map<String, Object> summary = reviewService.getProductReviewSummary(productId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/api/v1/products/{productId}/my-review")
    @Operation(summary = "Get user review for product", description = "Retrieve customer's own review for a product if already submitted")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ReviewResponse>> getMyReview(
            @PathVariable Long productId,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId
    ) {
        return reviewService.getMyReview(productId, userId)
                .map(r -> ResponseEntity.ok(ApiResponse.success(r)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    @PostMapping("/api/v1/products/{productId}/reviews")
    @Operation(summary = "Submit product review", description = "Customer submits a review and rating for a product")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long productId,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Pelanggan RegarStore") String customerName,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        String finalName = (request.customerName() != null && !request.customerName().isBlank())
                ? request.customerName().trim()
                : customerName;
        String finalAvatar = (request.customerAvatar() != null && !request.customerAvatar().isBlank())
                ? request.customerAvatar().trim()
                : null;
        ReviewResponse response = reviewService.createReview(productId, userId, finalName, finalAvatar, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Ulasan berhasil dikirim", response));
    }

    @GetMapping("/api/v1/admin/reviews")
    @Operation(summary = "Admin: List all reviews", description = "Retrieve paginated reviews for admin dashboard moderation")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> getAdminReviews(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        PageResponse<ReviewResponse> pageResponse = reviewService.getAdminReviews(search, rating, page, limit);
        Double overallAvg = reviewRepository.calculateOverallAverageRating();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", pageResponse.content());

        Map<String, Object> meta = new HashMap<>();
        meta.put("total", pageResponse.totalElements());
        meta.put("totalPages", pageResponse.totalPages());
        meta.put("currentPage", pageResponse.page());
        meta.put("averageRating", overallAvg != null ? Math.round(overallAvg * 10.0) / 10.0 : 5.0);
        response.put("meta", meta);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/v1/admin/reviews/{id}/reply")
    @Operation(summary = "Admin: Reply to review", description = "Add or update admin reply to customer review")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ReviewResponse>> replyToReview(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Name", defaultValue = "Admin RegarStore") String adminName,
            @Valid @RequestBody ReviewReplyRequest request
    ) {
        ReviewResponse response = reviewService.replyToReview(id, adminName, request);
        return ResponseEntity.ok(ApiResponse.success("Balasan berhasil disimpan", response));
    }

    @DeleteMapping("/api/v1/admin/reviews/{id}/reply")
    @Operation(summary = "Admin: Delete reply", description = "Delete admin reply from review")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deleteReply(@PathVariable Long id) {
        reviewService.deleteReply(id);
        return ResponseEntity.ok(ApiResponse.success("Balasan berhasil dihapus", null));
    }

    @DeleteMapping("/api/v1/admin/reviews/{id}")
    @Operation(summary = "Admin: Delete review", description = "Delete review from platform")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.success("Ulasan berhasil dihapus", null));
    }
}
