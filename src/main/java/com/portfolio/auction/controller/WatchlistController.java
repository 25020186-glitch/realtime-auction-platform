package com.portfolio.auction.controller;

import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @PostMapping("/{auctionId}")
    public ResponseEntity<Void> add(@PathVariable Long auctionId, Authentication authentication) {
        watchlistService.add(auctionId, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{auctionId}")
    public ResponseEntity<Void> remove(@PathVariable Long auctionId, Authentication authentication) {
        watchlistService.remove(auctionId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public PageResponse<AuctionResponse> mine(Authentication authentication,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return watchlistService.mine(authentication, page, size);
    }
}
