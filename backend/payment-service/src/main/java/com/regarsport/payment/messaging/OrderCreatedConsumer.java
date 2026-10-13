package com.regarsport.payment.messaging;

import com.regarsport.common.event.OrderCreatedEvent;
import com.regarsport.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCreatedConsumer {

    private final PaymentService paymentService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_CREATED_QUEUE)
    public void receiveOrderCreated(OrderCreatedEvent event) {
        log.info("Received OrderCreatedEvent from RabbitMQ: orderId={}, orderNumber={}, totalAmount={}",
                event.orderId(), event.orderNumber(), event.totalAmount());
        try {
            paymentService.initializePaymentForOrder(event);
        } catch (Exception e) {
            log.error("Error initializing payment for orderId: {}", event.orderId(), e);
        }
    }
}
