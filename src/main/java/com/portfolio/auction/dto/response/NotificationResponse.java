package com.portfolio.auction.dto.response;

import com.portfolio.auction.enums.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        Long auctionId,
        NotificationType type,
        String title,
        String message,
        boolean read,
        Instant createdAt
) {
}
