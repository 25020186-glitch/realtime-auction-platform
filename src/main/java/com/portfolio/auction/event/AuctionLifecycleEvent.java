package com.portfolio.auction.event;

import com.portfolio.auction.enums.AuctionStatus;

public record AuctionLifecycleEvent(
        Long auctionId,
        AuctionStatus status,
        Long sellerId,
        Long winnerId
) {
}
