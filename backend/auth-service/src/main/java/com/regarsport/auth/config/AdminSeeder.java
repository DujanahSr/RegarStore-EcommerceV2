package com.regarsport.auth.config;

import com.regarsport.auth.entity.Role;
import com.regarsport.auth.entity.User;
import com.regarsport.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Membuat akun admin dari ADMIN_EMAIL / ADMIN_PASSWORD (.env) saat start, kalau belum ada. Tidak menimpa admin yang sudah ada. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.name:Admin RegarStore}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.info("[AdminSeeder] ADMIN_EMAIL / ADMIN_PASSWORD kosong, seed admin dilewati");
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            log.info("[AdminSeeder] Akun admin {} sudah ada", email);
            return;
        }
        userRepository.save(User.builder()
                .fullName(adminName)
                .email(email)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ROLE_ADMIN)
                .emailVerified(true)
                .build());
        log.info("[AdminSeeder] Akun admin {} berhasil dibuat", email);
    }
}
