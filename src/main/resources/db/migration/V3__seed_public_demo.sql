INSERT INTO users(email, password_hash, display_name, status, created_at, updated_at)
VALUES (
    'public-demo-owner@bidora.invalid',
    'ACCOUNT_DISABLED_NO_LOGIN',
    'Bidora Curated Collection',
    'DISABLED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO products(seller_id, category_id, name, description, condition, created_at, updated_at)
SELECT seller.id,
       category.id,
       'Celestia Moonphase 1968',
       'Đồng hồ cơ phong cách cổ điển, mặt moonphase tinh xảo, dây da thủ công và bộ máy được bảo dưỡng hoàn chỉnh. Một vật phẩm nổi bật cho bộ sưu tập cá nhân.',
       'LIKE_NEW',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM users seller
JOIN categories category ON category.name = 'Collectibles'
WHERE seller.email = 'public-demo-owner@bidora.invalid'
  AND NOT EXISTS (
      SELECT 1
      FROM products existing
      WHERE existing.seller_id = seller.id
        AND existing.name = 'Celestia Moonphase 1968'
  );

INSERT INTO product_images(product_id, image_url, display_order, created_at, updated_at)
SELECT product.id,
       'https://bidora-web-25020186.onrender.com/og.png',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM products product
JOIN users seller ON seller.id = product.seller_id
WHERE seller.email = 'public-demo-owner@bidora.invalid'
  AND product.name = 'Celestia Moonphase 1968'
  AND NOT EXISTS (
      SELECT 1 FROM product_images image WHERE image.product_id = product.id
  );

INSERT INTO auctions(
    product_id, seller_id, starting_price, current_price, minimum_increment,
    start_time, end_time, status, version, created_at, updated_at
)
SELECT product.id,
       seller.id,
       18000000,
       18000000,
       500000,
       CURRENT_TIMESTAMP - INTERVAL '1 hour',
       CURRENT_TIMESTAMP + INTERVAL '30 days',
       'ACTIVE',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM products product
JOIN users seller ON seller.id = product.seller_id
WHERE seller.email = 'public-demo-owner@bidora.invalid'
  AND product.name = 'Celestia Moonphase 1968'
  AND NOT EXISTS (
      SELECT 1 FROM auctions existing WHERE existing.product_id = product.id
  );
