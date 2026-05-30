package com.sevenelevenvn.infrastructure.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "seven.eleven.exchange";
    
    public static final String DEDUCT_QUEUE = "inventory.deduct.queue";
    public static final String RESTORE_QUEUE = "inventory.restore.queue";
    public static final String STATUS_QUEUE = "order.status.queue";

    public static final String DEDUCT_DLQ = "inventory.deduct.dlq";
    public static final String RESTORE_DLQ = "inventory.restore.dlq";
    public static final String STATUS_DLQ = "order.status.dlq";

    public static final String DEDUCT_ROUTING_KEY = "inventory.deduct";
    public static final String RESTORE_ROUTING_KEY = "inventory.restore";
    public static final String STATUS_ROUTING_KEY = "order.status";

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(EXCHANGE);
    }

    // Dead Letter Queues
    @Bean
    public Queue deductDlq() {
        return QueueBuilder.durable(DEDUCT_DLQ).build();
    }

    @Bean
    public Queue restoreDlq() {
        return QueueBuilder.durable(RESTORE_DLQ).build();
    }

    @Bean
    public Queue statusDlq() {
        return QueueBuilder.durable(STATUS_DLQ).build();
    }

    // Main Queues with DLQ arguments
    @Bean
    public Queue deductQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", "");
        args.put("x-dead-letter-routing-key", DEDUCT_DLQ);
        return QueueBuilder.durable(DEDUCT_QUEUE).withArguments(args).build();
    }

    @Bean
    public Queue restoreQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", "");
        args.put("x-dead-letter-routing-key", RESTORE_DLQ);
        return QueueBuilder.durable(RESTORE_QUEUE).withArguments(args).build();
    }

    @Bean
    public Queue statusQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", "");
        args.put("x-dead-letter-routing-key", STATUS_DLQ);
        return QueueBuilder.durable(STATUS_QUEUE).withArguments(args).build();
    }

    // Bindings
    @Bean
    public Binding deductBinding() {
        return BindingBuilder.bind(deductQueue()).to(topicExchange()).with(DEDUCT_ROUTING_KEY);
    }

    @Bean
    public Binding restoreBinding() {
        return BindingBuilder.bind(restoreQueue()).to(topicExchange()).with(RESTORE_ROUTING_KEY);
    }

    @Bean
    public Binding statusBinding() {
        return BindingBuilder.bind(statusQueue()).to(topicExchange()).with(STATUS_ROUTING_KEY);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
