package com.sevenelevenvn.module.product;

import com.sevenelevenvn.common.PageResponse;
import com.sevenelevenvn.common.exception.DuplicateResourceException;
import com.sevenelevenvn.common.exception.ResourceNotFoundException;
import com.sevenelevenvn.module.product.dto.ProductRequest;
import com.sevenelevenvn.module.product.dto.ProductResponse;
import com.sevenelevenvn.module.product.entity.Product;
import com.sevenelevenvn.module.product.mapper.ProductMapper;
import com.sevenelevenvn.module.product.repository.ProductRepository;
import com.sevenelevenvn.module.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @InjectMocks
    private ProductService productService;

    private UUID productId;
    private Product product;
    private ProductResponse productResponse;
    private ProductRequest productRequest;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        product = Product.builder()
                .id(productId)
                .name("Cà phê sữa đá")
                .sku("CF-002")
                .price(BigDecimal.valueOf(25000))
                .stockQuantity(10)
                .isActive(true)
                .build();

        productResponse = ProductResponse.builder()
                .id(productId)
                .name("Cà phê sữa đá")
                .sku("CF-002")
                .price(BigDecimal.valueOf(25000))
                .stockQuantity(10)
                .isActive(true)
                .build();

        productRequest = ProductRequest.builder()
                .name("Cà phê sữa đá")
                .sku("CF-002")
                .price(BigDecimal.valueOf(25000))
                .stockQuantity(10)
                .build();
    }

    @Test
    void findAll_cacheMiss_shouldQueryDatabaseAndCache() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(Collections.singletonList(product), pageable, 1);
        
        when(productRepository.searchProducts("Beverage", "Cà phê", pageable)).thenReturn(page);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        PageResponse<ProductResponse> result = productService.findAll(0, 10, "Beverage", "Cà phê");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Cà phê sữa đá", result.getContent().get(0).getName());
        verify(productRepository, times(1)).searchProducts("Beverage", "Cà phê", pageable);
    }

    @Test
    void findById_notFound_shouldThrowResourceNotFoundException() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.findById(productId));
        verify(productRepository, times(1)).findById(productId);
    }

    @Test
    void findById_inactiveProduct_shouldThrowResourceNotFoundException() {
        product.setIsActive(false);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThrows(ResourceNotFoundException.class, () -> productService.findById(productId));
    }

    @Test
    void create_duplicateSku_shouldThrowDuplicateResourceException() {
        when(productRepository.findBySku("CF-002")).thenReturn(Optional.of(product));

        assertThrows(DuplicateResourceException.class, () -> productService.create(productRequest));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void create_validRequest_shouldSaveAndEvictCache() {
        when(productRepository.findBySku("CF-002")).thenReturn(Optional.empty());
        when(productMapper.toEntity(productRequest)).thenReturn(product);
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);
        when(cacheManager.getCache("products")).thenReturn(cache);

        ProductResponse result = productService.create(productRequest);

        assertNotNull(result);
        assertEquals("CF-002", result.getSku());
        verify(productRepository, times(1)).save(product);
        verify(cache, times(1)).clear();
    }

    @Test
    void softDelete_existingProduct_shouldSetInactiveFalse() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(cacheManager.getCache("products")).thenReturn(cache);

        productService.softDelete(productId);

        assertFalse(product.getIsActive());
        verify(productRepository, times(1)).save(product);
        verify(cache, times(1)).clear();
    }

    @Test
    void update_partialFields_shouldOnlyUpdateProvidedFields() {
        ProductRequest updateRequest = ProductRequest.builder()
                .name("Cà phê sữa đá đặc biệt")
                .sku("CF-002")
                .price(BigDecimal.valueOf(28000))
                .stockQuantity(15)
                .build();

        Product updatedProduct = Product.builder()
                .id(productId)
                .name("Cà phê sữa đá đặc biệt")
                .sku("CF-002")
                .price(BigDecimal.valueOf(28000))
                .stockQuantity(15)
                .isActive(true)
                .build();

        ProductResponse updatedResponse = ProductResponse.builder()
                .id(productId)
                .name("Cà phê sữa đá đặc biệt")
                .sku("CF-002")
                .price(BigDecimal.valueOf(28000))
                .stockQuantity(15)
                .isActive(true)
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        doAnswer(invocation -> {
            Product target = invocation.getArgument(1);
            target.setName(updateRequest.getName());
            target.setPrice(updateRequest.getPrice());
            target.setStockQuantity(updateRequest.getStockQuantity());
            return null;
        }).when(productMapper).updateEntityFromRequest(eq(updateRequest), any(Product.class));
        
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);
        when(productMapper.toResponse(any(Product.class))).thenReturn(updatedResponse);
        when(cacheManager.getCache("products")).thenReturn(cache);

        ProductResponse result = productService.update(productId, updateRequest);

        assertNotNull(result);
        assertEquals("Cà phê sữa đá đặc biệt", result.getName());
        assertEquals(BigDecimal.valueOf(28000), result.getPrice());
        verify(productRepository, times(1)).save(product);
    }
}
