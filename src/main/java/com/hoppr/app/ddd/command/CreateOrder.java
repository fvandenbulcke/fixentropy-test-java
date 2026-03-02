package com.hoppr.app.ddd.command;

import io.fixentropy.annotation.ddd.DDD;
import com.hoppr.app.ddd.value.Money;

@DDD.Command
public record CreateOrder(Money total) {}
