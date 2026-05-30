package com.sevenelevenvn.module.product.service;

import com.sevenelevenvn.common.PageResponse;
import com.sevenelevenvn.common.exception.DuplicateResourceException;
import com.sevenelevenvn.common.exception.ResourceNotFoundException;
import com.sevenelevenvn.module.product.dto.ProductRequest;
import com.sevenelevenvn.module.product.dto.ProductResponse;
import com.sevenelevenvn.module.product.entity.Product;
import com.sevenelevenvn.module.product.mapper.ProductMapper;
import com.sevenelevenvn.module.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final CacheManager cacheManager;
    private final RedisTemplate<String, Object> redisTemplate;

    @Cacheable(value = "products", key = "'list:' + #page + ':' + #size + ':' + (#category != null ? #category : '') + ':' + (#search != null ? #search : '')")
    public PageResponse<ProductResponse> findAll(int page, int size, String category, String search) {
        log.info("Cache miss. Đang truy vấn cơ sở dữ liệu cho danh sách sản phẩm. Page: {}, Size: {}, Category: {}, Search: {}", page, size, category, search);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.searchProducts(category, search, pageable);
        
        Page<ProductResponse> responsePage = productPage.map(productMapper::toResponse);
        return PageResponse.from(responsePage);
    }

    @Cacheable(value = "products", key = "'detail:' + #id")
    public ProductResponse findById(UUID id) {
        log.info("Cache miss. Đang truy vấn cơ sở dữ liệu cho chi tiết sản phẩm ID: {}", id);
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        
        if (!product.getIsActive()) {
            log.warn("Sản phẩm ID: {} đã bị ngừng kinh doanh (is_active = false)", id);
            throw new ResourceNotFoundException("Sản phẩm này đã ngừng bán");
        }
        
        return productMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        log.info("Bắt đầu tạo sản phẩm mới với SKU: {}", request.getSku());

        if (productRepository.findBySku(request.getSku()).isPresent()) {
            log.warn("Lỗi tạo sản phẩm. Trùng SKU: {}", request.getSku());
            throw new DuplicateResourceException("Mã SKU '" + request.getSku() + "' đã tồn tại trong hệ thống");
        }

        Product product = productMapper.toEntity(request);
        product.setIsActive(true);
        Product savedProduct = productRepository.save(product);
        log.info("Đã lưu sản phẩm mới thành công. ID: {}", savedProduct.getId());

        evictCache(savedProduct.getId());
        return productMapper.toResponse(savedProduct);
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        log.info("Bắt đầu cập nhật sản phẩm ID: {}", id);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));

        // Check if SKU is changed and is duplicate
        if (request.getSku() != null && !request.getSku().equalsIgnoreCase(product.getSku())) {
            if (productRepository.findBySku(request.getSku()).isPresent()) {
                throw new DuplicateResourceException("Mã SKU '" + request.getSku() + "' đã tồn tại ở sản phẩm khác");
            }
        }

        productMapper.updateEntityFromRequest(request, product);
        Product updatedProduct = productRepository.save(product);
        log.info("Đã cập nhật sản phẩm ID: {} thành công", id);

        evictCache(id);
        return productMapper.toResponse(updatedProduct);
    }

    @Transactional
    public void softDelete(UUID id) {
        log.info("Bắt đầu xóa mềm sản phẩm ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));

        product.setIsActive(false);
        productRepository.save(product);
        log.info("Đã xóa mềm thành công sản phẩm ID: {}", id);

        evictCache(id);
    }

    // Helper to evict Cache-Aside keys for safety
    public void evictCache(UUID productId) {
        log.info("Bắt đầu xóa cache liên quan đến sản phẩm...");
        
        // Evict Spring Cache manager regions
        var cache = cacheManager.getCache("products");
        if (cache != null) {
            cache.clear();
        }

        // Evict detail cache
        redisTemplate.delete("products::detail:" + productId);
        
        // Evict matching patterns in redis
        try {
            var keys = redisTemplate.keys("products::list:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Lỗi khi xóa keys cache theo pattern: {}", e.getMessage());
        }
    }
}
