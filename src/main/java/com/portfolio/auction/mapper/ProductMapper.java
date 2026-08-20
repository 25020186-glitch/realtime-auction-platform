package com.portfolio.auction.mapper;

import com.portfolio.auction.dto.response.ProductResponse;
import com.portfolio.auction.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSeller().getId(),
                product.getSeller().getDisplayName(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getName(),
                product.getDescription(),
                product.getCondition(),
                product.getCreatedAt()
        );
    }
}
