package com.portfolio.auction.factory.sender;

import com.portfolio.auction.dto.response.NotificationResponse;
import com.portfolio.auction.enums.NotificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebSocketNotificationSender implements NotificationSender {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.WEBSOCKET;
    }

    @Override
    public void send(String recipient, NotificationResponse notification) {
        messagingTemplate.convertAndSendToUser(recipient, "/queue/notifications", notification);
    }
}
