package com.hoppr.app.ddd.event;

import com.hoppr.app.ddd.value.Money;
import io.fixentropy.annotation.ddd.DDD;

import java.util.UUID;

@DDD.Event
public record OrderCreated(UUID orderId, Money total) {}
