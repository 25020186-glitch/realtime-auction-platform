package com.portfolio.auction.service;

import com.portfolio.auction.dto.request.PlaceBidRequest;
import com.portfolio.auction.dto.response.BidResponse;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.entity.Bid;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.event.BidPlacedEvent;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.mapper.BidMapper;
import com.portfolio.auction.repository.AuctionRepository;
import com.portfolio.auction.repository.BidRepository;
import com.portfolio.auction.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class BidService {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher eventPublisher;
    private final BidMapper bidMapper;
    private final Clock clock;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BidResponse placeBid(Long auctionId, PlaceBidRequest request, Authentication authentication) {
        User bidder = currentUserService.requireActiveUser(authentication);

        // SELECT ... FOR UPDATE serializes all price decisions for this auction.
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AUCTION_NOT_FOUND", "Auction was not found"));

        Bid duplicate = bidRepository.findByBidderIdAndClientRequestId(bidder.getId(), request.clientRequestId())
                .orElse(null);
        if (duplicate != null) {
            if (!duplicate.getAuction().getId().equals(auctionId)) {
                throw new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "clientRequestId was already used for another auction");
            }
            return bidMapper.toResponse(duplicate);
        }

        Instant now = clock.instant();
        if (auction.getStatus() == AuctionStatus.SCHEDULED && !now.isBefore(auction.getStartTime())) {
            auction.activate();
        }
        validateBid(auction, bidder, request.amount(), now);

        Bid previousWinningBid = auction.getWinningBid();
        Bid bid = Bid.builder()
                .auction(auction)
                .bidder(bidder)
                .amount(request.amount())
                .clientRequestId(request.clientRequestId())
                .placedAt(now)
                .build();
        bidRepository.saveAndFlush(bid);
        auction.acceptBid(bid);
        auctionRepository.save(auction);

        eventPublisher.publishEvent(new BidPlacedEvent(
                auction.getId(), bid.getId(), bidder.getId(), bidder.getEmail(), bidder.getDisplayName(),
                bid.getAmount(), now,
                previousWinningBid == null ? null : previousWinningBid.getBidder().getId(),
                previousWinningBid == null ? null : previousWinningBid.getBidder().getEmail()
        ));
        return bidMapper.toResponse(bid);
    }

    @Transactional(readOnly = true)
    public PageResponse<BidResponse> history(Long auctionId, int page, int size) {
        if (!auctionRepository.existsById(auctionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "AUCTION_NOT_FOUND", "Auction was not found");
        }
        return PageResponse.from(
                bidRepository.findByAuctionIdOrderByPlacedAtDesc(auctionId, PageRequest.of(page, Math.min(size, 100))),
                bidMapper::toResponse
        );
    }

    private void validateBid(Auction auction, User bidder, BigDecimal amount, Instant now) {
        if (!auction.isOpenAt(now)) {
            throw new ApiException(HttpStatus.CONFLICT, "AUCTION_NOT_ACTIVE", "Auction is not active at this time");
        }
        if (auction.getSeller().getId().equals(bidder.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "SELLER_CANNOT_BID", "A seller cannot bid on their own auction");
        }
        BigDecimal minimumAllowed = auction.getCurrentPrice().add(auction.getMinimumIncrement());
        if (amount.compareTo(minimumAllowed) < 0) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "BID_TOO_LOW",
                    "Bid must be at least " + minimumAllowed.toPlainString()
            );
        }
    }
}
