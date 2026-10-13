package com.regarsport.catalog.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    /**
     * Upload file to storage provider.
     *
     * @param file   MultipartFile to upload
     * @param folder Destination folder name (e.g. "regarstore/products")
     * @return Public HTTPS URL of the uploaded image
     */
    String upload(MultipartFile file, String folder);

    /**
     * Delete file from storage provider.
     *
     * @param fileUrl URL or publicId of the file to delete
     */
    void delete(String fileUrl);

    /**
     * Returns the name of active storage provider (e.g. "CLOUDINARY" or "LOCAL").
     */
    String getProviderName();
}
