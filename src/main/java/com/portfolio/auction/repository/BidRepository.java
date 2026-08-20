package com.portfolio.auction.repository;

import com.portfolio.auction.entity.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BidRepository extends JpaRepository<Bid, Long> {

    Optional<Bid> findByBidderIdAndClientRequestId(Long bidderId, UUID clientRequestId);

    @EntityGraph(attributePaths = "bidder")
    Page<Bid> findByAuctionIdOrderByPlacedAtDesc(Long auctionId, Pageable pageable);
}
