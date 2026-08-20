package com.portfolio.auction.repository;

import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.enums.AuctionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

public interface AuctionRepository extends JpaRepository<Auction, Long> {

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("update Auction a set a.winningBid = null")
    void clearAllWinningBids();

    boolean existsByProductId(Long productId);

    @Query("select a from Auction a where a.id = :id")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Auction> findByIdForUpdate(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"product", "seller", "product.category", "winningBid", "winningBid.bidder"})
    Optional<Auction> findById(Long id);

    @EntityGraph(attributePaths = {"product", "seller"})
    Page<Auction> findByStatus(AuctionStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"product", "seller"})
    Page<Auction> findAll(Pageable pageable);

    List<Auction> findByStatusAndStartTimeLessThanEqual(AuctionStatus status, Instant now);

    List<Auction> findByStatusAndEndTimeLessThanEqual(AuctionStatus status, Instant now);
}
