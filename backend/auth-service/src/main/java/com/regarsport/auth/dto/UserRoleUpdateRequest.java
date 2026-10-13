package com.regarsport.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UserRoleUpdateRequest(
    @NotBlank(message = "Role cannot be blank")
    String role
) {}
