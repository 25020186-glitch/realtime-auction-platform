package com.portfolio.auction.service;

import com.portfolio.auction.dto.response.NotificationResponse;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.entity.Notification;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.NotificationChannel;
import com.portfolio.auction.enums.NotificationType;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.factory.NotificationSenderFactory;
import com.portfolio.auction.repository.AuctionRepository;
import com.portfolio.auction.repository.NotificationRepository;
import com.portfolio.auction.repository.UserRepository;
import com.portfolio.auction.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final CurrentUserService currentUserService;
    private final NotificationSenderFactory senderFactory;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createAndSend(Long userId, Long auctionId, NotificationType type, String title, String message) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        Auction auction = auctionId == null ? null : auctionRepository.getReferenceById(auctionId);
        Notification saved = notificationRepository.save(Notification.builder()
                .user(user)
                .auction(auction)
                .type(type)
                .title(title)
                .message(message)
                .build());
        senderFactory.get(NotificationChannel.WEBSOCKET).send(user.getEmail(), toResponse(saved));
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> mine(Authentication authentication, int page, int size) {
        User user = currentUserService.requireActiveUser(authentication);
        return PageResponse.from(
                notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, Math.min(size, 100))),
                this::toResponse
        );
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, Authentication authentication) {
        User user = currentUserService.requireActiveUser(authentication);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Notification was not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_NOTIFICATION_OWNER", "This notification belongs to another user");
        }
        notification.markAsRead();
        return toResponse(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getAuction() == null ? null : notification.getAuction().getId(),
                notification.getType(), notification.getTitle(), notification.getMessage(),
                notification.isRead(), notification.getCreatedAt()
        );
    }
}
