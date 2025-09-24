package com.hoppr.app.ddd.factory;

import io.dragee.annotation.ddd.DDD;
import com.hoppr.app.ddd.aggregate.Order;
import com.hoppr.app.ddd.command.CreateOrder;

import java.util.UUID;

@DDD.Factory
public class OrderFactory {
    public Order from(CreateOrder cmd) {
        return Order.create(cmd, UUID.randomUUID());
    }
}
