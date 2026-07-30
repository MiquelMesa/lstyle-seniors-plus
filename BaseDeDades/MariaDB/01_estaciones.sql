-- ============================================
-- Taula: estaciones
-- Base de dades: lstyle_seniors_plus
-- Motor: MariaDB
-- ============================================

CREATE TABLE IF NOT EXISTS estaciones (
  id INT NOT NULL,
  nombre_ca VARCHAR(100) NOT NULL,
  fecha_inicio VARCHAR(10) NOT NULL,
  fecha_fin VARCHAR(10) NOT NULL,
  icono VARCHAR(100) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dades taula 'estaciones'
INSERT INTO estaciones (id, nombre_ca, fecha_inicio, fecha_fin, icono) VALUES 
(1, 'Primavera', '03-21', '06-20', 'primavera.svg'),
(2, 'Estiu', '06-21', '09-22', 'estiu.svg'),
(3, 'Tardor', '09-23', '12-20', 'tardor.svg'),
(4, 'Hivern', '12-21', '03-20', 'hivern.svg');
