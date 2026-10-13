package com.regarsport.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Credential Google wajib diisi")
        String credential
) {}
