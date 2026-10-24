-- ==============================================================================
-- SISTEMA DE COTIZACIONES - GRUPO CASTRO
-- Esquema de Base de Datos para MySQL / MariaDB (Hetzner Webhosting)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Almacena los usuarios autorizados para ingresar al cotizador
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLA: cotizaciones
-- Almacena todas las proformas y cotizaciones emitidas
-- El campo `id` utiliza el timestamp de milisegundos generado por la aplicación
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cotizaciones` (
  `id` BIGINT PRIMARY KEY,
  `cliente_nombre` VARCHAR(255) NOT NULL,
  `cliente_telefono` VARCHAR(50) DEFAULT '',
  `cliente_direccion` TEXT,
  `items_json` LONGTEXT NOT NULL,
  `subtotal` VARCHAR(50) NOT NULL,
  `descuento` DECIMAL(10,2) DEFAULT 0.00,
  `total` VARCHAR(50) NOT NULL,
  `fecha` VARCHAR(50) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cliente_nombre` (`cliente_nombre`),
  INDEX `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. USUARIO ADMINISTRADOR INICIAL
-- Usuario: admin
-- Contraseña por defecto: castro2026
-- Hash bcrypt ($2y$10$...) compatible con PHP password_verify()
-- ------------------------------------------------------------------------------
INSERT INTO `usuarios` (`username`, `password_hash`, `nombre`)
VALUES (
  'admin',
  '$2y$10$ljUSwB7xtXIdooFnHnOF.OEjc7V8tPkYk64yTwFDd4sG7IIHFhyW6',
  'Administrador Grupo Castro'
)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`);

-- ==============================================================================
-- NOTA PARA CAMBIAR LA CONTRASEÑA EN PRODUCCIÓN:
-- ==============================================================================
-- Opción A (Recomendada con bcrypt):
-- Puede generar un hash bcrypt en PHP con: password_hash('TuNuevaClave', PASSWORD_BCRYPT)
-- Y ejecutar en phpMyAdmin:
-- UPDATE `usuarios` SET `password_hash` = '$2y$10$...' WHERE `username` = 'admin';
--
-- Opción B (Directa / Temporal):
-- La API de Grupo Castro también admite texto plano si lo ingresas directamente en la BD:
-- UPDATE `usuarios` SET `password_hash` = 'MiNuevaClaveSegura2026' WHERE `username` = 'admin';
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 1;
