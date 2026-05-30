package com.sevenelevenvn.module.order.controller;

import com.sevenelevenvn.common.ApiResponse;
import com.sevenelevenvn.common.exception.ResourceNotFoundException;
import com.sevenelevenvn.module.order.entity.Order;
import com.sevenelevenvn.module.order.entity.OrderStatus;
import com.sevenelevenvn.module.order.repository.OrderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "4. Payments", description = "Endpoints tích hợp thanh toán PayOS")
@Slf4j
public class PaymentController {

    private final PayOS payOS;
    private final OrderRepository orderRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @PostMapping("/create/{orderId}")
    @Operation(summary = "Tạo link thanh toán PayOS cho đơn hàng", description = "Tạo cổng thanh toán quét mã QR qua PayOS cho mã đơn hàng tương ứng")
    public ApiResponse<Map<String, Object>> createPayment(@PathVariable UUID orderId) throws Exception {
        log.info("Bắt đầu tạo liên kết thanh toán PayOS cho đơn hàng ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        long orderCode = System.currentTimeMillis() / 1000;

        // Lưu ánh xạ giữa orderCode (long) và orderId (UUID) vào Redis trong 24 giờ
        redisTemplate.opsForValue().set("payos:ordercode:" + orderCode, orderId.toString(), java.time.Duration.ofHours(24));

        long amount = order.getTotalAmount().longValue();
        if (amount < 2000) {
            // PayOS yêu cầu số tiền tối thiểu là 2000 VND
            amount = 2000;
        }

        String returnUrl = "http://localhost:3000/payment-success";
        String cancelUrl = "http://localhost:3000/payment-cancel";

        CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount)
                .description("Thanh toán đơn hàng #" + orderId.toString().substring(0, 8))
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .item(PaymentLinkItem.builder()
                        .name("Đơn hàng 7-Eleven")
                        .price(amount)
                        .quantity(1)
                        .build())
                .build();

        CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);

        Map<String, Object> result = new HashMap<>();
        result.put("checkoutUrl", response.getCheckoutUrl());
        result.put("qrCode", response.getQrCode());
        result.put("paymentLinkId", response.getPaymentLinkId());
        result.put("orderCode", orderCode);

        log.info("Tạo liên kết thanh toán thành công cho đơn hàng ID: {}. Checkout URL: {}", orderId, response.getCheckoutUrl());
        return ApiResponse.success(result);
    }

    @PostMapping("/confirm-success/{orderId}")
    @Operation(summary = "Xác nhận thanh toán thành công (Demo)", description = "Bỏ qua cổng thanh toán thực và chuyển trạng thái đơn hàng thành CONFIRMED phục vụ việc test nhanh")
    public ApiResponse<Map<String, Object>> confirmSuccess(@PathVariable UUID orderId) {
        log.info("Xử lý xác nhận thanh toán thành công (Demo) cho đơn hàng ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        order.setStatus(OrderStatus.CONFIRMED);
        Order savedOrder = orderRepository.save(order);

        log.info("Đơn hàng ID: {} đã được chuyển trạng thái sang CONFIRMED thành công", orderId);
        return ApiResponse.success("Thanh toán đơn hàng thành công", Map.of(
                "orderId", savedOrder.getId().toString(),
                "status", savedOrder.getStatus().name()
        ));
    }
}
