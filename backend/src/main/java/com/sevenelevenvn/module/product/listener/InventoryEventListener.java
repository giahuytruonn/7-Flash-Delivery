package com.sevenelevenvn.module.product.listener;

import com.sevenelevenvn.module.order.event.OrderCancelledEvent;
import com.sevenelevenvn.module.order.event.OrderConfirmedEvent;
import com.sevenelevenvn.module.product.entity.Product;
import com.sevenelevenvn.module.product.event.InventoryDeductEvent;
import com.sevenelevenvn.module.product.event.InventoryRestoreEvent;
import com.sevenelevenvn.module.product.repository.ProductRepository;
import com.sevenelevenvn.module.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryEventListener {

    private final ProductRepository productRepository;
    private final ProductService productService;
    private final ApplicationEventPublisher eventPublisher;

    @Async
    @EventListener
    @Transactional
    public void onDeductEvent(InventoryDeductEvent event) {
        UUID orderId = event.getOrderId();
        log.info("Bắt đầu xử lý trừ kho bất đồng bộ cho đơn hàng ID: {}", orderId);
        
        List<DeductProgress> progressList = new ArrayList<>();
        boolean isSufficient = true;
        String failureReason = "";

        for (var item : event.getItems()) {
            UUID productId = item.getProductId();
            int quantity = item.getQuantity();

            // Fetch product with pessimistic write lock
            Product product = productRepository.findByIdWithPessimisticWriteLock(productId).orElse(null);
            if (product == null) {
                isSufficient = false;
                failureReason = "Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán: ID " + productId;
                log.warn("Lỗi trừ kho đơn hàng {}: {}", orderId, failureReason);
                break;
            }

            if (product.getStockQuantity() < quantity) {
                isSufficient = false;
                failureReason = "Sản phẩm '" + product.getName() + "' không đủ số lượng tồn kho (Yêu cầu: " + quantity + ", Hiện có: " + product.getStockQuantity() + ")";
                log.warn("Lỗi trừ kho đơn hàng {}: {}", orderId, failureReason);
                break;
            }

            // Deduct stock
            int oldStock = product.getStockQuantity();
            int newStock = oldStock - quantity;
            product.setStockQuantity(newStock);
            productRepository.save(product);
            
            // Record progress for compensation in case of failure later in the loop
            progressList.add(new DeductProgress(productId, quantity, oldStock));
            
            log.info("Đã trừ tồn kho sản phẩm: {}, Số lượng: {} -> {}", product.getName(), quantity, newStock);
        }

        if (isSufficient) {
            log.info("Trừ kho thành công cho toàn bộ sản phẩm của đơn hàng ID: {} (Chờ thanh toán qua PayOS)", orderId);
            // DO NOT publish OrderConfirmedEvent here! The order stays PENDING until payment is confirmed.
            
            // Evict caches
            for (var p : progressList) {
                productService.evictCache(p.productId);
            }
        } else {
            // Cancel Order Event
            log.info("Trừ kho thất bại cho đơn hàng ID: {}. Đang thực hiện hoàn trả hàng đã trừ tạm thời (Compensation)...", orderId);
            
            // Compensation (Restore)
            for (var progress : progressList) {
                Product product = productRepository.findByIdWithPessimisticWriteLock(progress.productId).orElse(null);
                if (product != null) {
                    product.setStockQuantity(progress.originalStock);
                    productRepository.save(product);
                    productService.evictCache(progress.productId);
                }
            }

            eventPublisher.publishEvent(new OrderCancelledEvent(orderId, failureReason));
        }
    }

    @Async
    @EventListener
    @Transactional
    public void onRestoreEvent(InventoryRestoreEvent event) {
        log.info("Bắt đầu xử lý hoàn trả tồn kho bất đồng bộ cho đơn hàng ID: {}", event.getOrderId());
        
        for (var item : event.getItems()) {
            UUID productId = item.getProductId();
            int quantity = item.getQuantity();

            Product product = productRepository.findByIdWithPessimisticWriteLock(productId).orElse(null);
            if (product != null) {
                int newStock = product.getStockQuantity() + quantity;
                product.setStockQuantity(newStock);
                productRepository.save(product);
                productService.evictCache(productId);
                log.info("Đã hoàn trả thành công sản phẩm: {}, Số lượng: {} -> {}", product.getName(), quantity, newStock);
            } else {
                log.warn("Không thể hoàn trả sản phẩm ID: {} vì không tìm thấy sản phẩm", productId);
            }
        }
        log.info("Hoàn trả tồn kho thành công cho đơn hàng ID: {}", event.getOrderId());
    }

    private static class DeductProgress {
        UUID productId;
        int quantity;
        int originalStock;

        public DeductProgress(UUID productId, int quantity, int originalStock) {
            this.productId = productId;
            this.quantity = quantity;
            this.originalStock = originalStock;
        }
    }
}
