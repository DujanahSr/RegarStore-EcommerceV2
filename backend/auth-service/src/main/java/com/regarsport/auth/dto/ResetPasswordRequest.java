package com.regarsport.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Alamat email wajib diisi")
        @Email(message = "Format email tidak valid")
        String email,

        @NotBlank(message = "Kode token reset wajib diisi")
        String token,

        @NotBlank(message = "Kata sandi baru wajib diisi")
        @Size(min = 6, message = "Kata sandi baru minimal terdiri dari 6 karakter")
        String newPassword
) {}
