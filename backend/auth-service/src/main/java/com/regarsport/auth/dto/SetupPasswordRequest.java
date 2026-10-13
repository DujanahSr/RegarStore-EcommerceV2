package com.regarsport.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetupPasswordRequest(
        @NotBlank(message = "Kode OTP wajib diisi")
        String code,
        @NotBlank(message = "Kata sandi baru wajib diisi")
        @Size(min = 6, max = 100, message = "Kata sandi baru minimal 6 karakter")
        String newPassword
) {}
