package com.regarsport.catalog.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_EXCHANGE = "order.exchange";
    public static final String STOCK_RESERVE_QUEUE = "catalog.order-created.queue";
    public static final String STOCK_RELEASE_QUEUE = "catalog.order-cancelled.queue";

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE, true, false);
    }

    @Bean
    public Queue stockReserveQueue() {
        return QueueBuilder.durable(STOCK_RESERVE_QUEUE).build();
    }

    @Bean
    public Queue stockReleaseQueue() {
        return QueueBuilder.durable(STOCK_RELEASE_QUEUE).build();
    }

    @Bean
    public Binding stockReserveBinding(Queue stockReserveQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(stockReserveQueue).to(orderExchange).with("order.created");
    }

    @Bean
    public Binding stockReleaseBinding(Queue stockReleaseQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(stockReleaseQueue).to(orderExchange).with("order.cancelled");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
