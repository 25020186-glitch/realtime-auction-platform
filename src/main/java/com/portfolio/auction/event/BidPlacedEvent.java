package com.portfolio.auction.event;

import java.math.BigDecimal;
import java.time.Instant;

public record BidPlacedEvent(
        Long auctionId,
        Long bidId,
        Long bidderId,
        String bidderEmail,
        String bidderName,
        BigDecimal amount,
        Instant placedAt,
        Long previousBidderId,
        String previousBidderEmail
) {
}
