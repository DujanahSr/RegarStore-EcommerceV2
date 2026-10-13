package com.regarsport.payment.messaging;

import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publishPaymentStatusUpdated(PaymentStatusUpdatedEvent event) {
        log.info("Publishing PaymentStatusUpdatedEvent for orderId: {}, status: {} to exchange: {}",
                event.orderId(), event.paymentStatus(), RabbitMQConfig.PAYMENT_EXCHANGE);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PAYMENT_EXCHANGE,
                    RabbitMQConfig.PAYMENT_STATUS_ROUTING_KEY,
                    event
            );
            log.info("Successfully published PaymentStatusUpdatedEvent for orderId: {}", event.orderId());
        } catch (Exception e) {
            log.error("Failed to publish PaymentStatusUpdatedEvent for orderId: {}", event.orderId(), e);
        }
    }
}
