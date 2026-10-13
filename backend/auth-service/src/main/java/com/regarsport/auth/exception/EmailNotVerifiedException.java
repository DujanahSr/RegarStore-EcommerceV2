package com.regarsport.auth.exception;

import lombok.Getter;

@Getter
public class EmailNotVerifiedException extends RuntimeException {
    private final String email;

    public EmailNotVerifiedException(String email) {
        super("Email belum diverifikasi. Kode OTP telah dikirim ke " + email + ".");
        this.email = email;
    }
}
