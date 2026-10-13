package com.regarsport.order.service;

import com.regarsport.common.dto.PageResponse;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.common.exception.ResourceNotFoundException;
import com.regarsport.order.dto.UpdateClaimStatusRequest;
import com.regarsport.order.dto.WarrantyClaimRequest;
import com.regarsport.order.dto.WarrantyClaimResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.entity.WarrantyClaim;
import com.regarsport.order.repository.OrderRepository;
import com.regarsport.order.repository.WarrantyClaimRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WarrantyClaimService Unit Tests")
class WarrantyClaimServiceTest {

    @Mock
    private WarrantyClaimRepository claimRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private WarrantyClaimService claimService;

    private Order sampleOrder;
    private WarrantyClaim sampleClaim;

    @BeforeEach
    void setUp() {
        sampleOrder = Order.builder()
                .id(21L)
                .orderNumber("REGAR-1789823022-69A9")
                .userId(1L)
                .status(OrderStatus.COMPLETED)
                .completedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();

        sampleClaim = WarrantyClaim.builder()
                .id(1L)
                .claimNumber("CLM-20260920-BB1A5")
                .orderId(21L)
                .orderNumber("REGAR-1789823022-69A9")
                .userId(1L)
                .productId(4L)
                .productName("Jersey RegarSport Pro Elite")
                .productImage("https://example.com/jersey.jpg")
                .category("SIZE_EXCHANGE")
                .solution("EXCHANGE_SIZE")
                .requestedSize("L")
                .description("Ukuran terlalu sempit di dada")
                .evidenceImages("https://cloudinary.com/sample.jpg")
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Should create warranty claim successfully with PENDING status")
    void testCreateClaim_Success() {
        WarrantyClaimRequest request = new WarrantyClaimRequest(
                21L,
                "REGAR-1789823022-69A9",
                4L,
                "Jersey RegarSport Pro Elite",
                "https://example.com/jersey.jpg",
                "SIZE_EXCHANGE",
                "EXCHANGE_SIZE",
                "L",
                "Ukuran terlalu sempit di dada",
                "https://cloudinary.com/sample.jpg"
        );

        when(orderRepository.findById(21L)).thenReturn(Optional.of(sampleOrder));
        when(claimRepository.existsByOrderIdAndProductIdAndStatusIn(anyLong(), anyLong(), any())).thenReturn(false);
        when(claimRepository.save(any(WarrantyClaim.class))).thenAnswer(invocation -> {
            WarrantyClaim saved = invocation.getArgument(0);
            saved.setId(1L);
            saved.setCreatedAt(Instant.now());
            saved.setUpdatedAt(Instant.now());
            return saved;
        });

        WarrantyClaimResponse response = claimService.createClaim(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.claimNumber()).startsWith("CLM-");
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.requestedSize()).isEqualTo("L");
        assertThat(response.productName()).isEqualTo("Jersey RegarSport Pro Elite");
        verify(claimRepository, times(1)).save(any(WarrantyClaim.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when order does not exist")
    void testCreateClaim_OrderNotFound() {
        WarrantyClaimRequest request = new WarrantyClaimRequest(
                999L, "REGAR-999", 4L, "Jersey", "img.jpg", "SIZE_EXCHANGE", "EXCHANGE_SIZE", "L", "desc", "img.jpg"
        );

        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> claimService.createClaim(1L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Pesanan tidak ditemukan");

        verify(claimRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when order belongs to different user")
    void testCreateClaim_NotOrderOwner() {
        WarrantyClaimRequest request = new WarrantyClaimRequest(
                21L, "REGAR-1789823022-69A9", 4L, "Jersey", "img.jpg", "SIZE_EXCHANGE", "EXCHANGE_SIZE", "L", "desc", "img.jpg"
        );

        when(orderRepository.findById(21L)).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> claimService.createClaim(99L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hanya dapat mengajukan klaim untuk pesanan milik sendiri");

        verify(claimRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when order status is not COMPLETED")
    void testCreateClaim_OrderNotCompleted() {
        sampleOrder.setStatus(OrderStatus.SHIPPED);
        WarrantyClaimRequest request = new WarrantyClaimRequest(
                21L, "REGAR-1789823022-69A9", 4L, "Jersey", "img.jpg", "SIZE_EXCHANGE", "EXCHANGE_SIZE", "L", "desc", "img.jpg"
        );

        when(orderRepository.findById(21L)).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> claimService.createClaim(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hanya dapat diajukan setelah pesanan selesai diterima");

        verify(claimRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when 7-day warranty window has expired")
    void testCreateClaim_WarrantyExpired() {
        // Order completed 8 days ago
        sampleOrder.setCompletedAt(Instant.now().minus(8, ChronoUnit.DAYS));
        WarrantyClaimRequest request = new WarrantyClaimRequest(
                21L, "REGAR-1789823022-69A9", 4L, "Jersey", "img.jpg", "SIZE_EXCHANGE", "EXCHANGE_SIZE", "L", "desc", "img.jpg"
        );

        when(orderRepository.findById(21L)).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> claimService.createClaim(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("telah berakhir");

        verify(claimRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when active claim already exists for the product")
    void testCreateClaim_DuplicateActiveClaim() {
        WarrantyClaimRequest request = new WarrantyClaimRequest(
                21L, "REGAR-1789823022-69A9", 4L, "Jersey", "img.jpg", "SIZE_EXCHANGE", "EXCHANGE_SIZE", "L", "desc", "img.jpg"
        );

        when(orderRepository.findById(21L)).thenReturn(Optional.of(sampleOrder));
        when(claimRepository.existsByOrderIdAndProductIdAndStatusIn(eq(21L), eq(4L), any())).thenReturn(true);

        assertThatThrownBy(() -> claimService.createClaim(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sudah memiliki tiket klaim garansi yang sedang diproses");

        verify(claimRepository, never()).save(any());
    }

    @Test
    @DisplayName("CS/Admin approves warranty claim with notes")
    void testUpdateClaimStatus_Approve() {
        UpdateClaimStatusRequest request = new UpdateClaimStatusRequest(
                "APPROVED",
                "Klaim disetujui. Silakan kirimkan jersey lama ke Gudang Wonogiri.",
                null,
                null
        );

        when(claimRepository.findById(1L)).thenReturn(Optional.of(sampleClaim));
        when(claimRepository.save(any(WarrantyClaim.class))).thenReturn(sampleClaim);

        WarrantyClaimResponse response = claimService.updateClaimStatus(1L, request);

        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(response.adminNotes()).isEqualTo("Klaim disetujui. Silakan kirimkan jersey lama ke Gudang Wonogiri.");
        verify(claimRepository, times(1)).save(sampleClaim);
    }

    @Test
    @DisplayName("CS/Admin rejects warranty claim with reason")
    void testUpdateClaimStatus_Reject() {
        UpdateClaimStatusRequest request = new UpdateClaimStatusRequest(
                "REJECTED",
                "Bukti foto tidak memenuhi ketentuan garansi (rusak karena pemakaian).",
                null,
                null
        );

        when(claimRepository.findById(1L)).thenReturn(Optional.of(sampleClaim));
        when(claimRepository.save(any(WarrantyClaim.class))).thenReturn(sampleClaim);

        WarrantyClaimResponse response = claimService.updateClaimStatus(1L, request);

        assertThat(response.status()).isEqualTo("REJECTED");
        assertThat(response.adminNotes()).contains("tidak memenuhi ketentuan");
        verify(claimRepository, times(1)).save(sampleClaim);
    }

    @Test
    @DisplayName("Logistics dispatches replacement item with tracking number and resolves claim")
    void testUpdateClaimStatus_ResolveWithTracking() {
        sampleClaim.setStatus("APPROVED");

        UpdateClaimStatusRequest request = new UpdateClaimStatusRequest(
                "RESOLVED",
                "Paket pengganti size L telah dikirimkan via J&T.",
                "J&T Express - JT9988221100",
                null
        );

        when(claimRepository.findById(1L)).thenReturn(Optional.of(sampleClaim));
        when(claimRepository.save(any(WarrantyClaim.class))).thenReturn(sampleClaim);

        WarrantyClaimResponse response = claimService.updateClaimStatus(1L, request);

        assertThat(response.status()).isEqualTo("RESOLVED");
        assertThat(response.replacementTrackingNumber()).isEqualTo("J&T Express - JT9988221100");
        verify(claimRepository, times(1)).save(sampleClaim);
    }

    @Test
    @DisplayName("Admin fetches paginated claims filtered by status")
    void testGetAllClaims_Filtered() {
        when(claimRepository.findByStatusOrderByCreatedAtDesc(eq("PENDING"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleClaim)));

        PageResponse<WarrantyClaimResponse> result = claimService.getAllClaims("PENDING", 1, 10);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).claimNumber()).isEqualTo("CLM-20260920-BB1A5");
        assertThat(result.totalElements()).isEqualTo(1);
        verify(claimRepository, times(1)).findByStatusOrderByCreatedAtDesc(eq("PENDING"), any(Pageable.class));
    }
}
