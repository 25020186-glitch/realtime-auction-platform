package com.portfolio.auction.dto.response;

import com.portfolio.auction.enums.ProductCondition;

import java.time.Instant;

public record ProductResponse(
        Long id,
        Long sellerId,
        String sellerName,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        ProductCondition condition,
        Instant createdAt
) {
}
