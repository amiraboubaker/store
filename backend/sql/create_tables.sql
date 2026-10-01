-- Store Societe GAM - schema for the live domain only (products + contacts).
-- Run with: mysql -u root -p < sql/create_tables.sql
--
-- This file mirrors backend/src/models/Product.js and backend/src/models/Contact.js
-- column for column. The two must stay in sync: sequelize.sync({ alter: true })
-- rewrites the live tables on boot, so any divergence here is what produces a
-- schema that disagrees with the ORM.
--
-- Column naming follows the Sequelize defaults (camelCase, no `underscored`),
-- which is why the timestamp columns are createdAt/updatedAt and not
-- created_at/updated_at.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(200) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `material` VARCHAR(100) DEFAULT 'unspecified',
  `price` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `description` TEXT NOT NULL,
  `images` JSON NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug` (`slug`),
  KEY `products_category` (`category`),
  KEY `products_material` (`material`),
  KEY `products_price` (`price`),
  KEY `products_stock` (`stock`),
  KEY `products_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Notes:
-- - `category` is a free-text label, not a foreign key. There is no `categories`
--   table, so category values are whatever the store chooses to use
--   (Fabric, Trims, Notions, ...).
-- - `images` holds an array of paths/URLs, never binary data. Keep uploads in
--   backend/uploads and serve them from /uploads/:filename.
-- - Dropped from the previous schema: users, addresses, categories, product_images,
--   inventory_movements, orders, order_items, product_reviews, coupons, payments.
--   products and contacts have no foreign keys, so they drop cleanly and in any order.