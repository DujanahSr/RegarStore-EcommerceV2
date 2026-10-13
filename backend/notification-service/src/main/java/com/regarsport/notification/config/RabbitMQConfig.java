package com.regarsport.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_EXCHANGE = "order.exchange";
    public static final String ORDER_CREATED_ROUTING_KEY = "order.created";
    public static final String NOTIFICATION_ORDER_CREATED_QUEUE = "notification.order-created.queue";

    public static final String ORDER_SHIPPED_ROUTING_KEY = "order.shipped";
    public static final String NOTIFICATION_ORDER_SHIPPED_QUEUE = "notification.order-shipped.queue";

    public static final String ORDER_PAID_ROUTING_KEY = "order.paid";
    public static final String NOTIFICATION_ORDER_PAID_QUEUE = "notification.order-paid.queue";

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE, true, false);
    }

    @Bean
    public Queue notificationOrderCreatedQueue() {
        return QueueBuilder.durable(NOTIFICATION_ORDER_CREATED_QUEUE).build();
    }

    @Bean
    public Binding notificationOrderCreatedBinding(Queue notificationOrderCreatedQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(notificationOrderCreatedQueue).to(orderExchange).with(ORDER_CREATED_ROUTING_KEY);
    }

    @Bean
    public Queue notificationOrderShippedQueue() {
        return QueueBuilder.durable(NOTIFICATION_ORDER_SHIPPED_QUEUE).build();
    }

    @Bean
    public Binding notificationOrderShippedBinding(Queue notificationOrderShippedQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(notificationOrderShippedQueue).to(orderExchange).with(ORDER_SHIPPED_ROUTING_KEY);
    }

    @Bean
    public Queue notificationOrderPaidQueue() {
        return QueueBuilder.durable(NOTIFICATION_ORDER_PAID_QUEUE).build();
    }

    @Bean
    public Binding notificationOrderPaidBinding(Queue notificationOrderPaidQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(notificationOrderPaidQueue).to(orderExchange).with(ORDER_PAID_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
