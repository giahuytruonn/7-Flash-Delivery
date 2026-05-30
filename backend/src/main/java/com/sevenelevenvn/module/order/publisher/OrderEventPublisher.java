package com.sevenelevenvn.module.order.publisher;

import com.sevenelevenvn.module.order.entity.Order;
import com.sevenelevenvn.module.product.event.InventoryDeductEvent;
import com.sevenelevenvn.module.product.event.InventoryDeductEvent.DeductItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public void publishDeductEvent(Order order) {
        log.info("Chuẩn bị phát hành sự kiện trừ kho cho đơn hàng ID: {}", order.getId());
        
        List<DeductItem> deductItems = order.getItems().stream()
                .map(item -> DeductItem.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        InventoryDeductEvent event = InventoryDeductEvent.builder()
                .orderId(order.getId())
                .items(deductItems)
                .build();

        eventPublisher.publishEvent(event);
        log.info("Đã phát hành sự kiện InventoryDeductEvent cho đơn hàng ID: {}", order.getId());
    }

    public void publishRestoreEvent(Order order) {
        log.info("Chuẩn bị phát hành sự kiện hoàn trả kho cho đơn hàng ID: {}", order.getId());

        List<com.sevenelevenvn.module.product.event.InventoryRestoreEvent.RestoreItem> restoreItems = order.getItems().stream()
                .map(item -> com.sevenelevenvn.module.product.event.InventoryRestoreEvent.RestoreItem.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        com.sevenelevenvn.module.product.event.InventoryRestoreEvent event = com.sevenelevenvn.module.product.event.InventoryRestoreEvent.builder()
                .orderId(order.getId())
                .items(restoreItems)
                .build();

        eventPublisher.publishEvent(event);
        log.info("Đã phát hành sự kiện InventoryRestoreEvent cho đơn hàng ID: {}", order.getId());
    }
}
