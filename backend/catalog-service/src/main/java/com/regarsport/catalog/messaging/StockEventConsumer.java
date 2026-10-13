package com.regarsport.catalog.messaging;

import com.regarsport.catalog.service.StockSyncService;
import com.regarsport.common.event.OrderCancelledEvent;
import com.regarsport.common.event.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StockEventConsumer {

    private final StockSyncService stockSyncService;

    @RabbitListener(queues = RabbitMQConfig.STOCK_RESERVE_QUEUE)
    public void onOrderCreated(OrderCreatedEvent event) {
        stockSyncService.reserve(event.orderId(), event.items());
    }

    @RabbitListener(queues = RabbitMQConfig.STOCK_RELEASE_QUEUE)
    public void onOrderCancelled(OrderCancelledEvent event) {
        stockSyncService.release(event.orderId(), event.items());
    }
}
