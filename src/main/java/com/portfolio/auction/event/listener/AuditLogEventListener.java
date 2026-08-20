package com.portfolio.auction.event.listener;

import com.portfolio.auction.entity.AuditLog;
import com.portfolio.auction.event.BidPlacedEvent;
import com.portfolio.auction.repository.AuditLogRepository;
import com.portfolio.auction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class AuditLogEventListener {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBidPlaced(BidPlacedEvent event) {
        auditLogRepository.save(AuditLog.builder()
                .actor(userRepository.getReferenceById(event.bidderId()))
                .action("BID_PLACED")
                .entityType("AUCTION")
                .entityId(event.auctionId())
                .details("{\"bidId\":" + event.bidId() + ",\"amount\":\"" + event.amount() + "\"}")
                .build());
    }
}
