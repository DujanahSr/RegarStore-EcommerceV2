package com.regarsport.catalog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateReviewRequest(
    @NotNull(message = "Rating wajib diisi")
    @Min(value = 1, message = "Rating minimal adalah 1")
    @Max(value = 5, message = "Rating maksimal adalah 5")
    Integer rating,

    @NotBlank(message = "Komentar / ulasan tidak boleh kosong")
    String comment,

    String customerName,
    String customerAvatar,
    List<String> images
) {
    public CreateReviewRequest(Integer rating, String comment) {
        this(rating, comment, null, null, null);
    }
}
