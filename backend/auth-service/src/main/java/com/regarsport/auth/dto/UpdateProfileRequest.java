package com.regarsport.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank(message = "Full name cannot be blank")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    String fullName,

    String avatarUrl,
    String phoneNumber,
    String address,
    String city,
    String postalCode,
    String bio
) {
    public UpdateProfileRequest(String fullName, String avatarUrl) {
        this(fullName, avatarUrl, null, null, null, null, null);
    }
}
