package com.regarsport.notification.consumer;

import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.common.event.OrderShippedEvent;
import com.regarsport.common.event.OrderPaidEvent;
import com.regarsport.notification.config.RabbitMQConfig;
import com.regarsport.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_ORDER_CREATED_QUEUE)
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("NotificationConsumer received OrderCreatedEvent for orderNumber: {}", event.orderNumber());
        try {
            emailService.sendOrderConfirmationEmail(event);
        } catch (Exception e) {
            log.error("Failed to process OrderCreatedEvent in NotificationConsumer: {}", event.orderNumber(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_ORDER_PAID_QUEUE)
    public void handleOrderPaid(OrderPaidEvent event) {
        log.info("NotificationConsumer received OrderPaidEvent for orderNumber: {}", event.orderNumber());
        try {
            emailService.sendInvoiceEmail(event);
        } catch (Exception e) {
            log.error("Failed to process OrderPaidEvent in NotificationConsumer: {}", event.orderNumber(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_ORDER_SHIPPED_QUEUE)
    public void handleOrderShipped(OrderShippedEvent event) {
        log.info("NotificationConsumer received OrderShippedEvent for orderNumber: {}, courier: {}, resi: {}",
                event.orderNumber(), event.shippingCourier(), event.trackingNumber());
        try {
            emailService.sendOrderShippedEmail(event);
        } catch (Exception e) {
            log.error("Failed to process OrderShippedEvent in NotificationConsumer: {}", event.orderNumber(), e);
        }
    }
}
