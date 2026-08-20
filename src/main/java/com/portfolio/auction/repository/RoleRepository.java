package com.portfolio.auction.repository;

import com.portfolio.auction.entity.Role;
import com.portfolio.auction.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
