package com.regarsport.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyResetTokenRequest(
        @NotBlank(message = "Alamat email wajib diisi")
        @Email(message = "Format email tidak valid")
        String email,

        @NotBlank(message = "Kode token reset wajib diisi")
        String token
) {}
