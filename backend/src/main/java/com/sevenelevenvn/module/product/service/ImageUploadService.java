package com.sevenelevenvn.module.product.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Không thể tải lên file rỗng");
        }

        log.info("Bắt đầu tải hình ảnh lên Cloudinary. Tên file: {}, Size: {} bytes", 
                file.getOriginalFilename(), file.getSize());

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(), 
                ObjectUtils.asMap(
                        "folder", "7eleven-products",
                        "resource_type", "image"
                )
        );

        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Tải hình ảnh lên Cloudinary thành công. URL: {}", secureUrl);

        return secureUrl;
    }
}
