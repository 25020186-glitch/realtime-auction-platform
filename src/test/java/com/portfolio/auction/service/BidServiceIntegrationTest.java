package com.portfolio.auction.service;

import com.portfolio.auction.dto.request.PlaceBidRequest;
import com.portfolio.auction.dto.response.BidResponse;
import com.portfolio.auction.entity.Auction;
import com.portfolio.auction.entity.Category;
import com.portfolio.auction.entity.Product;
import com.portfolio.auction.entity.Role;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.AuctionStatus;
import com.portfolio.auction.enums.ProductCondition;
import com.portfolio.auction.enums.RoleName;
import com.portfolio.auction.enums.UserStatus;
import com.portfolio.auction.repository.AuctionRepository;
import com.portfolio.auction.repository.AuditLogRepository;
import com.portfolio.auction.repository.BidRepository;
import com.portfolio.auction.repository.CategoryRepository;
import com.portfolio.auction.repository.ProductRepository;
import com.portfolio.auction.repository.NotificationRepository;
import com.portfolio.auction.repository.RoleRepository;
import com.portfolio.auction.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BidServiceIntegrationTest {

    @Autowired private BidService bidService;
    @Autowired private BidRepository bidRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private AuditLogRepository auditLogRepository;

    private User seller;
    private User lowBidder;
    private User highBidder;
    private Auction auction;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        auctionRepository.clearAllWinningBids();
        bidRepository.deleteAll();
        auctionRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        roleRepository.deleteAll();

        Role buyerRole = roleRepository.save(Role.builder().name(RoleName.BUYER).build());
        Role sellerRole = roleRepository.save(Role.builder().name(RoleName.SELLER).build());
        seller = saveUser("seller@example.com", Set.of(buyerRole, sellerRole));
        lowBidder = saveUser("low@example.com", Set.of(buyerRole));
        highBidder = saveUser("high@example.com", Set.of(buyerRole));
        Category category = categoryRepository.save(Category.builder().name("Electronics").build());
        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .name("Mechanical Keyboard")
                .description("Hot-swappable keyboard")
                .condition(ProductCondition.LIKE_NEW)
                .build());
        auction = auctionRepository.save(Auction.builder()
                .product(product)
                .seller(seller)
                .startingPrice(new BigDecimal("100.00"))
                .currentPrice(new BigDecimal("100.00"))
                .minimumIncrement(new BigDecimal("10.00"))
                .startTime(Instant.now().minusSeconds(60))
                .endTime(Instant.now().plusSeconds(3600))
                .status(AuctionStatus.ACTIVE)
                .build());
    }

    @Test
    void concurrentBidsAreSerializedAndHighestValidBidWins() throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<Attempt> lowAttempt = executor.submit(() -> bidAfterLatch(
                    lowBidder, new BigDecimal("120.00"), ready, start));
            Future<Attempt> highAttempt = executor.submit(() -> bidAfterLatch(
                    highBidder, new BigDecimal("130.00"), ready, start));

            ready.await();
            start.countDown();
            Attempt low = lowAttempt.get();
            Attempt high = highAttempt.get();

            assertThat(high.error()).isNull();
            assertThat(high.response()).isNotNull();
            assertThat(low.response() != null || low.error() != null).isTrue();
        }

        Auction reloaded = auctionRepository.findById(auction.getId()).orElseThrow();
        assertThat(reloaded.getCurrentPrice()).isEqualByComparingTo("130.00");
        assertThat(reloaded.getWinningBid().getBidder().getId()).isEqualTo(highBidder.getId());
        assertThat(bidRepository.count()).isBetween(1L, 2L);
    }

    @Test
    void repeatedClientRequestIdReturnsTheOriginalBid() {
        UUID requestId = UUID.randomUUID();
        Authentication authentication = auth(lowBidder);

        BidResponse first = bidService.placeBid(
                auction.getId(), new PlaceBidRequest(new BigDecimal("110.00"), requestId), authentication);
        BidResponse repeated = bidService.placeBid(
                auction.getId(), new PlaceBidRequest(new BigDecimal("999.00"), requestId), authentication);

        assertThat(repeated.id()).isEqualTo(first.id());
        assertThat(repeated.amount()).isEqualByComparingTo("110.00");
        assertThat(bidRepository.count()).isEqualTo(1);
    }

    private Attempt bidAfterLatch(User bidder, BigDecimal amount, CountDownLatch ready, CountDownLatch start) {
        ready.countDown();
        try {
            start.await();
            return new Attempt(bidService.placeBid(
                    auction.getId(), new PlaceBidRequest(amount, UUID.randomUUID()), auth(bidder)), null);
        } catch (Exception exception) {
            return new Attempt(null, exception);
        }
    }

    private User saveUser(String email, Set<Role> roles) {
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash("not-used-in-this-test")
                .displayName(email.substring(0, email.indexOf('@')))
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build());
    }

    private Authentication auth(User user) {
        return UsernamePasswordAuthenticationToken.authenticated(user.getEmail(), "", List.of());
    }

    private record Attempt(BidResponse response, Exception error) {
    }
}
