package com.portfolio.auction.mapper;

import com.portfolio.auction.dto.response.BidResponse;
import com.portfolio.auction.entity.Bid;
import org.springframework.stereotype.Component;

@Component
public class BidMapper {

    public BidResponse toResponse(Bid bid) {
        return new BidResponse(
                bid.getId(),
                bid.getAuction().getId(),
                bid.getBidder().getId(),
                bid.getBidder().getDisplayName(),
                bid.getAmount(),
                bid.getClientRequestId(),
                bid.getPlacedAt()
        );
    }
}
