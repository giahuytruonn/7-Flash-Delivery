package com.sevenelevenvn.module.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotBlank(message = "Mã SKU không được để trống")
    private String sku;

    private String description;

    private String category;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(value = "0.0", message = "Giá sản phẩm không được nhỏ hơn 0")
    private BigDecimal price;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được nhỏ hơn 0")
    private Integer stockQuantity;

    private String imageUrl;
}
