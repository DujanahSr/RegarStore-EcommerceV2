package com.regarsport.catalog.controller;

import com.regarsport.catalog.service.StorageService;
import com.regarsport.common.exception.BadRequestException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "Endpoints for uploading images to Cloudinary or local storage")
public class FileUploadController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif", "svg");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final StorageService storageService;

    @PostMapping(value = {"/api/v1/upload", "/api/v1/products/upload"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image file", description = "Upload image to Cloudinary (or local storage)")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam(value = "image", required = false) MultipartFile imageParam,
            @RequestParam(value = "file", required = false) MultipartFile fileParam,
            @RequestParam(value = "folder", defaultValue = "regarstore/products") String folder
    ) {
        MultipartFile file = imageParam != null ? imageParam : fileParam;
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File upload tidak boleh kosong");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Ukuran file maksimal adalah 10MB");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Format file tidak didukung. Gunakan: JPG, JPEG, PNG, WEBP, atau GIF");
        }

        String fileUrl = storageService.upload(file, folder);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "File berhasil diunggah");
        response.put("image_url", fileUrl);
        response.put("provider", storageService.getProviderName());
        response.put("data", Map.of("imageUrl", fileUrl, "provider", storageService.getProviderName()));

        return ResponseEntity.ok(response);
    }
}
