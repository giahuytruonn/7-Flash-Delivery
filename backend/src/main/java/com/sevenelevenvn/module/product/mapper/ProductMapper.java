package com.sevenelevenvn.module.product.mapper;

import com.sevenelevenvn.module.product.dto.ProductRequest;
import com.sevenelevenvn.module.product.dto.ProductResponse;
import com.sevenelevenvn.module.product.entity.Product;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {

    ProductResponse toResponse(Product product);

    Product toEntity(ProductRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(ProductRequest request, @MappingTarget Product product);
}
