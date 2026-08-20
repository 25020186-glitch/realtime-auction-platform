package com.portfolio.auction.factory.sender;

import com.portfolio.auction.dto.response.NotificationResponse;
import com.portfolio.auction.enums.NotificationChannel;

public interface NotificationSender {
    NotificationChannel channel();
    void send(String recipient, NotificationResponse notification);
}
