package com.regarsport.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "Password saat ini tidak boleh kosong")
    String currentPassword,

    @NotBlank(message = "Password baru tidak boleh kosong")
    @Size(min = 6, message = "Password baru minimal 6 karakter")
    String newPassword
) {}
