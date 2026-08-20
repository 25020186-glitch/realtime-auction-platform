package com.portfolio.auction.controller;

import com.portfolio.auction.dto.request.CreateAuctionRequest;
import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.dto.response.BidResponse;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.service.AuctionService;
import com.portfolio.auction.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auctions")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;
    private final BidService bidService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionResponse> create(@Valid @RequestBody CreateAuctionRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auctionService.create(request, authentication));
    }

    @GetMapping
    public PageResponse<AuctionResponse> list(@RequestParam(required = false) AuctionStatus status,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return auctionService.list(status, page, size);
    }

    @GetMapping("/{id}")
    public AuctionResponse getById(@PathVariable Long id) {
        return auctionService.getById(id);
    }

    @GetMapping("/{id}/bids")
    public PageResponse<BidResponse> bidHistory(@PathVariable Long id,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "50") int size) {
        return bidService.history(id, page, size);
    }
}
