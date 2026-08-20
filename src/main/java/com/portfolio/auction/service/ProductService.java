package com.portfolio.auction.service;

import com.portfolio.auction.dto.request.CreateProductRequest;
import com.portfolio.auction.dto.response.PageResponse;
import com.portfolio.auction.dto.response.ProductResponse;
import com.portfolio.auction.entity.Category;
import com.portfolio.auction.entity.Product;
import com.portfolio.auction.entity.User;
import com.portfolio.auction.exception.ApiException;
import com.portfolio.auction.mapper.ProductMapper;
import com.portfolio.auction.repository.CategoryRepository;
import com.portfolio.auction.repository.ProductRepository;
import com.portfolio.auction.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;
    private final ProductMapper productMapper;

    @Transactional
    public ProductResponse create(CreateProductRequest request, Authentication authentication) {
        User seller = currentUserService.requireActiveUser(authentication);
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Category was not found"));
        Product product = Product.builder()
                .seller(seller)
                .category(category)
                .name(request.name().trim())
                .description(request.description().trim())
                .condition(request.condition())
                .build();
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return productMapper.toResponse(requireProduct(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(int page, int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(productRepository.findAll(pageable), productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getMine(Authentication authentication, int page, int size) {
        User seller = currentUserService.requireActiveUser(authentication);
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(productRepository.findBySellerId(seller.getId(), pageable), productMapper::toResponse);
    }

    public Product requireProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product was not found"));
    }
}
