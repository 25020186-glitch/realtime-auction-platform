package com.portfolio.auction.repository;

import com.portfolio.auction.entity.Watchlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    boolean existsByUserIdAndAuctionId(Long userId, Long auctionId);

    long deleteByUserIdAndAuctionId(Long userId, Long auctionId);

    @EntityGraph(attributePaths = {
            "auction", "auction.product", "auction.seller", "auction.winningBid", "auction.winningBid.bidder"
    })
    Page<Watchlist> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
