package com.portfolio.auction.mapper;

import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.entity.Auction;
import org.springframework.stereotype.Component;

@Component
public class AuctionMapper {

    public AuctionResponse toResponse(Auction auction) {
        Long winningBidId = auction.getWinningBid() == null ? null : auction.getWinningBid().getId();
        Long winnerId = auction.getWinningBid() == null ? null : auction.getWinningBid().getBidder().getId();
        return new AuctionResponse(
                auction.getId(),
                auction.getProduct().getId(),
                auction.getProduct().getName(),
                auction.getSeller().getId(),
                auction.getSeller().getDisplayName(),
                auction.getStartingPrice(),
                auction.getCurrentPrice(),
                auction.getMinimumIncrement(),
                auction.getStartTime(),
                auction.getEndTime(),
                auction.getStatus(),
                winningBidId,
                winnerId,
                auction.getVersion()
        );
    }
}
