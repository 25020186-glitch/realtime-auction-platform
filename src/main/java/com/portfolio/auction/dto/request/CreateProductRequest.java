package com.portfolio.auction.dto.request;

import com.portfolio.auction.enums.ProductCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 10_000) String description,
        @NotNull ProductCondition condition
) {
}
