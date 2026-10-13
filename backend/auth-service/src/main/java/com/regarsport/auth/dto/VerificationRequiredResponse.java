package com.regarsport.auth.dto;

public record VerificationRequiredResponse(String email, boolean requiresVerification) {
    public static VerificationRequiredResponse of(String email) {
        return new VerificationRequiredResponse(email, true);
    }
}
