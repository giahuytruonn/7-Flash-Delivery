package com.sevenelevenvn.infrastructure.messaging;

import com.sevenelevenvn.infrastructure.config.RabbitMQConfig;
import com.sevenelevenvn.module.order.event.OrderCancelledEvent;
import com.sevenelevenvn.module.order.event.OrderConfirmedEvent;
import com.sevenelevenvn.module.product.event.InventoryDeductEvent;
import com.sevenelevenvn.module.product.event.InventoryRestoreEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RabbitMQInventoryBridge {

    private final RabbitTemplate rabbitTemplate;

    @Async
    @EventListener
    public void bridgeDeductEvent(InventoryDeductEvent event) {
        log.info("RabbitMQ Bridge: Chuyển tiếp sự kiện trừ kho lên RabbitMQ. Đơn hàng: {}", event.getOrderId());
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.DEDUCT_ROUTING_KEY,
                    event
            );
        } catch (Exception ex) {
            log.error("RabbitMQ Bridge: Lỗi chuyển tiếp sự kiện trừ kho lên RabbitMQ:", ex);
        }
    }

    @Async
    @EventListener
    public void bridgeRestoreEvent(InventoryRestoreEvent event) {
        log.info("RabbitMQ Bridge: Chuyển tiếp sự kiện hoàn trả lên RabbitMQ. Đơn hàng: {}", event.getOrderId());
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.RESTORE_ROUTING_KEY,
                    event
            );
        } catch (Exception ex) {
            log.error("RabbitMQ Bridge: Lỗi chuyển tiếp sự kiện hoàn trả lên RabbitMQ:", ex);
        }
    }

    @Async
    @EventListener
    public void bridgeOrderConfirmed(OrderConfirmedEvent event) {
        log.info("RabbitMQ Bridge: Chuyển tiếp trạng thái CONFIRMED lên RabbitMQ. Đơn hàng: {}", event.getOrderId());
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("orderId", event.getOrderId());
            message.put("status", "CONFIRMED");
            
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.STATUS_ROUTING_KEY,
                    message
            );
        } catch (Exception ex) {
            log.error("RabbitMQ Bridge: Lỗi chuyển tiếp trạng thái CONFIRMED lên RabbitMQ:", ex);
        }
    }

    @Async
    @EventListener
    public void bridgeOrderCancelled(OrderCancelledEvent event) {
        log.info("RabbitMQ Bridge: Chuyển tiếp trạng thái CANCELLED lên RabbitMQ. Đơn hàng: {}", event.getOrderId());
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("orderId", event.getOrderId());
            message.put("status", "CANCELLED");
            message.put("reason", event.getReason());
            
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.STATUS_ROUTING_KEY,
                    message
            );
        } catch (Exception ex) {
            log.error("RabbitMQ Bridge: Lỗi chuyển tiếp trạng thái CANCELLED lên RabbitMQ:", ex);
        }
    }
}
