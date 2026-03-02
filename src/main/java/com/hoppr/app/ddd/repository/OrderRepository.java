package com.hoppr.app.ddd.repository;

import io.fixentropy.annotation.ddd.DDD;
import com.hoppr.app.ddd.aggregate.Order;
import java.util.Optional;
import java.util.UUID;

@DDD.Repository
public interface OrderRepository {
    void save(Order order);
    Optional<Order> findById(UUID id);
}
