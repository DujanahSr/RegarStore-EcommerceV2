package com.regarsport.auth.controller;

import com.regarsport.auth.dto.*;
import com.regarsport.auth.service.AuthService;
import com.regarsport.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Identity", description = "Endpoints for user registration, login, token refresh, and profile management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Register a new customer account and send email verification OTP")
    public ResponseEntity<ApiResponse<VerificationRequiredResponse>> register(@Valid @RequestBody RegisterRequest request) {
        VerificationRequiredResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pendaftaran berhasil. Kode verifikasi telah dikirim ke " + response.email() + ".", response));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Verify account email with 6-digit OTP and log the user in")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Email berhasil diverifikasi", authService.verifyEmail(request)));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification OTP", description = "Resend email verification OTP for an unverified account")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody EmailRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok(ApiResponse.success("Jika akun belum terverifikasi, kode baru telah dikirim ke email tersebut.", null));
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google", description = "Login or register using a Google Identity Services ID token")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login Google berhasil", authService.loginWithGoogle(request)));
    }

    @PostMapping("/google/link")
    @Operation(summary = "Link Google account", description = "Link a Google account with the same email to the current account",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserResponse>> linkGoogle(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GoogleAuthRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Akun Google berhasil dihubungkan",
                authService.linkGoogle(userDetails.getUsername(), request)));
    }

    @PostMapping("/password/setup/request")
    @Operation(summary = "Request password setup OTP", description = "Send OTP to set a password on a Google-only account",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> requestPasswordSetup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EmailRequest request
    ) {
        authService.requestPasswordSetup(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Kode verifikasi telah dikirim ke " + request.email() + ".", null));
    }

    @PostMapping("/password/setup")
    @Operation(summary = "Set up password", description = "Set a password on a Google-only account using the OTP",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserResponse>> setupPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SetupPasswordRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Kata sandi berhasil ditambahkan",
                authService.setupPassword(userDetails.getUsername(), request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user and issue JWT access and refresh tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Generate a new access token using a valid refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieve current authenticated user profile",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = authService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update user name or avatar",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserResponse response = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PutMapping("/password")
    @Operation(summary = "Change user password", description = "Change current authenticated user's password",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password berhasil diperbarui", null));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Send 6-digit OTP code to email for password reset")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Kode verifikasi telah dikirim ke email " + request.email() + ". Silakan periksa kotak masuk atau spam.",
                java.util.Map.<String, Object>of("email", request.email().trim().toLowerCase())
        ));
    }

    @PostMapping("/verify-reset-token")
    @Operation(summary = "Verify reset token", description = "Verify if 6-digit OTP reset token is valid and not expired")
    public ResponseEntity<ApiResponse<Boolean>> verifyResetToken(
            @Valid @RequestBody VerifyResetTokenRequest request
    ) {
        boolean valid = authService.verifyResetToken(request);
        return ResponseEntity.ok(ApiResponse.success("Kode verifikasi valid", valid));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset account password using valid OTP reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.", null));
    }
}
