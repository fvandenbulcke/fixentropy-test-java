package com.hoppr.app.ddd.event;

import io.dragee.annotation.ddd.DDD;
import com.hoppr.app.ddd.value.Money;
import java.util.UUID;

@DDD.Event
public record OrderCreated(UUID orderId, Money total) {}
