package com.portfolio.auction.config;

import com.portfolio.auction.entity.Role;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.RoleName;
import com.portfolio.auction.enums.UserStatus;
import com.portfolio.auction.repository.RoleRepository;
import com.portfolio.auction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-email:}")
    private String email;

    @Value("${app.bootstrap.admin-password:}")
    private String password;

    @Value("${app.bootstrap.admin-name:Auction Admin}")
    private String displayName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() && password.isBlank()) {
            return;
        }
        if (email.isBlank() || password.length() < 8) {
            throw new IllegalStateException("Bootstrap admin requires an email and a password of at least 8 characters");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        Set<Role> roles = new HashSet<>();
        for (RoleName roleName : RoleName.values()) {
            roles.add(roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Required role is missing: " + roleName)));
        }
        userRepository.save(User.builder()
                .email(email.trim().toLowerCase(Locale.ROOT))
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName.trim())
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build());
    }
}
