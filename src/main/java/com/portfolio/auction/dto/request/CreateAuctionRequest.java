package com.portfolio.auction.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateAuctionRequest(
        @NotNull Long productId,
        @NotNull @DecimalMin("0.00") @Digits(integer = 17, fraction = 2) BigDecimal startingPrice,
        @NotNull @DecimalMin("0.01") @Digits(integer = 17, fraction = 2) BigDecimal minimumIncrement,
        @NotNull Instant startTime,
        @NotNull Instant endTime
) {
}
