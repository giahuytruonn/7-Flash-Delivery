package com.sevenelevenvn.module.order.listener;

import com.sevenelevenvn.module.order.entity.Order;
import com.sevenelevenvn.module.order.entity.OrderStatus;
import com.sevenelevenvn.module.order.event.OrderCancelledEvent;
import com.sevenelevenvn.module.order.event.OrderConfirmedEvent;
import com.sevenelevenvn.module.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderStatusUpdater {

    private final OrderRepository orderRepository;

    @EventListener
    @Transactional
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        UUID orderId = event.getOrderId();
        log.info("Nhận sự kiện xác nhận đơn hàng. Đang cập nhật trạng thái đơn hàng ID: {} thành CONFIRMED", orderId);
        
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            log.info("Cập nhật thành công trạng thái đơn hàng {} thành CONFIRMED", orderId);
        } else {
            log.warn("Không tìm thấy đơn hàng ID: {} để xác nhận", orderId);
        }
    }

    @EventListener
    @Transactional
    public void onOrderCancelled(OrderCancelledEvent event) {
        UUID orderId = event.getOrderId();
        log.info("Nhận sự kiện hủy đơn hàng. Đang cập nhật trạng thái đơn hàng ID: {} thành CANCELLED. Lý do: {}", orderId, event.getReason());
        
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            log.info("Cập nhật thành công trạng thái đơn hàng {} thành CANCELLED", orderId);
        } else {
            log.warn("Không tìm thấy đơn hàng ID: {} để hủy bỏ", orderId);
        }
    }
}
