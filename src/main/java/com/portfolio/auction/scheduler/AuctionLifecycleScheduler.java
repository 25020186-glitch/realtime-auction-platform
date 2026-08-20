package com.portfolio.auction.scheduler;

import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.event.AuctionLifecycleEvent;
import com.portfolio.auction.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class AuctionLifecycleScheduler {

    private final AuctionRepository auctionRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    @Scheduled(fixedDelayString = "${app.auction.scheduler-delay-ms:5000}")
    @Transactional
    public void updateAuctionStates() {
        Instant now = clock.instant();
        auctionRepository.findByStatusAndStartTimeLessThanEqual(AuctionStatus.SCHEDULED, now)
                .forEach(auction -> {
                    auction.activate();
                    publish(auction);
                });
        auctionRepository.findByStatusAndEndTimeLessThanEqual(AuctionStatus.ACTIVE, now)
                .forEach(auction -> {
                    auction.end();
                    publish(auction);
                });
    }

    private void publish(Auction auction) {
        eventPublisher.publishEvent(new AuctionLifecycleEvent(
                auction.getId(), auction.getStatus(), auction.getSeller().getId(),
                auction.getWinningBid() == null ? null : auction.getWinningBid().getBidder().getId()
        ));
    }
}
