package com.regarsport.order.messaging;

import com.regarsport.common.event.PaymentStatusUpdatedEvent;
import com.regarsport.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentStatusConsumer {

    private final OrderService orderService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_PAYMENT_STATUS_QUEUE)
    public void receivePaymentStatus(PaymentStatusUpdatedEvent event) {
        log.info("Received PaymentStatusUpdatedEvent for orderId: {}, status: {}",
                event.orderId(), event.paymentStatus());
        try {
            orderService.handlePaymentStatusUpdated(event);
        } catch (Exception e) {
            log.error("Error processing PaymentStatusUpdatedEvent for orderId: {}", event.orderId(), e);
        }
    }
}
