-- ============================================
-- Taula: categorias_alimentos
-- Base de dades: lstyle_seniors_plus
-- Motor: MariaDB
-- ============================================

CREATE TABLE IF NOT EXISTS categorias_alimentos (
  id INT NOT NULL AUTO_INCREMENT,
  nombre_ca VARCHAR(100) NOT NULL,
  orden INT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dades taula categorias_alimentos
INSERT INTO categorias_alimentos (id, nombre_ca, orden) VALUES 
(1, 'Carns', 1),
(2, 'Peixos i mariscs', 2),
(3, 'Fruites', 3),
(4, 'Verdures i hortalisses', 4),
(5, 'Làctics', 5),
(6, 'Llegums', 6),
(7, 'Cereals i tubercles', 7),
(8, 'Fruits secs', 8),
(9, 'Ous', 9);
