package com.regarsport.order.dto;

import jakarta.validation.constraints.NotBlank;

public record ShipOrderRequest(
    @NotBlank(message = "Nama kurir / ekspedisi tidak boleh kosong")
    String courier,

    @NotBlank(message = "Nomor resi tidak boleh kosong")
    String trackingNumber
) {}
