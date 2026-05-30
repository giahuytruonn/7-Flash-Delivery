package com.sevenelevenvn.module.order.service;

import com.sevenelevenvn.common.PageResponse;
import com.sevenelevenvn.common.exception.ResourceNotFoundException;
import com.sevenelevenvn.module.order.dto.CreateOrderRequest;
import com.sevenelevenvn.module.order.dto.OrderItemResponse;
import com.sevenelevenvn.module.order.dto.OrderResponse;
import com.sevenelevenvn.module.order.dto.OrderStatusResponse;
import com.sevenelevenvn.module.order.entity.Order;
import com.sevenelevenvn.module.order.entity.OrderItem;
import com.sevenelevenvn.module.order.entity.OrderStatus;
import com.sevenelevenvn.module.order.publisher.OrderEventPublisher;
import com.sevenelevenvn.module.order.repository.OrderRepository;
import com.sevenelevenvn.module.product.entity.Product;
import com.sevenelevenvn.module.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public OrderStatusResponse createOrder(CreateOrderRequest request) {
        // 1. Extract userId from SecurityContext
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID userId;
        try {
            userId = UUID.fromString(String.valueOf(principal));
        } catch (Exception e) {
            // Fallback to guest UUID if not logged in
            userId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        
        log.info("Bắt đầu khởi tạo đơn hàng mới cho người dùng: {}", userId);

        Order order = Order.builder()
                .userId(userId)
                .status(OrderStatus.PENDING)
                .note(request.getNote())
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        // 2. Map items and snapshot price
        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> {
                        log.warn("Không thể tạo đơn hàng. Không tìm thấy sản phẩm ID: {}", itemReq.getProductId());
                        return new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + itemReq.getProductId());
                    });

            if (!product.getIsActive()) {
                log.warn("Không thể tạo đơn hàng. Sản phẩm ID: {} đã ngừng bán", itemReq.getProductId());
                throw new ResourceNotFoundException("Sản phẩm '" + product.getName() + "' đã ngừng bán");
            }

            BigDecimal price = product.getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .unitPrice(price)
                    .quantity(itemReq.getQuantity())
                    .subtotal(subtotal)
                    .build();

            order.addOrderItem(orderItem);
        }

        order.setTotalAmount(totalAmount);

        // 3. Save Order (status=PENDING)
        Order savedOrder = orderRepository.save(order);
        log.info("Đã lưu đơn hàng PENDING thành công. ID: {}, Tổng tiền: {}", savedOrder.getId(), savedOrder.getTotalAmount());

        // 4. Publish InventoryDeductEvent (Spring Event - Async listener handles actual deduction)
        orderEventPublisher.publishDeductEvent(savedOrder);

        return OrderStatusResponse.builder()
                .orderId(savedOrder.getId())
                .status(savedOrder.getStatus().name())
                .build();
    }

    public PageResponse<OrderResponse> findAll(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size);
        OrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                orderStatus = OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Status không hợp lệ: {}", status);
            }
        }

        Page<Order> orderPage = orderRepository.searchOrders(orderStatus, pageable);
        return PageResponse.from(orderPage.map(this::toResponse));
    }

    public OrderResponse findById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));
        return toResponse(order);
    }

    public List<OrderResponse> findMyOrders() {
        String principal = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID userId = UUID.fromString(principal);
        
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public OrderStatusResponse getOrderStatus(UUID id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID userId = null;
        try {
            userId = UUID.fromString(String.valueOf(principal));
        } catch (Exception e) {
            // Anonymous guest user
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        // If the order belongs to a registered user, check ownership
        UUID guestUuid = UUID.fromString("00000000-0000-0000-0000-000000000000");
        if (!order.getUserId().equals(guestUuid)) {
            if (userId == null || !order.getUserId().equals(userId)) {
                log.warn("Cảnh báo bảo mật: Người dùng ID: {} cố gắng truy cập trạng thái đơn hàng ID: {} thuộc về người dùng khác", userId, id);
                throw new AccessDeniedException("Bạn không có quyền truy cập thông tin đơn hàng này");
            }
        }

        return OrderStatusResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .build();
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .build();
    }
}
