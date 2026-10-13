package com.regarsport.catalog.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.regarsport.catalog.service.StorageService;
import com.regarsport.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service("cloudinaryStorageService")
@RequiredArgsConstructor
public class CloudinaryStorageService implements StorageService {

    private final Cloudinary cloudinary;

    @Override
    public String upload(MultipartFile file, String folder) {
        try {
            String targetFolder = (folder != null && !folder.isBlank()) ? folder : "regarstore";

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", targetFolder,
                    "resource_type", "auto",
                    "use_filename", true,
                    "unique_filename", true
            );

            log.info("[Cloudinary] Uploading file to folder: {}", targetFolder);
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            log.info("[Cloudinary] Upload success: public_id={}, url={}", publicId, secureUrl);
            return secureUrl;

        } catch (IOException ex) {
            log.error("[Cloudinary] Upload failed: {}", ex.getMessage());
            throw new BadRequestException("Gagal mengunggah gambar ke Cloudinary: " + ex.getMessage());
        }
    }

    @Override
    public void delete(String fileUrl) {
        try {
            if (fileUrl != null && fileUrl.contains("cloudinary.com")) {
                // Extract public ID from Cloudinary URL
                // Example URL: https://res.cloudinary.com/demo/image/upload/v12345/regarstore/sample.jpg
                int uploadIdx = fileUrl.indexOf("/upload/");
                if (uploadIdx != -1) {
                    String sub = fileUrl.substring(uploadIdx + 8);
                    // skip version prefix e.g. v12345/
                    if (sub.matches("^v\\d+/.*")) {
                        sub = sub.substring(sub.indexOf('/') + 1);
                    }
                    int dotIdx = sub.lastIndexOf('.');
                    String publicId = (dotIdx != -1) ? sub.substring(0, dotIdx) : sub;

                    log.info("[Cloudinary] Deleting file with public_id: {}", publicId);
                    cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                }
            }
        } catch (Exception ex) {
            log.warn("[Cloudinary] Failed to delete file: {}", ex.getMessage());
        }
    }

    @Override
    public String getProviderName() {
        return "CLOUDINARY";
    }
}
