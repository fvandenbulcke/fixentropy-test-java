package com.hoppr.app.ddd.value;

import io.fixentropy.annotation.ddd.DDD;
import java.math.BigDecimal;
import java.util.Objects;

@DDD.ValueObject
public record Money(BigDecimal amount, String currency) {
    public Money {
        Objects.requireNonNull(amount, "amount is required");
        Objects.requireNonNull(currency, "currency is required");
    }
}
