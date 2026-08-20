package com.portfolio.auction.service;

import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.event.AuctionLifecycleEvent;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.mapper.AuctionMapper;
import com.portfolio.auction.repository.AuctionRepository;
import com.portfolio.auction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final AuctionMapper auctionMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    @Transactional
    public AuctionResponse approveAuction(Long id) {
        Auction auction = lockedAuction(id);
        if (auction.getStatus() != AuctionStatus.PENDING_APPROVAL) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_AUCTION_STATUS", "Only pending auctions can be approved");
        }
        if (!auction.getEndTime().isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.CONFLICT, "AUCTION_ALREADY_EXPIRED", "Cannot approve an expired auction");
        }
        auction.approve(clock.instant());
        eventPublisher.publishEvent(new AuctionLifecycleEvent(
                auction.getId(), auction.getStatus(), auction.getSeller().getId(), null
        ));
        return auctionMapper.toResponse(auction);
    }

    @Transactional
    public AuctionResponse rejectAuction(Long id) {
        Auction auction = lockedAuction(id);
        if (auction.getStatus() != AuctionStatus.PENDING_APPROVAL) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_AUCTION_STATUS", "Only pending auctions can be rejected");
        }
        auction.reject();
        eventPublisher.publishEvent(new AuctionLifecycleEvent(
                auction.getId(), auction.getStatus(), auction.getSeller().getId(), null
        ));
        return auctionMapper.toResponse(auction);
    }

    @Transactional
    public UserAdminResponse setUserSuspended(Long userId, boolean suspended) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User was not found"));
        if (suspended) {
            user.suspend();
        } else {
            user.activate();
        }
        return new UserAdminResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getStatus().name());
    }

    private Auction lockedAuction(Long id) {
        return auctionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AUCTION_NOT_FOUND", "Auction was not found"));
    }

    public record UserAdminResponse(Long id, String email, String displayName, String status) {
    }
}
