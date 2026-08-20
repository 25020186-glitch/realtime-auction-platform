package com.portfolio.auction.service;

import com.portfolio.auction.dto.request.LoginRequest;
import com.portfolio.auction.dto.request.RegisterRequest;
import com.portfolio.auction.dto.response.AuthResponse;
import com.portfolio.auction.entity.Role;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.enums.RoleName;
import com.portfolio.auction.enums.UserStatus;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.repository.RoleRepository;
import com.portfolio.auction.repository.UserRepository;
import com.portfolio.auction.security.JwtTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email is already registered");
        }
        Set<Role> roles = new HashSet<>();
        roles.add(requireRole(RoleName.BUYER));
        if (Boolean.TRUE.equals(request.registerAsSeller())) {
            roles.add(requireRole(RoleName.SELLER));
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName().trim())
                .phoneNumber(normalizeNullable(request.phoneNumber()))
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build();
        return toAuthResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", "This account is not active");
        }
        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        JwtTokenService.IssuedToken token = jwtTokenService.issue(user);
        return new AuthResponse(
                token.value(), "Bearer", token.expiresAt(), user.getId(), user.getEmail(),
                user.getDisplayName(), token.roles()
        );
    }

    private Role requireRole(RoleName name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Required role is missing: " + name));
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
