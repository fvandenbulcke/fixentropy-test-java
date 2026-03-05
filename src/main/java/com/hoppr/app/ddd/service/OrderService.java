package com.hoppr.app.ddd.service;

import com.hoppr.app.ddd.aggregate.Order;
import com.hoppr.app.ddd.command.CreateOrder;
import com.hoppr.app.ddd.event.OrderCreated;
import com.hoppr.app.ddd.factory.OrderFactory;
import com.hoppr.app.ddd.repository.OrderRepository;
import io.fixentropy.annotation.ddd.DDD;

import java.util.Objects;

@DDD.Service
public class OrderService {
    private final OrderRepository repository;
    private final OrderFactory factory;

    public OrderService(OrderRepository repository, OrderFactory factory) {
        this.repository = Objects.requireNonNull(repository);
        this.factory = Objects.requireNonNull(factory);
    }

    public OrderCreated handle(CreateOrder cmd) {
        Order order = factory.from(cmd);
        repository.save(order);
        return new OrderCreated(order.id(), order.total());
    }
}
