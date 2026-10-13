package com.regarsport.order.service;

import com.regarsport.common.event.OrderCancelledEvent;
import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderPaidEvent;
import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.common.exception.BadRequestException;
import com.regarsport.order.client.CatalogClient;
import com.regarsport.order.dto.CheckoutItemRequest;
import com.regarsport.order.dto.CheckoutRequest;
import com.regarsport.order.dto.OrderItemResponse;
import com.regarsport.order.dto.OrderResponse;
import com.regarsport.order.entity.Order;
import com.regarsport.order.entity.OrderItem;
import com.regarsport.order.entity.OrderStatus;
import com.regarsport.order.mapper.OrderMapper;
import com.regarsport.order.messaging.OrderEventProducer;
import com.regarsport.order.repository.CartItemRepository;
import com.regarsport.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService Unit Tests")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private OrderEventProducer orderEventProducer;

    @Mock
    private CatalogClient catalogClient;

    private final CatalogClient.CatalogProduct catalogProduct =
            new CatalogClient.CatalogProduct(100L, "Jersey Timnas", new BigDecimal("350000.00"), null, 10, Map.of("L", 10));

    @InjectMocks
    private OrderService orderService;

    private Order sampleOrder;
    private OrderResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleOrder = Order.builder()
                .id(1L)
                .orderNumber("REGAR-12345")
                .userId(10L)
                .customerName("Abu Dujanah")
                .customerEmail("abu@example.com")
                .totalAmount(new BigDecimal("700000.00"))
                .shippingAddress("Jl. Dago No. 10, Bandung")
                .status(OrderStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        OrderItem item = OrderItem.builder()
                .id(101L)
                .order(sampleOrder)
                .productId(100L)
                .productName("Jersey Timnas")
                .price(new BigDecimal("350000.00"))
                .quantity(2)
                .subtotal(new BigDecimal("700000.00"))
                .build();
        sampleOrder.addItem(item);

        OrderItemResponse itemResponse = new OrderItemResponse(
                101L, 100L, "Jersey Timnas", null, new BigDecimal("350000.00"), 2, new BigDecimal("700000.00")
        );

        sampleResponse = new OrderResponse(
                1L, "REGAR-12345", 10L, "Abu Dujanah", "abu@example.com",
                new BigDecimal("700000.00"), "Jl. Dago No. 10, Bandung", OrderStatus.PENDING,
                List.of(itemResponse), Instant.now(), Instant.now()
        );
    }

    @Test
    @DisplayName("Should checkout order and publish OrderCreatedEvent successfully")
    void testCheckout_Success() {
        CheckoutItemRequest itemReq = new CheckoutItemRequest(100L, "L", 2);
        CheckoutRequest request = new CheckoutRequest("Jl. Dago No. 10, Bandung", List.of(itemReq));

        when(catalogClient.getProduct(100L)).thenReturn(catalogProduct);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(sampleResponse);
        doNothing().when(orderEventProducer).publishOrderCreated(any(OrderCreatedEvent.class));

        OrderResponse response = orderService.checkout(10L, "Abu Dujanah", "abu@example.com", request);

        assertThat(response).isNotNull();

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository, times(1)).save(saved.capture());
        assertThat(saved.getValue().getTotalAmount()).isEqualByComparingTo(new BigDecimal("700000.00"));
        verify(orderEventProducer, times(1)).publishOrderCreated(any(OrderCreatedEvent.class));
    }

    @Test
    @DisplayName("Checkout uses the catalog price and name, never client-supplied values")
    void testCheckout_UsesCatalogPrice() {
        when(catalogClient.getProduct(100L)).thenReturn(
                new CatalogClient.CatalogProduct(100L, "Jersey Timnas", new BigDecimal("249000"), "/images/jersey.jpg", 10, Map.of("M", 10)));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.checkout(10L, "Abu Dujanah", "abu@example.com",
                new CheckoutRequest("Jl. Dago No. 10, Bandung", List.of(new CheckoutItemRequest(100L, "M", 3))));

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(saved.capture());
        OrderItem item = saved.getValue().getItems().get(0);
        assertThat(item.getPrice()).isEqualByComparingTo("249000");
        assertThat(item.getProductName()).isEqualTo("Jersey Timnas");
        assertThat(item.getProductImage()).isEqualTo("/images/jersey.jpg");
        assertThat(saved.getValue().getTotalAmount()).isEqualByComparingTo("747000");
    }

    @Test
    @DisplayName("Checkout is rejected when the product no longer exists in the catalog")
    void testCheckout_UnknownProduct_ThrowsException() {
        when(catalogClient.getProduct(999L)).thenThrow(new BadRequestException("Produk dengan id 999 tidak ditemukan atau sudah tidak dijual"));

        assertThatThrownBy(() -> orderService.checkout(10L, "Abu Dujanah", "abu@example.com",
                new CheckoutRequest("Jl. Dago No. 10, Bandung", List.of(new CheckoutItemRequest(999L, "L", 1)))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("tidak ditemukan");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when checkout items list is empty")
    void testCheckout_EmptyItems_ThrowsException() {
        CheckoutRequest request = new CheckoutRequest("Jl. Dago No. 10, Bandung", List.of());

        assertThatThrownBy(() -> orderService.checkout(10L, "Abu Dujanah", "abu@example.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot checkout with empty items list");

        verify(orderRepository, never()).save(any(Order.class));
        verify(orderEventProducer, never()).publishOrderCreated(any());
    }

    @Test
    @DisplayName("Should get order by ID when authorized")
    void testGetOrderById_Success() {
        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderMapper.toResponse(sampleOrder)).thenReturn(sampleResponse);

        OrderResponse response = orderService.getOrderById(1L, 10L, false);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        verify(orderRepository, times(1)).findByIdWithItems(1L);
    }

    @Test
    @DisplayName("Should throw BadRequestException when unauthorized user accesses order")
    void testGetOrderById_UnauthorizedUser() {
        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.getOrderById(1L, 999L, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Should update order status to PAID on PaymentStatusUpdatedEvent")
    void testHandlePaymentStatusUpdated_Success() {
        PaymentStatusUpdatedEvent event = new PaymentStatusUpdatedEvent(
                1L, "REGAR-12345", "PAID", "qris", new BigDecimal("700000.00"), Instant.now()
        );

        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(sampleOrder)).thenReturn(sampleOrder);

        orderService.handlePaymentStatusUpdated(event);

        assertThat(sampleOrder.getStatus()).isEqualTo(OrderStatus.PAID);
        verify(orderRepository, times(1)).save(sampleOrder);

        ArgumentCaptor<OrderPaidEvent> paid = ArgumentCaptor.forClass(OrderPaidEvent.class);
        verify(orderEventProducer, times(1)).publishOrderPaid(paid.capture());
        assertThat(paid.getValue().customerEmail()).isEqualTo("abu@example.com");
        assertThat(paid.getValue().paymentType()).isEqualTo("qris");
        assertThat(paid.getValue().items()).hasSize(1);
        assertThat(paid.getValue().items().get(0).productName()).isEqualTo("Jersey Timnas");
    }

    @Test
    @DisplayName("Should not publish a second invoice when the order is already PAID")
    void testHandlePaymentStatusUpdated_AlreadyPaid_NoDuplicateInvoice() {
        sampleOrder.setStatus(OrderStatus.PAID);
        PaymentStatusUpdatedEvent event = new PaymentStatusUpdatedEvent(
                1L, "REGAR-12345", "SETTLEMENT", "qris", new BigDecimal("700000.00"), Instant.now()
        );

        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(sampleOrder));

        orderService.handlePaymentStatusUpdated(event);

        verify(orderEventProducer, never()).publishOrderPaid(any());
    }

    @Test
    @DisplayName("Checkout is rejected when requested quantity exceeds size stock")
    void testCheckout_InsufficientSizeStock_ThrowsException() {
        when(catalogClient.getProduct(100L)).thenReturn(
                new CatalogClient.CatalogProduct(100L, "Jersey Timnas", new BigDecimal("249000"), null, 1, Map.of("L", 1)));

        assertThatThrownBy(() -> orderService.checkout(10L, "Abu Dujanah", "abu@example.com",
                new CheckoutRequest("Jl. Dago No. 10, Bandung", List.of(new CheckoutItemRequest(100L, "L", 2)))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("tidak mencukupi");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Cancelling an order publishes OrderCancelledEvent so catalog restores stock")
    void testCancelOrder_PublishesStockRelease() {
        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(sampleOrder)).thenReturn(sampleOrder);

        orderService.cancelOrder(1L, 10L, false, null);

        assertThat(sampleOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        ArgumentCaptor<OrderCancelledEvent> cancelled = ArgumentCaptor.forClass(OrderCancelledEvent.class);
        verify(orderEventProducer).publishOrderCancelled(cancelled.capture());
        assertThat(cancelled.getValue().items()).hasSize(1);
        assertThat(cancelled.getValue().items().get(0).quantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("Midtrans expire on an already cancelled order does not release stock twice")
    void testExpireOnCancelledOrder_NoDuplicateRelease() {
        sampleOrder.setStatus(OrderStatus.CANCELLED);
        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(sampleOrder));

        orderService.handlePaymentStatusUpdated(new PaymentStatusUpdatedEvent(
                1L, "REGAR-12345", "EXPIRE", "qris", new BigDecimal("700000.00"), Instant.now()));

        verify(orderEventProducer, never()).publishOrderCancelled(any());
    }
}
