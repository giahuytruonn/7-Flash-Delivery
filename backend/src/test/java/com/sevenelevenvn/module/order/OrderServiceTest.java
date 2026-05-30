package com.sevenelevenvn.module.order;

import com.sevenelevenvn.common.exception.ResourceNotFoundException;
import com.sevenelevenvn.module.order.dto.CreateOrderRequest;
import com.sevenelevenvn.module.order.dto.OrderItemRequest;
import com.sevenelevenvn.module.order.dto.OrderStatusResponse;
import com.sevenelevenvn.module.order.entity.Order;
import com.sevenelevenvn.module.order.entity.OrderStatus;
import com.sevenelevenvn.module.order.publisher.OrderEventPublisher;
import com.sevenelevenvn.module.order.repository.OrderRepository;
import com.sevenelevenvn.module.order.service.OrderService;
import com.sevenelevenvn.module.product.entity.Product;
import com.sevenelevenvn.module.product.repository.ProductRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    @InjectMocks
    private OrderService orderService;

    private UUID userId;
    private UUID productId;
    private Product product;
    private CreateOrderRequest createOrderRequest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        productId = UUID.randomUUID();

        product = Product.builder()
                .id(productId)
                .name("Bánh mì sandwich")
                .sku("BM-001")
                .price(BigDecimal.valueOf(35000))
                .stockQuantity(42)
                .isActive(true)
                .build();

        OrderItemRequest itemRequest = OrderItemRequest.builder()
                .productId(productId)
                .quantity(2)
                .build();

        createOrderRequest = CreateOrderRequest.builder()
                .items(Collections.singletonList(itemRequest))
                .note("Giao nhanh nhé")
                .build();

        // Mock SecurityContextHolder
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userId.toString());
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createOrder_validRequest_shouldSavePendingOrder() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        
        Order savedOrder = Order.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(70000))
                .build();
        
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        OrderStatusResponse response = orderService.createOrder(createOrderRequest);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        verify(orderRepository, times(1)).save(any(Order.class));
        verify(orderEventPublisher, times(1)).publishDeductEvent(any(Order.class));
    }

    @Test
    void createOrder_shouldUseSnapshotPriceNotClientPrice() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        
        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        
        Order savedOrder = Order.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(70000))
                .build();
        
        when(orderRepository.save(orderCaptor.capture())).thenReturn(savedOrder);

        orderService.createOrder(createOrderRequest);

        Order capturedOrder = orderCaptor.getValue();
        assertEquals(BigDecimal.valueOf(70000), capturedOrder.getTotalAmount());
        assertEquals(BigDecimal.valueOf(35000), capturedOrder.getItems().get(0).getUnitPrice());
    }

    @Test
    void createOrder_productNotFound_shouldThrowResourceNotFoundException() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.createOrder(createOrderRequest));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrder_inactiveProduct_shouldThrowResourceNotFoundException() {
        product.setIsActive(false);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThrows(ResourceNotFoundException.class, () -> orderService.createOrder(createOrderRequest));
    }

    @Test
    void createOrder_shouldCalculateCorrectTotalAmount() {
        UUID secondProductId = UUID.randomUUID();
        Product secondProduct = Product.builder()
                .id(secondProductId)
                .name("Sữa tươi")
                .sku("SM-008")
                .price(BigDecimal.valueOf(12000))
                .stockQuantity(10)
                .isActive(true)
                .build();

        OrderItemRequest item1 = OrderItemRequest.builder()
                .productId(productId)
                .quantity(2)
                .build();

        OrderItemRequest item2 = OrderItemRequest.builder()
                .productId(secondProductId)
                .quantity(3)
                .build();

        CreateOrderRequest multiRequest = CreateOrderRequest.builder()
                .items(List.of(item1, item2))
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.findById(secondProductId)).thenReturn(Optional.of(secondProduct));

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        
        Order savedOrder = Order.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(106000))
                .build();
        
        when(orderRepository.save(orderCaptor.capture())).thenReturn(savedOrder);

        orderService.createOrder(multiRequest);

        Order capturedOrder = orderCaptor.getValue();
        // Total = (35000 * 2) + (12000 * 3) = 70000 + 36000 = 106000
        assertEquals(BigDecimal.valueOf(106000), capturedOrder.getTotalAmount());
    }
}
