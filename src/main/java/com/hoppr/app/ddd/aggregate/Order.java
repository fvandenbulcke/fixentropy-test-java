package com.hoppr.app.ddd.aggregate;

import io.dragee.annotation.ddd.DDD;
import com.hoppr.app.ddd.value.Money;
import com.hoppr.app.ddd.command.CreateOrder;
import java.util.UUID;

@DDD.Aggregate
public class Order {
    private final UUID id;
    private final Money total;

    public Order(UUID id, Money total) {
        this.id = id;
        this.total = total;
    }

    public UUID id() { return id; }
    public Money total() { return total; }

    public static Order create(CreateOrder cmd, UUID id) {
        return new Order(id, cmd.total());
    }
}
