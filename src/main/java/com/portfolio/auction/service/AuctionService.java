package com.portfolio.auction.service;

import com.portfolio.auction.dto.request.CreateAuctionRequest;
import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.entity.Product;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.mapper.AuctionMapper;
import com.portfolio.auction.repository.AuctionRepository;
import com.portfolio.auction.repository.ProductRepository;
import com.portfolio.auction.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;
    private final AuctionMapper auctionMapper;
    private final Clock clock;

    @Transactional
    public AuctionResponse create(CreateAuctionRequest request, Authentication authentication) {
        User seller = currentUserService.requireActiveUser(authentication);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product was not found"));
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_PRODUCT_OWNER", "Only the product owner can create its auction");
        }
        if (auctionRepository.existsByProductId(product.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "PRODUCT_ALREADY_AUCTIONED", "This product already has an auction");
        }
        validateTimes(request.startTime(), request.endTime());
        Auction auction = Auction.builder()
                .product(product)
                .seller(seller)
                .startingPrice(request.startingPrice())
                .currentPrice(request.startingPrice())
                .minimumIncrement(request.minimumIncrement())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .status(AuctionStatus.PENDING_APPROVAL)
                .build();
        return auctionMapper.toResponse(auctionRepository.save(auction));
    }

    @Transactional(readOnly = true)
    public AuctionResponse getById(Long id) {
        return auctionMapper.toResponse(requireAuction(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<AuctionResponse> list(AuctionStatus status, int page, int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = status == null ? auctionRepository.findAll(pageable) : auctionRepository.findByStatus(status, pageable);
        return PageResponse.from(result, auctionMapper::toResponse);
    }

    public Auction requireAuction(Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AUCTION_NOT_FOUND", "Auction was not found"));
    }

    private void validateTimes(Instant startTime, Instant endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AUCTION_TIME", "endTime must be after startTime");
        }
        if (!endTime.isAfter(clock.instant())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AUCTION_TIME", "endTime must be in the future");
        }
    }
}
