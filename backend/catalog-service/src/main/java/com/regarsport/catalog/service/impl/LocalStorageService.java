package com.regarsport.catalog.service.impl;

import com.regarsport.catalog.service.StorageService;
import com.regarsport.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service("localStorageService")
public class LocalStorageService implements StorageService {

    @Value("${app.upload.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    @Override
    public String upload(MultipartFile file, String folder) {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        try {
            Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String uniqueFilename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + (extension.isEmpty() ? "" : "." + extension);
            Path targetLocation = uploadPath.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = baseUrl + "/" + uniqueFilename;
            log.info("[LocalStorage] File successfully saved locally: {}", fileUrl);
            return fileUrl;
        } catch (IOException ex) {
            log.error("[LocalStorage] Failed to save file locally: {}", ex.getMessage());
            throw new BadRequestException("Gagal menyimpan berkas di server lokal");
        }
    }

    @Override
    public void delete(String fileUrl) {
        try {
            if (fileUrl != null && fileUrl.contains("/uploads/")) {
                String filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
                Path path = Paths.get("uploads").resolve(filename);
                Files.deleteIfExists(path);
                log.info("[LocalStorage] File deleted: {}", filename);
            }
        } catch (IOException e) {
            log.warn("[LocalStorage] Could not delete local file: {}", e.getMessage());
        }
    }

    @Override
    public String getProviderName() {
        return "LOCAL";
    }
}
