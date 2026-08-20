package com.portfolio.auction.service;

import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.entity.Watchlist;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.mapper.AuctionMapper;
import com.portfolio.auction.repository.AuctionRepository;
import com.portfolio.auction.repository.WatchlistRepository;
import com.portfolio.auction.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final AuctionRepository auctionRepository;
    private final CurrentUserService currentUserService;
    private final AuctionMapper auctionMapper;
    private final Clock clock;

    @Transactional
    public void add(Long auctionId, Authentication authentication) {
        User user = currentUserService.requireActiveUser(authentication);
        if (watchlistRepository.existsByUserIdAndAuctionId(user.getId(), auctionId)) {
            return;
        }
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AUCTION_NOT_FOUND", "Auction was not found"));
        watchlistRepository.save(Watchlist.builder()
                .user(user)
                .auction(auction)
                .createdAt(clock.instant())
                .build());
    }

    @Transactional
    public void remove(Long auctionId, Authentication authentication) {
        User user = currentUserService.requireActiveUser(authentication);
        watchlistRepository.deleteByUserIdAndAuctionId(user.getId(), auctionId);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuctionResponse> mine(Authentication authentication, int page, int size) {
        User user = currentUserService.requireActiveUser(authentication);
        return PageResponse.from(
                watchlistRepository.findByUserIdOrderByCreatedAtDesc(
                        user.getId(), PageRequest.of(page, Math.min(size, 100))
                ),
                watchlist -> auctionMapper.toResponse(watchlist.getAuction())
        );
    }
}
