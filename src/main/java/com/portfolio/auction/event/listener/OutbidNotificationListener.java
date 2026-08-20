package com.portfolio.auction.event.listener;

import com.portfolio.auction.enums.NotificationType;
import com.portfolio.auction.event.BidPlacedEvent;
import com.portfolio.auction.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class OutbidNotificationListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBidPlaced(BidPlacedEvent event) {
        notificationService.createAndSend(
                event.bidderId(), event.auctionId(), NotificationType.BID_ACCEPTED,
                "Bid accepted", "Your bid of " + event.amount().toPlainString() + " was accepted."
        );
        if (event.previousBidderId() != null && !event.previousBidderId().equals(event.bidderId())) {
            notificationService.createAndSend(
                    event.previousBidderId(), event.auctionId(), NotificationType.OUTBID,
                    "You have been outbid", "A higher bid was placed on auction #" + event.auctionId() + "."
            );
        }
    }
}
