package com.portfolio.auction.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidResponse(
        Long id,
        Long auctionId,
        Long bidderId,
        String bidderName,
        BigDecimal amount,
        UUID clientRequestId,
        Instant placedAt
) {
}
