package com.regarsport.catalog.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.regarsport.catalog.service.StorageService;
import com.regarsport.catalog.service.impl.CloudinaryStorageService;
import com.regarsport.catalog.service.impl.LocalStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

@Slf4j
@Configuration
public class StorageConfig {

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${app.storage.provider:cloudinary}")
    private String storageProvider;

    @Bean
    public Cloudinary cloudinary() {
        if (isCloudinaryConfigured()) {
            log.info("[Cloudinary] Initializing Cloudinary bean with cloud_name: {}", cloudName);
            return new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
        }
        return new Cloudinary(ObjectUtils.asMap("secure", true));
    }

    @Bean
    @Primary
    public StorageService storageService(LocalStorageService localStorageService, Cloudinary cloudinary) {
        if ("cloudinary".equalsIgnoreCase(storageProvider) && isCloudinaryConfigured()) {
            log.info("[StorageConfig] Menggunakan CloudinaryStorageService (Penyimpanan Cloud CDN Aktif).");
            return new CloudinaryStorageService(cloudinary);
        }

        log.warn("[StorageConfig] Kredensial Cloudinary belum diisi lengkap. Menggunakan LocalStorageService sebagai fallback.");
        return localStorageService;
    }

    private boolean isCloudinaryConfigured() {
        return StringUtils.hasText(cloudName) && StringUtils.hasText(apiKey) && StringUtils.hasText(apiSecret);
    }
}
