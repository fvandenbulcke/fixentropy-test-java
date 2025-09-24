package com.hoppr.app.ddd.command;

import io.dragee.annotation.ddd.DDD;
import com.hoppr.app.ddd.value.Money;

@DDD.Command
public record CreateOrder(Money total) {}
