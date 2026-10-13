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
import com.regarsport.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.regarsport.common.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    static final Duration OTP_TTL = Duration.ofMinutes(15);
    static final Duration OTP_RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int OTP_MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final OtpTokenRepository otpTokenRepository;
    private final AuthEmailService authEmailService;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Transactional
    public VerificationRequiredResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        log.info("Processing user registration for email: {}", email);

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user != null && Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Email " + email + " sudah terdaftar. Silakan masuk ke akun Anda.");
        }
        if (user == null) {
            user = User.builder().email(email).role(Role.ROLE_CUSTOMER).emailVerified(false).build();
        }
        // Belum terverifikasi: data pendaftaran terbaru menimpa yang lama, supaya email orang lain tidak bisa "disandera"
        user.setFullName(request.fullName().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);

        issueOtp(saved, OtpToken.Purpose.VERIFY_EMAIL, false);
        log.info("User {} registered (id: {}), waiting for email verification", email, saved.getId());
        return VerificationRequiredResponse.of(email);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Kode verifikasi tidak valid. Silakan minta kode baru."));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Email sudah terverifikasi. Silakan masuk ke akun Anda.");
        }

        consumeOtp(checkOtp(email, request.code(), OtpToken.Purpose.VERIFY_EMAIL));
        user.setEmailVerified(true);
        userRepository.save(user);
        assertActive(user);

        log.info("Email verified for user {}", email);
        return issueTokens(user);
    }

    @Transactional
    public void resendVerification(EmailRequest request) {
        String email = normalizeEmail(request.email());
        userRepository.findByEmailIgnoreCase(email)
                .filter(u -> !Boolean.TRUE.equals(u.getEmailVerified()))
                .ifPresent(u -> issueOtp(u, OtpToken.Purpose.VERIFY_EMAIL, true));
    }

    @Transactional(noRollbackFor = EmailNotVerifiedException.class)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        log.info("Processing login attempt for email: {}", email);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (user.getPassword() == null) {
            throw new BadRequestException("Akun ini terdaftar via Google. Masuk dengan tombol Google, atau atur kata sandi di Pengaturan Akun > Keamanan.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        assertActive(user);

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            issueOtp(user, OtpToken.Purpose.VERIFY_EMAIL, false);
            throw new EmailNotVerifiedException(email);
        }

        log.info("User {} successfully logged in", email);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleTokenVerifier.GoogleProfile google = googleTokenVerifier.verify(request.credential());

        User user = userRepository.findByGoogleId(google.sub()).orElse(null);
        if (user == null) {
            if (userRepository.existsByEmailIgnoreCase(google.email())) {
                throw new BadRequestException("Email " + google.email() + " sudah terdaftar. Masuk dengan email & kata sandi, lalu hubungkan akun Google di Pengaturan Akun > Keamanan.");
            }
            String name = google.name() != null && !google.name().isBlank()
                    ? google.name().trim()
                    : google.email().substring(0, google.email().indexOf('@'));
            user = userRepository.save(User.builder()
                    .fullName(name.length() > 150 ? name.substring(0, 150) : name)
                    .email(google.email())
                    .googleId(google.sub())
                    .emailVerified(true)
                    .avatarUrl(google.picture())
                    .role(Role.ROLE_CUSTOMER)
                    .build());
            log.info("New user {} registered via Google (id: {})", google.email(), user.getId());
        }

        assertActive(user);
        return issueTokens(user);
    }

    @Transactional
    public UserResponse linkGoogle(String currentEmail, GoogleAuthRequest request) {
        User user = findUser(currentEmail);
        if (user.getGoogleId() != null) {
            throw new BadRequestException("Akun Anda sudah terhubung dengan Google.");
        }

        GoogleTokenVerifier.GoogleProfile google = googleTokenVerifier.verify(request.credential());
        if (!google.email().equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("Email akun Google (" + google.email() + ") harus sama dengan email akun RegarStore Anda (" + user.getEmail() + ").");
        }

        user.setGoogleId(google.sub());
        user.setEmailVerified(true);
        log.info("User {} linked Google account", user.getEmail());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void requestPasswordSetup(String currentEmail, EmailRequest request) {
        User user = findUser(currentEmail);
        assertHasNoPassword(user);
        if (!normalizeEmail(request.email()).equals(normalizeEmail(user.getEmail()))) {
            throw new BadRequestException("Email tidak sama dengan email akun Google yang terhubung.");
        }
        issueOtp(user, OtpToken.Purpose.SET_PASSWORD, true);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public UserResponse setupPassword(String currentEmail, SetupPasswordRequest request) {
        User user = findUser(currentEmail);
        assertHasNoPassword(user);

        consumeOtp(checkOtp(user.getEmail(), request.code(), OtpToken.Purpose.SET_PASSWORD));
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        log.info("Password set up for Google account {}", user.getEmail());
        return userMapper.toResponse(userRepository.save(user));
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();

        if (!jwtService.validateToken(token)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        UserResponse userResponse = userMapper.toResponse(user);

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFullName()
        );

        return AuthResponse.of(newAccessToken, token, jwtService.getAccessTokenExpirationMs(), userResponse);
    }

    public UserResponse getCurrentUserProfile(String email) {
        return userMapper.toResponse(findUser(email));
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", email);
        User user = findUser(email);

        user.setFullName(request.fullName().trim());
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber().trim());
        }
        if (request.address() != null) {
            user.setAddress(request.address().trim());
        }
        if (request.city() != null) {
            user.setCity(request.city().trim());
        }
        if (request.postalCode() != null) {
            user.setPostalCode(request.postalCode().trim());
        }
        if (request.bio() != null) {
            user.setBio(request.bio().trim());
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Processing password change for user: {}", email);
        User user = findUser(email);

        if (user.getPassword() == null) {
            throw new BadRequestException("Akun Anda belum memiliki kata sandi. Gunakan fitur Atur Kata Sandi.");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Password saat ini yang Anda masukkan salah");
        }

        if (request.newPassword() == null || request.newPassword().trim().length() < 6) {
            throw new BadRequestException("Password baru minimal 6 karakter");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword().trim()));
        userRepository.save(user);
        log.info("Password successfully changed for user: {}", email);
    }

    public PageResponse<UserResponse> getAllUsers(String search, String roleStr, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(100, Math.max(1, size)), Sort.by("id").descending());
        Role role = null;
        if (roleStr != null && !roleStr.isBlank()) {
            try {
                role = roleStr.toUpperCase().startsWith("ROLE_")
                        ? Role.valueOf(roleStr.toUpperCase())
                        : Role.valueOf("ROLE_" + roleStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Page<User> userPage;
        boolean hasSearch = search != null && !search.trim().isBlank();
        if (hasSearch && role != null) {
            userPage = userRepository.searchUsersByRole(search.trim(), role, pageable);
        } else if (hasSearch) {
            userPage = userRepository.searchUsers(search.trim(), pageable);
        } else if (role != null) {
            userPage = userRepository.findByRole(role, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<UserResponse> content = userPage.getContent().stream()
                .map(userMapper::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                userPage.getNumber() + 1,
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isFirst(),
                userPage.isLast()
        );
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, String roleStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role newRole = roleStr.toUpperCase().startsWith("ROLE_")
                ? Role.valueOf(roleStr.toUpperCase())
                : Role.valueOf("ROLE_" + roleStr.toUpperCase());
        user.setRole(newRole);
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setActive(active);
        User saved = userRepository.save(user);
        log.info("User id {} status updated to active={}", userId, active);
        return userMapper.toResponse(saved);
    }

    public UserStatsResponse getUserStats() {
        long total = userRepository.count();
        long admins = userRepository.countByRole(Role.ROLE_ADMIN);
        long customers = userRepository.countByRole(Role.ROLE_CUSTOMER);
        return new UserStatsResponse(total, admins, customers);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        log.info("Processing forgot password request for email: {}", email);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Akun dengan email " + email + " tidak ditemukan di sistem kami."));

        issueOtp(user, OtpToken.Purpose.RESET_PASSWORD, true);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public boolean verifyResetToken(VerifyResetTokenRequest request) {
        checkOtp(normalizeEmail(request.email()), request.token(), OtpToken.Purpose.RESET_PASSWORD);
        return true;
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.email());
        OtpToken token = checkOtp(email, request.token(), OtpToken.Purpose.RESET_PASSWORD);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan dengan email: " + email));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        // OTP reset terkirim ke email ini, jadi kepemilikan email sudah terbukti
        user.setEmailVerified(true);
        userRepository.save(user);
        consumeOtp(token);

        log.info("Password successfully reset and updated for user: {}", email);
    }

    // ---------------------------------------------------------------- helpers

    /**
     * Kirim OTP baru (berlaku 15 menit) dan matikan OTP lama dengan tujuan yang sama.
     * failOnCooldown=false: diam-diam lewati kalau OTP terakhir belum 60 detik (register/login berulang).
     */
    private void issueOtp(User user, OtpToken.Purpose purpose, boolean failOnCooldown) {
        String email = user.getEmail();
        Optional<OtpToken> last = otpTokenRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose);
        if (last.isPresent() && last.get().getCreatedAt() != null) {
            long waitSeconds = Duration.between(Instant.now(), last.get().getCreatedAt().plus(OTP_RESEND_COOLDOWN)).toSeconds();
            if (waitSeconds > 0) {
                if (failOnCooldown) {
                    throw new BadRequestException("Tunggu " + waitSeconds + " detik sebelum meminta kode baru.");
                }
                return;
            }
        }

        otpTokenRepository.invalidateActive(email, purpose);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpTokenRepository.save(OtpToken.builder()
                .email(email)
                .purpose(purpose)
                .token(code)
                .expiryDate(Instant.now().plus(OTP_TTL))
                .build());
        authEmailService.sendOtpEmail(email, user.getFullName(), code, purpose);
    }

    /** Validasi OTP aktif terakhir. Salah 5x = hangus. Caller wajib @Transactional(noRollbackFor = BadRequestException) agar attempts tersimpan. */
    private OtpToken checkOtp(String email, String code, OtpToken.Purpose purpose) {
        OtpToken token = otpTokenRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new BadRequestException("Kode verifikasi tidak valid atau sudah tidak berlaku. Silakan minta kode baru."));

        if (token.isExpired()) {
            consumeOtp(token);
            throw new BadRequestException("Kode verifikasi telah kedaluwarsa (melebihi 15 menit). Silakan minta kode baru.");
        }

        String input = code == null ? "" : code.trim();
        if (!MessageDigest.isEqual(token.getToken().getBytes(StandardCharsets.UTF_8), input.getBytes(StandardCharsets.UTF_8))) {
            token.setAttempts(token.getAttempts() + 1);
            boolean exhausted = token.getAttempts() >= OTP_MAX_ATTEMPTS;
            token.setUsed(exhausted);
            otpTokenRepository.save(token);
            throw new BadRequestException(exhausted
                    ? "Terlalu banyak percobaan kode yang salah. Silakan minta kode baru."
                    : "Kode verifikasi salah. Sisa percobaan: " + (OTP_MAX_ATTEMPTS - token.getAttempts()) + ".");
        }
        return token;
    }

    private void consumeOtp(OtpToken token) {
        token.setUsed(true);
        otpTokenRepository.save(token);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFullName()
        );
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail());
        return AuthResponse.of(accessToken, refreshToken, jwtService.getAccessTokenExpirationMs(), userMapper.toResponse(user));
    }

    private void assertActive(User user) {
        if (Boolean.FALSE.equals(user.getActive())) {
            throw new BadRequestException("Akun Anda telah dinonaktifkan/disuspend oleh Admin. Silakan hubungi customer support.");
        }
    }

    private void assertHasNoPassword(User user) {
        if (user.getPassword() != null) {
            throw new BadRequestException("Akun Anda sudah memiliki kata sandi. Gunakan fitur Ganti Kata Sandi.");
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
