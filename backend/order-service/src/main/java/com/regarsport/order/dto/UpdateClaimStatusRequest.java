package com.regarsport.order.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateClaimStatusRequest(
    @NotBlank(message = "Status klaim tidak boleh kosong")
    String status,
    String adminNotes,
    String replacementTrackingNumber,
    String returnTrackingNumber
) {}
