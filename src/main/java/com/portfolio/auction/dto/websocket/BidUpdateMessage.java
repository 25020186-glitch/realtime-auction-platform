package com.portfolio.auction.dto.websocket;

import java.math.BigDecimal;
import java.time.Instant;

public record BidUpdateMessage(
        String type,
        Long auctionId,
        Long bidId,
        Long bidderId,
        String bidderName,
        BigDecimal currentPrice,
        Instant placedAt
) {
}
