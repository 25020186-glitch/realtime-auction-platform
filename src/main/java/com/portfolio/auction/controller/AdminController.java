package com.portfolio.auction.controller;

import com.portfolio.auction.dto.response.AuctionResponse;
import com.portfolio.auction.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PatchMapping("/auctions/{id}/approve")
    public AuctionResponse approve(@PathVariable Long id) {
        return adminService.approveAuction(id);
    }

    @PatchMapping("/auctions/{id}/reject")
    public AuctionResponse reject(@PathVariable Long id) {
        return adminService.rejectAuction(id);
    }

    @PatchMapping("/users/{id}/suspend")
    public AdminService.UserAdminResponse suspend(@PathVariable Long id) {
        return adminService.setUserSuspended(id, true);
    }

    @PatchMapping("/users/{id}/activate")
    public AdminService.UserAdminResponse activate(@PathVariable Long id) {
        return adminService.setUserSuspended(id, false);
    }
}
