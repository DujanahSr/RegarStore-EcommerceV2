package com.regarsport.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewReplyRequest(
    @NotBlank(message = "Balasan tidak boleh kosong")
    String reply
) {}
