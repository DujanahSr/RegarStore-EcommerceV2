package com.regarsport.auth.dto;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

public record UserStatusUpdateRequest(
    @NotNull(message = "Status active is required")
    Boolean active
) implements Serializable {}
