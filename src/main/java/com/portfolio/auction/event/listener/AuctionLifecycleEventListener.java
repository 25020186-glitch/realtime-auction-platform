package com.portfolio.auction.event.listener;

import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.enums.NotificationType;
import com.portfolio.auction.event.AuctionLifecycleEvent;
import com.portfolio.auction.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class AuctionLifecycleEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStatusChanged(AuctionLifecycleEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/auctions/" + event.auctionId(),
                new AuctionStatusMessage("AUCTION_STATUS_CHANGED", event.auctionId(), event.status())
        );

        if (event.status() == AuctionStatus.ENDED) {
            notificationService.createAndSend(
                    event.sellerId(), event.auctionId(), NotificationType.AUCTION_ENDED,
                    "Auction ended", "Auction #" + event.auctionId() + " has ended."
            );
            if (event.winnerId() != null) {
                notificationService.createAndSend(
                        event.winnerId(), event.auctionId(), NotificationType.AUCTION_WON,
                        "You won the auction", "Congratulations! You won auction #" + event.auctionId() + "."
                );
            }
        } else if (event.status() == AuctionStatus.REJECTED) {
            notificationService.createAndSend(
                    event.sellerId(), event.auctionId(), NotificationType.AUCTION_REJECTED,
                    "Auction rejected", "Auction #" + event.auctionId() + " was rejected."
            );
        } else if (event.status() == AuctionStatus.ACTIVE || event.status() == AuctionStatus.SCHEDULED) {
            notificationService.createAndSend(
                    event.sellerId(), event.auctionId(), NotificationType.AUCTION_APPROVED,
                    "Auction approved", "Auction #" + event.auctionId() + " was approved."
            );
        }
    }

    private record AuctionStatusMessage(String type, Long auctionId, AuctionStatus status) {
    }
}
