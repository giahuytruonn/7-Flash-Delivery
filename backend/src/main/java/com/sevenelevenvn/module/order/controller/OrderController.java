package com.sevenelevenvn.module.order.controller;

import com.sevenelevenvn.common.ApiResponse;
import com.sevenelevenvn.common.PageResponse;
import com.sevenelevenvn.module.order.dto.CreateOrderRequest;
import com.sevenelevenvn.module.order.dto.OrderResponse;
import com.sevenelevenvn.module.order.dto.OrderStatusResponse;
import com.sevenelevenvn.module.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "3. Orders", description = "Endpoints đặt hàng và quản lý đơn hàng của hệ thống")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Đặt hàng mới (USER)", description = "Yêu cầu quyền USER. Đơn hàng được xử lý bất đồng bộ. Trả về mã 202 Accepted kèm trạng thái PENDING.")
    public ResponseEntity<ApiResponse<OrderStatusResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderStatusResponse response = orderService.createOrder(request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Đơn hàng đã được tiếp nhận và đang xử lý tồn kho", response));
    }

    @GetMapping
    @Operation(summary = "Xem tất cả đơn hàng (ADMIN)", description = "Yêu cầu quyền ADMIN. Xem danh sách toàn bộ đơn hàng trong hệ thống có phân trang và bộ lọc trạng thái.")
    public ApiResponse<PageResponse<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        PageResponse<OrderResponse> orders = orderService.findAll(page, size, status);
        return ApiResponse.success(orders);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một đơn hàng (ADMIN)", description = "Yêu cầu quyền ADMIN. Trả về thông tin chi tiết của một đơn hàng cùng danh sách sản phẩm.")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable UUID id) {
        OrderResponse order = orderService.findById(id);
        return ApiResponse.success(order);
    }

    @GetMapping("/my")
    @Operation(summary = "Xem lịch sử đơn hàng của tôi (USER)", description = "Yêu cầu quyền USER. Trả về toàn bộ đơn hàng mà người dùng hiện tại đã đặt.")
    public ApiResponse<List<OrderResponse>> getMyOrders() {
        List<OrderResponse> orders = orderService.findMyOrders();
        return ApiResponse.success(orders);
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Kiểm tra trạng thái đơn hàng (USER)", description = "Yêu cầu quyền USER. Dùng để client thực hiện kỹ thuật Polling kiểm tra kết quả trừ kho.")
    public ApiResponse<OrderStatusResponse> getOrderStatus(@PathVariable UUID id) {
        OrderStatusResponse status = orderService.getOrderStatus(id);
        return ApiResponse.success(status);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng (ADMIN)", description = "Yêu cầu quyền ADMIN. Cập nhật trạng thái đơn hàng (PENDING, CONFIRMED, CANCELLED).")
    public ApiResponse<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        OrderResponse order = orderService.updateStatus(id, status);
        return ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", order);
    }
}
