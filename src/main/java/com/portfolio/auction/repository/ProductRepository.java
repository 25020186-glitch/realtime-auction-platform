package com.portfolio.auction.repository;

import com.portfolio.auction.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Override
    @EntityGraph(attributePaths = {"seller", "category"})
    Page<Product> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"seller", "category"})
    Optional<Product> findById(Long id);

    @EntityGraph(attributePaths = {"seller", "category"})
    Page<Product> findBySellerId(Long sellerId, Pageable pageable);
}
