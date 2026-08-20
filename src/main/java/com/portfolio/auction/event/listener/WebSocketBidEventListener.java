package com.portfolio.auction.event.listener;

import com.portfolio.auction.dto.websocket.BidUpdateMessage;
import com.portfolio.auction.event.BidPlacedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class WebSocketBidEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBidPlaced(BidPlacedEvent event) {
        BidUpdateMessage update = new BidUpdateMessage(
                "BID_PLACED", event.auctionId(), event.bidId(), event.bidderId(), event.bidderName(),
                event.amount(), event.placedAt()
        );
        messagingTemplate.convertAndSend("/topic/auctions/" + event.auctionId(), update);
    }
}
