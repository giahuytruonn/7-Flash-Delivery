package com.sevenelevenvn.module.product;

import com.sevenelevenvn.module.order.event.OrderCancelledEvent;
import com.sevenelevenvn.module.order.event.OrderConfirmedEvent;
import com.sevenelevenvn.module.product.entity.Product;
import com.sevenelevenvn.module.product.event.InventoryDeductEvent;
import com.sevenelevenvn.module.product.event.InventoryDeductEvent.DeductItem;
import com.sevenelevenvn.module.product.event.InventoryRestoreEvent;
import com.sevenelevenvn.module.product.event.InventoryRestoreEvent.RestoreItem;
import com.sevenelevenvn.module.product.listener.InventoryEventListener;
import com.sevenelevenvn.module.product.repository.ProductRepository;
import com.sevenelevenvn.module.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryEventListenerTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductService productService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private InventoryEventListener inventoryEventListener;

    private UUID orderId;
    private UUID productId;
    private Product product;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        productId = UUID.randomUUID();

        product = Product.builder()
                .id(productId)
                .name("Snack Poca vị tôm")
                .sku("SN-003")
                .price(BigDecimal.valueOf(15000))
                .stockQuantity(120)
                .isActive(true)
                .build();
    }

    @Test
    void onDeductEvent_sufficientStock_shouldDeductAndPublishConfirmed() {
        DeductItem deductItem = DeductItem.builder()
                .productId(productId)
                .quantity(5)
                .build();

        InventoryDeductEvent event = InventoryDeductEvent.builder()
                .orderId(orderId)
                .items(Collections.singletonList(deductItem))
                .build();

        when(productRepository.findByIdWithPessimisticWriteLock(productId)).thenReturn(Optional.of(product));

        inventoryEventListener.onDeductEvent(event);

        assertEquals(115, product.getStockQuantity());
        verify(productRepository, times(1)).save(product);
        verify(eventPublisher, times(1)).publishEvent(any(OrderConfirmedEvent.class));
        verify(productService, times(1)).evictCache(productId);
    }

    @Test
    void onDeductEvent_insufficientStock_shouldPublishCancelled() {
        DeductItem deductItem = DeductItem.builder()
                .productId(productId)
                .quantity(150) // More than 120 stock
                .build();

        InventoryDeductEvent event = InventoryDeductEvent.builder()
                .orderId(orderId)
                .items(Collections.singletonList(deductItem))
                .build();

        when(productRepository.findByIdWithPessimisticWriteLock(productId)).thenReturn(Optional.of(product));

        inventoryEventListener.onDeductEvent(event);

        // Stock must not be changed (compensation triggers)
        assertEquals(120, product.getStockQuantity());
        verify(productRepository, never()).save(product);
        verify(eventPublisher, times(1)).publishEvent(any(OrderCancelledEvent.class));
    }

    @Test
    void onRestoreEvent_shouldRestoreStockForEachItem() {
        RestoreItem restoreItem = RestoreItem.builder()
                .productId(productId)
                .quantity(10)
                .build();

        InventoryRestoreEvent event = InventoryRestoreEvent.builder()
                .orderId(orderId)
                .items(Collections.singletonList(restoreItem))
                .build();

        when(productRepository.findByIdWithPessimisticWriteLock(productId)).thenReturn(Optional.of(product));

        inventoryEventListener.onRestoreEvent(event);

        assertEquals(130, product.getStockQuantity());
        verify(productRepository, times(1)).save(product);
        verify(productService, times(1)).evictCache(productId);
    }
}
