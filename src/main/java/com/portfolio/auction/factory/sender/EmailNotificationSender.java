package com.portfolio.auction.factory.sender;

import com.portfolio.auction.dto.response.NotificationResponse;
import com.portfolio.auction.enums.NotificationChannel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailNotificationSender implements NotificationSender {

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.EMAIL;
    }

    @Override
    public void send(String recipient, NotificationResponse notification) {
        // Adapter boundary: replace with SES/SendGrid without changing domain services.
        log.info("Email notification queued: recipient={}, type={}", recipient, notification.type());
    }
}
