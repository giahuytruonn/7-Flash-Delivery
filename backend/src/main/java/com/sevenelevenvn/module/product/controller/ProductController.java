package com.sevenelevenvn.module.product.controller;

import com.sevenelevenvn.common.ApiResponse;
import com.sevenelevenvn.common.PageResponse;
import com.sevenelevenvn.module.product.dto.ProductRequest;
import com.sevenelevenvn.module.product.dto.ProductResponse;
import com.sevenelevenvn.module.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.sevenelevenvn.module.product.service.ImageUploadService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "2. Products", description = "Endpoints quản lý sản phẩm trong hệ thống cửa hàng tiện lợi")
public class ProductController {

    private final ProductService productService;
    private final ImageUploadService imageUploadService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải ảnh sản phẩm lên Cloudinary (ADMIN)", description = "Yêu cầu quyền ADMIN, nhận file ảnh và tải lên đám mây")
    public ApiResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws Exception {
        String imageUrl = imageUploadService.uploadImage(file);
        return ApiResponse.success("Tải ảnh lên thành công", Map.of("imageUrl", imageUrl));
    }

    @GetMapping
    @Operation(summary = "Xem danh sách sản phẩm", description = "Tìm kiếm và lọc sản phẩm có hỗ trợ phân trang và lưu cache Redis")
    public ApiResponse<PageResponse<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        PageResponse<ProductResponse> products = productService.findAll(page, size, category, search);
        return ApiResponse.success(products);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một sản phẩm", description = "Trả về thông tin chi tiết của sản phẩm theo ID")
    public ApiResponse<ProductResponse> getProductById(@PathVariable UUID id) {
        ProductResponse product = productService.findById(id);
        return ApiResponse.success(product);
    }

    @PostMapping
    @Operation(summary = "Thêm sản phẩm mới (ADMIN)", description = "Yêu cầu quyền ADMIN, thêm mới và xóa cache danh sách")
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.create(request);
        return ApiResponse.success("Tạo sản phẩm thành công", product);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật sản phẩm (ADMIN)", description = "Cập nhật thông tin sản phẩm và xóa sạch cache cũ")
    public ApiResponse<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.update(id, request);
        return ApiResponse.success("Cập nhật sản phẩm thành công", product);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm sản phẩm (ADMIN)", description = "Ngừng kinh doanh sản phẩm (đánh dấu isActive = false)")
    public ApiResponse<Map<String, String>> deleteProduct(@PathVariable UUID id) {
        productService.softDelete(id);
        return ApiResponse.success("Ngừng kinh doanh sản phẩm thành công", Map.of("message", "Product deleted successfully"));
    }
}
