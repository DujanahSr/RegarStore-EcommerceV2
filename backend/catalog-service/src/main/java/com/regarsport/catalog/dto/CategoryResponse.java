package com.regarsport.catalog.dto;

import java.io.Serializable;
import java.time.Instant;

public record CategoryResponse(
    Long id,
    String name,
    String imageUrl,
    Instant createdAt
) implements Serializable {}
