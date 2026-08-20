package com.portfolio.auction.factory;

import com.portfolio.auction.enums.NotificationChannel;
import com.portfolio.auction.factory.sender.NotificationSender;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class NotificationSenderFactory {

    private final Map<NotificationChannel, NotificationSender> senders;

    public NotificationSenderFactory(List<NotificationSender> senderList) {
        this.senders = new EnumMap<>(NotificationChannel.class);
        senderList.forEach(sender -> this.senders.put(sender.channel(), sender));
    }

    public NotificationSender get(NotificationChannel channel) {
        NotificationSender sender = senders.get(channel);
        if (sender == null) {
            throw new IllegalArgumentException("Unsupported notification channel: " + channel);
        }
        return sender;
    }
}
