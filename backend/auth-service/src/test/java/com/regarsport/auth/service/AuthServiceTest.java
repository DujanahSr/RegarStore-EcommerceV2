package com.regarsport.auth.service;

import com.regarsport.auth.dto.*;
import com.regarsport.auth.entity.OtpToken;
import com.regarsport.auth.entity.Role;
import com.regarsport.auth.entity.User;
import com.regarsport.auth.exception.EmailNotVerifiedException;
import com.regarsport.auth.mapper.UserMapper;
import com.regarsport.auth.repository.OtpTokenRepository;
import com.regarsport.auth.repository.UserRepository;
import com.regarsport.auth.security.JwtService;
import com.regarsport.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private OtpTokenRepository otpTokenRepository;

    @Mock
    private AuthEmailService authEmailService;

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private UserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setFullName("Abu Dujanah");
        sampleUser.setEmail("abu@example.com");
        sampleUser.setPassword("encoded_password_hash");
        sampleUser.setRole(Role.ROLE_CUSTOMER);
        sampleUser.setActive(true);
        sampleUser.setEmailVerified(true);
        sampleUser.setCreatedAt(Instant.now());

        sampleUserResponse = new UserResponse(
                1L, "Abu Dujanah", "abu@example.com", "ROLE_CUSTOMER", null, Instant.now()
        );
    }

    private void stubTokens() {
        when(userMapper.toResponse(any(User.class))).thenReturn(sampleUserResponse);
        when(jwtService.generateAccessToken(1L, "abu@example.com", "ROLE_CUSTOMER", "Abu Dujanah")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(1L, "abu@example.com")).thenReturn("mock-refresh-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(86400000L);
    }

    private OtpToken activeOtp(String code, OtpToken.Purpose purpose) {
        OtpToken token = OtpToken.builder()
                .email("abu@example.com")
                .purpose(purpose)
                .token(code)
                .expiryDate(Instant.now().plus(Duration.ofMinutes(15)))
                .build();
        token.setCreatedAt(Instant.now().minus(Duration.ofMinutes(5)));
        return token;
    }

    // ------------------------------------------------------------ register & verify

    @Test
    @DisplayName("Register creates unverified user, sends OTP, and returns no tokens")
    void testRegister_NewUser_SendsOtp() {
        RegisterRequest request = new RegisterRequest("Abu Dujanah", "abu@example.com", "password123");

        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password_hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        VerificationRequiredResponse response = authService.register(request);

        assertThat(response.email()).isEqualTo("abu@example.com");
        assertThat(response.requiresVerification()).isTrue();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmailVerified()).isFalse();
        verify(authEmailService).sendOtpEmail(eq("abu@example.com"), eq("Abu Dujanah"), anyString(), eq(OtpToken.Purpose.VERIFY_EMAIL));
        verify(jwtService, never()).generateAccessToken(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Register with an already verified email is rejected")
    void testRegister_VerifiedEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest("Abu Dujanah", "abu@example.com", "password123");
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sudah terdaftar");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Re-register an unverified email overwrites the password and re-sends OTP")
    void testRegister_UnverifiedEmail_OverwritesAndResends() {
        sampleUser.setEmailVerified(false);
        RegisterRequest request = new RegisterRequest("Abu Baru", "abu@example.com", "newpassword");

        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("newpassword")).thenReturn("new_hash");
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        authService.register(request);

        assertThat(sampleUser.getPassword()).isEqualTo("new_hash");
        assertThat(sampleUser.getFullName()).isEqualTo("Abu Baru");
        verify(authEmailService).sendOtpEmail(eq("abu@example.com"), any(), anyString(), eq(OtpToken.Purpose.VERIFY_EMAIL));
    }

    @Test
    @DisplayName("Verify email with correct OTP marks user verified and logs in")
    void testVerifyEmail_CorrectCode_LogsIn() {
        sampleUser.setEmailVerified(false);
        OtpToken otp = activeOtp("123456", OtpToken.Purpose.VERIFY_EMAIL);
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(otpTokenRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc("abu@example.com", OtpToken.Purpose.VERIFY_EMAIL))
                .thenReturn(Optional.of(otp));
        stubTokens();

        AuthResponse response = authService.verifyEmail(new VerifyEmailRequest("abu@example.com", "123456"));

        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(sampleUser.getEmailVerified()).isTrue();
        assertThat(otp.isUsed()).isTrue();
    }

    @Test
    @DisplayName("Wrong OTP 5 times invalidates the code")
    void testVerifyEmail_WrongCodeFiveTimes_Invalidates() {
        sampleUser.setEmailVerified(false);
        OtpToken otp = activeOtp("123456", OtpToken.Purpose.VERIFY_EMAIL);
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(otpTokenRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc("abu@example.com", OtpToken.Purpose.VERIFY_EMAIL))
                .thenReturn(Optional.of(otp));

        VerifyEmailRequest wrong = new VerifyEmailRequest("abu@example.com", "000000");
        for (int i = 1; i < AuthService.OTP_MAX_ATTEMPTS; i++) {
            assertThatThrownBy(() -> authService.verifyEmail(wrong)).hasMessageContaining("Sisa percobaan");
        }
        assertThatThrownBy(() -> authService.verifyEmail(wrong)).hasMessageContaining("Terlalu banyak percobaan");

        assertThat(otp.isUsed()).isTrue();
        assertThat(sampleUser.getEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("Resend verification inside the 60s cooldown is rejected")
    void testResendVerification_Cooldown_ThrowsException() {
        sampleUser.setEmailVerified(false);
        OtpToken recent = activeOtp("123456", OtpToken.Purpose.VERIFY_EMAIL);
        recent.setCreatedAt(Instant.now().minusSeconds(10));
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(otpTokenRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc("abu@example.com", OtpToken.Purpose.VERIFY_EMAIL))
                .thenReturn(Optional.of(recent));

        assertThatThrownBy(() -> authService.resendVerification(new EmailRequest("abu@example.com")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tunggu");

        verify(authEmailService, never()).sendOtpEmail(any(), any(), any(), any());
    }

    // ------------------------------------------------------------ login

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("abu@example.com", "password123");

        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_password_hash")).thenReturn(true);
        stubTokens();

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.user().fullName()).isEqualTo("Abu Dujanah");
    }

    @Test
    @DisplayName("Login with unverified email throws EmailNotVerifiedException and sends OTP")
    void testLogin_Unverified_ThrowsAndSendsOtp() {
        sampleUser.setEmailVerified(false);
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_password_hash")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("abu@example.com", "password123")))
                .isInstanceOf(EmailNotVerifiedException.class);

        verify(authEmailService).sendOtpEmail(eq("abu@example.com"), any(), anyString(), eq(OtpToken.Purpose.VERIFY_EMAIL));
        verify(jwtService, never()).generateAccessToken(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Password login on a Google-only account points the user to Google")
    void testLogin_GoogleOnlyAccount_ThrowsException() {
        sampleUser.setPassword(null);
        sampleUser.setGoogleId("google-sub");
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.login(new LoginRequest("abu@example.com", "password123")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("via Google");
    }

    @Test
    @DisplayName("Should throw BadRequestException when login password is invalid")
    void testLogin_InvalidPassword_ThrowsException() {
        LoginRequest request = new LoginRequest("abu@example.com", "wrongpassword");

        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encoded_password_hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");

        verify(jwtService, never()).generateAccessToken(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when email not found on login")
    void testLogin_UserNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest("unknown@example.com", "password123");

        when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");
    }

    // ------------------------------------------------------------ google

    @Test
    @DisplayName("Google login with an email already registered (not linked) is rejected")
    void testGoogleLogin_ExistingUnlinkedEmail_ThrowsException() {
        when(googleTokenVerifier.verify("id-token"))
                .thenReturn(new GoogleTokenVerifier.GoogleProfile("google-sub", "abu@example.com", "Abu", null));
        when(userRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(userRepository.existsByEmailIgnoreCase("abu@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.loginWithGoogle(new GoogleAuthRequest("id-token")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hubungkan akun Google");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Google login with a new email creates a verified account without password")
    void testGoogleLogin_NewEmail_CreatesVerifiedUser() {
        when(googleTokenVerifier.verify("id-token"))
                .thenReturn(new GoogleTokenVerifier.GoogleProfile("google-sub", "abu@example.com", "Abu Dujanah", "https://pic"));
        when(userRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(userRepository.existsByEmailIgnoreCase("abu@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        stubTokens();

        AuthResponse response = authService.loginWithGoogle(new GoogleAuthRequest("id-token"));

        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isNull();
        assertThat(saved.getValue().getEmailVerified()).isTrue();
        assertThat(saved.getValue().getGoogleId()).isEqualTo("google-sub");
    }

    @Test
    @DisplayName("Linking a Google account with a different email is rejected")
    void testLinkGoogle_DifferentEmail_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(googleTokenVerifier.verify("id-token"))
                .thenReturn(new GoogleTokenVerifier.GoogleProfile("google-sub", "other@gmail.com", "Other", null));

        assertThatThrownBy(() -> authService.linkGoogle("abu@example.com", new GoogleAuthRequest("id-token")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("harus sama");

        assertThat(sampleUser.getGoogleId()).isNull();
    }

    @Test
    @DisplayName("Password setup is rejected when the account already has a password")
    void testRequestPasswordSetup_HasPassword_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.requestPasswordSetup("abu@example.com", new EmailRequest("abu@example.com")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sudah memiliki kata sandi");
    }

    @Test
    @DisplayName("Password setup with an email other than the Google email is rejected")
    void testRequestPasswordSetup_WrongEmail_ThrowsException() {
        sampleUser.setPassword(null);
        sampleUser.setGoogleId("google-sub");
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.requestPasswordSetup("abu@example.com", new EmailRequest("lain@example.com")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("tidak sama");

        verify(authEmailService, never()).sendOtpEmail(any(), any(), any(), any());
    }

    // ------------------------------------------------------------ forgot password & refresh

    @Test
    @DisplayName("Forgot password sends OTP by email only")
    void testForgotPassword_SendsOtpEmail() {
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));

        authService.forgotPassword(new ForgotPasswordRequest("abu@example.com"));

        verify(authEmailService).sendOtpEmail(eq("abu@example.com"), any(), anyString(), eq(OtpToken.Purpose.RESET_PASSWORD));
    }

    @Test
    @DisplayName("Should refresh access token successfully with valid refresh token")
    void testRefreshToken_Success() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");

        when(jwtService.validateToken("valid-refresh-token")).thenReturn(true);
        when(jwtService.extractEmail("valid-refresh-token")).thenReturn("abu@example.com");
        when(userRepository.findByEmailIgnoreCase("abu@example.com")).thenReturn(Optional.of(sampleUser));
        when(userMapper.toResponse(sampleUser)).thenReturn(sampleUserResponse);
        when(jwtService.generateAccessToken(1L, "abu@example.com", "ROLE_CUSTOMER", "Abu Dujanah")).thenReturn("new-access-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.refreshToken(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("valid-refresh-token");
    }

    @Test
    @DisplayName("Should throw BadRequestException when refresh token is invalid")
    void testRefreshToken_InvalidToken_ThrowsException() {
        RefreshTokenRequest request = new RefreshTokenRequest("corrupted-token");

        when(jwtService.validateToken("corrupted-token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid or expired refresh token");
    }
}
