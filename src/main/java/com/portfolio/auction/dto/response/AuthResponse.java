package com.portfolio.auction.dto.response;

import java.time.Instant;
import java.util.Set;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        Long userId,
        String email,
        String displayName,
        Set<String> roles
) {
}
