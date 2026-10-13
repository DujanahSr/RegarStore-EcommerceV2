package com.regarsport.order.controller;

import com.regarsport.common.dto.ApiResponse;
import com.regarsport.common.dto.PageResponse;
import com.regarsport.order.dto.UpdateClaimStatusRequest;
import com.regarsport.order.dto.WarrantyClaimRequest;
import com.regarsport.order.dto.WarrantyClaimResponse;
import com.regarsport.order.service.WarrantyClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/warranty-claims")
@RequiredArgsConstructor
@Tag(name = "Warranty Claims", description = "Endpoints for customer warranty claims and return requests")
public class WarrantyClaimController {

    private final WarrantyClaimService claimService;

    @PostMapping
    @Operation(summary = "Submit warranty claim", description = "Submit a warranty claim or size exchange request for an order")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> submitClaim(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId,
            @Valid @RequestBody WarrantyClaimRequest request
    ) {
        WarrantyClaimResponse response = claimService.createClaim(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pengajuan klaim garansi berhasil disimpan dengan nomor tiket: " + response.claimNumber(), response));
    }

    @GetMapping
    @Operation(summary = "Get user claims", description = "Retrieve all warranty claims submitted by the authenticated user")
    public ResponseEntity<ApiResponse<List<WarrantyClaimResponse>>> getUserClaims(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId
    ) {
        List<WarrantyClaimResponse> claims = claimService.getUserClaims(userId);
        return ResponseEntity.ok(ApiResponse.success(claims));
    }

    @GetMapping("/admin")
    @Operation(summary = "Admin: Get all warranty claims", description = "Retrieve paginated warranty claims with optional status filter")
    public ResponseEntity<ApiResponse<PageResponse<WarrantyClaimResponse>>> getAllClaims(
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        boolean isAdminOrLogistics = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)
                || "ROLE_LOGISTICS".equalsIgnoreCase(role) || "LOGISTICS".equalsIgnoreCase(role);
        if (!isAdminOrLogistics) {
            throw new com.regarsport.common.exception.BadRequestException("Akses ditolak: Hanya Admin atau Staf Gudang yang dapat mengakses data seluruh klaim");
        }
        PageResponse<WarrantyClaimResponse> response = claimService.getAllClaims(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{claimId}/status")
    @Operation(summary = "Admin/Gudang: Update warranty claim status", description = "Approve, reject, or update tracking for a warranty claim")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> updateClaimStatus(
            @PathVariable Long claimId,
            @RequestHeader(value = "X-User-Role", defaultValue = "ROLE_CUSTOMER") String role,
            @Valid @RequestBody UpdateClaimStatusRequest request
    ) {
        boolean isAdminOrLogistics = "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)
                || "ROLE_LOGISTICS".equalsIgnoreCase(role) || "LOGISTICS".equalsIgnoreCase(role);
        if (!isAdminOrLogistics) {
            throw new com.regarsport.common.exception.BadRequestException("Akses ditolak: Hanya Admin atau Staf Gudang yang berwenang memperbarui status klaim");
        }
        WarrantyClaimResponse response = claimService.updateClaimStatus(claimId, request);
        return ResponseEntity.ok(ApiResponse.success("Status klaim garansi berhasil diperbarui", response));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get claims for order", description = "Retrieve all warranty claims associated with a specific order")
    public ResponseEntity<ApiResponse<List<WarrantyClaimResponse>>> getClaimsByOrder(
            @PathVariable Long orderId
    ) {
        List<WarrantyClaimResponse> claims = claimService.getClaimsByOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(claims));
    }

    @GetMapping("/ticket/{claimNumber}")
    @Operation(summary = "Get claim by ticket number", description = "Retrieve details of a warranty claim by its ticket number")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> getClaimByTicket(
            @PathVariable String claimNumber
    ) {
        WarrantyClaimResponse claim = claimService.getClaimByNumber(claimNumber);
        return ResponseEntity.ok(ApiResponse.success(claim));
    }
}
