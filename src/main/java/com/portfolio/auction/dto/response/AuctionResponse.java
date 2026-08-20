package com.portfolio.auction.dto.response;

import com.portfolio.auction.enums.AuctionStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AuctionResponse(
        Long id,
        Long productId,
        String productName,
        Long sellerId,
        String sellerName,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        BigDecimal minimumIncrement,
        Instant startTime,
        Instant endTime,
        AuctionStatus status,
        Long winningBidId,
        Long winnerId,
        long version
) {
}
