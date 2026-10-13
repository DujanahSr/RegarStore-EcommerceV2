package com.regarsport.order.messaging;

import com.regarsport.common.event.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publishOrderCreated(OrderCreatedEvent event) {
        log.info("Publishing OrderCreatedEvent for orderNumber: {} to exchange: {}",
                event.orderNumber(), RabbitMQConfig.ORDER_EXCHANGE);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ORDER_EXCHANGE,
                    RabbitMQConfig.ORDER_CREATED_ROUTING_KEY,
                    event
            );
            log.info("Successfully published OrderCreatedEvent for orderId: {}", event.orderId());
        } catch (Exception e) {
            log.error("Failed to publish OrderCreatedEvent for orderId: {}", event.orderId(), e);
        }
    }

    public void publishOrderShipped(com.regarsport.common.event.OrderShippedEvent event) {
        log.info("Publishing OrderShippedEvent for orderNumber: {} to exchange: {}",
                event.orderNumber(), RabbitMQConfig.ORDER_EXCHANGE);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ORDER_EXCHANGE,
                    RabbitMQConfig.ORDER_SHIPPED_ROUTING_KEY,
                    event
            );
            log.info("Successfully published OrderShippedEvent for orderId: {}", event.orderId());
        } catch (Exception e) {
            log.error("Failed to publish OrderShippedEvent for orderId: {}", event.orderId(), e);
        }
    }

    public void publishOrderPaid(com.regarsport.common.event.OrderPaidEvent event) {
        log.info("Publishing OrderPaidEvent for orderNumber: {} to exchange: {}",
                event.orderNumber(), RabbitMQConfig.ORDER_EXCHANGE);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ORDER_EXCHANGE,
                    RabbitMQConfig.ORDER_PAID_ROUTING_KEY,
                    event
            );
            log.info("Successfully published OrderPaidEvent for orderId: {}", event.orderId());
        } catch (Exception e) {
            log.error("Failed to publish OrderPaidEvent for orderId: {}", event.orderId(), e);
        }
    }

    public void publishOrderCancelled(com.regarsport.common.event.OrderCancelledEvent event) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.ORDER_EXCHANGE, RabbitMQConfig.ORDER_CANCELLED_ROUTING_KEY, event);
            log.info("Published OrderCancelledEvent for orderNumber: {}", event.orderNumber());
        } catch (Exception e) {
            log.error("Failed to publish OrderCancelledEvent for orderId: {}", event.orderId(), e);
        }
    }
}
