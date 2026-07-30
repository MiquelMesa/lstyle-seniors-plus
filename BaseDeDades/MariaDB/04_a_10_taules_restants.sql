-- ============================================
-- TAULES RESTANTS (4-10)
-- Base de dades: lstyle_seniors_plus
-- Motor: MariaDB
-- ============================================

-- ============================================
-- 04. CONDICIONES_SALUD
-- ============================================

CREATE TABLE IF NOT EXISTS condiciones_salud (
  id INT NOT NULL AUTO_INCREMENT,
  nombre_ca VARCHAR(200) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  orden INT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_condiciones_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO condiciones_salud (id, nombre_ca, codigo, orden) VALUES 
(1, 'Colesterol alt', 'COLESTEROL', 1),
(2, 'Glicèmia elevada (prediabetis)', 'AZUCAR', 2),
(3, 'Hipertensió arterial', 'HIPERTENSION', 3),
(4, 'Diabetis tipus 2', 'DIABETES', 4),
(5, 'Tiroides (hipo/hiper)', 'TIROIDES', 5),
(6, 'Restrenyiment', 'ESTRENIMIENTO', 6),
(7, 'Insomni', 'INSOMNIO', 7),
(8, 'Àcid úric / Gota', 'ACIDO_URICO', 8),
(9, 'Menopausa', 'MENOPAUSIA', 9),
(10, 'Cardiopatia', 'CARDIOPATIA', 10),
(11, 'Osteoporosi', 'OSTEOPOROSIS', 11),
(12, 'Antecedents de càncer', 'CANCER', 12);

-- ============================================
-- 05. CONSEJOS_CONDICIONES
-- ============================================

CREATE TABLE IF NOT EXISTS consejos_condiciones (
  id INT NOT NULL AUTO_INCREMENT,
  condicion_id INT NULL,
  tipo ENUM('ALIMENTACION', 'EJERCICIO', 'MEDICACION', 'GENERAL') NULL,
  consejo_ca TEXT NOT NULL,
  prioridad INT NULL DEFAULT 2,
  fuente VARCHAR(255) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_consejos_condicion FOREIGN KEY (condicion_id) REFERENCES condiciones_salud (id),
  INDEX idx_consejos_condicion (condicion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir consells (redu\u00eft per tokens, inserta manualment des de fitxer original)
-- Total: 61 registres de consells per a les 12 condicions

-- ============================================
-- 06. TELEFONOS_EMERGENCIA
-- ============================================

CREATE TABLE IF NOT EXISTS telefonos_emergencia (
  id INT NOT NULL AUTO_INCREMENT,
  nombre_ca VARCHAR(200) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  descripcion_ca TEXT NULL,
  tipo ENUM('EMERGENCIA', 'SALUD', 'SOCIAL') NULL,
  orden INT NULL,
  icono VARCHAR(100) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO telefonos_emergencia (id, nombre_ca, telefono, descripcion_ca, tipo, orden, icono) VALUES 
(1, 'Emergències 112', '112', 'Telèfon únic d\'emergències (24h). Bombers, ambulàncies, Mossos d\'Esquadra.', 'EMERGENCIA', 1, 'emergencia.svg'),
(2, 'Emergències Sanitàries 061', '061', 'Sistema d\'Emergències Mèdiques. Atenció urgent sanitària (24h).', 'SALUD', 2, 'ambulancia.svg'),
(3, 'Mossos d\'Esquadra 088', '088', 'Policia de Catalunya. Urgències i atenció ciutadana (24h).', 'EMERGENCIA', 3, 'policia.svg'),
(4, 'Sanitat Respon', '902 111 444', 'Informació i consells de salut (24h). No urgències mèdiques.', 'SALUD', 4, 'telefono-salud.svg'),
(5, 'Telèfon de l\'Esperança', '93 414 48 48', 'Suport emocional i prevenció del suïcidi (24h).', 'SOCIAL', 5, 'apoyo-emocional.svg'),
(6, 'Telèfon Gran', '900 10 00 99', 'Atenció i assessorament per a gent gran. Informació serveis socials.', 'SOCIAL', 6, 'personas-mayores.svg'),
(7, 'Creu Roja', '93 300 33 00', 'Assistència social, transport adaptat, teleassistència.', 'SOCIAL', 7, 'cruz-roja.svg'),
(8, 'Farmàcies de guàrdia', '931 811 212', 'Informació sobre farmàcies obertes (24h).', 'SALUD', 8, 'farmacia.svg'),
(9, 'Centre d\'Urgències CAP', '061', 'Consulta el teu Centre d\'Atenció Primària més proper.', 'SALUD', 9, 'centro-salud.svg'),
(10, 'Violència Masclista', '900 900 120', 'Atenció a dones en situació de violència masclista (24h).', 'SOCIAL', 10, 'ayuda.svg');

-- ============================================
-- 07. RANGOS_IMC_SENIORS
-- ============================================

CREATE TABLE IF NOT EXISTS rangos_imc_seniors (
  id INT NOT NULL AUTO_INCREMENT,
  edad_min INT NOT NULL,
  edad_max INT NOT NULL,
  sexo ENUM('M', 'F') NOT NULL,
  imc_min DECIMAL(5, 2) NOT NULL,
  imc_max DECIMAL(5, 2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  mensaje_ca TEXT NULL,
  color_hex VARCHAR(7) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rangos_imc ON rangos_imc_seniors (edad_min, edad_max, sexo);

-- Inserir rangs IMC (30 registres - homes i dones, 3 grups d'edat)
-- Reduït per tokens, inserta manualment des de fitxer original

-- ============================================
-- 08. FORMULAS_CALCULOS
-- ============================================

CREATE TABLE IF NOT EXISTS formulas_calculos (
  id INT NOT NULL AUTO_INCREMENT,
  tipo_calculo VARCHAR(50) NOT NULL,
  sexo ENUM('M', 'F', 'AMBOS') NULL,
  formula VARCHAR(500) NOT NULL,
  factor_edad_60_70 DECIMAL(5, 2) NULL,
  factor_edad_70_80 DECIMAL(5, 2) NULL,
  factor_edad_80_plus DECIMAL(5, 2) NULL,
  notas_ca TEXT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO formulas_calculos (id, tipo_calculo, sexo, formula, factor_edad_60_70, factor_edad_70_80, factor_edad_80_plus, notas_ca) VALUES 
(1, 'IMC', 'AMBOS', 'Pes (kg) / (Alçada (m))²', 1.00, 1.00, 1.00, 'Índex de Massa Corporal. Els rangs normals per a seniors són diferents dels adults joves.'),
(2, 'TMB', 'M', '66.5 + (13.75 × pes_kg) + (5.003 × alçada_cm) - (6.75 × edat)', 0.95, 0.90, 0.85, 'Taxa Metabòlica Basal per a homes. Calories que el cos necessita en repòs. S\'ajusta per edat.'),
(3, 'TMB', 'F', '655.1 + (9.563 × pes_kg) + (1.850 × alçada_cm) - (4.676 × edat)', 0.95, 0.90, 0.85, 'Taxa Metabòlica Basal per a dones. Calories que el cos necessita en repòs. S\'ajusta per edat.'),
(4, 'CALORIAS_DIARIAS', 'AMBOS', 'TMB × Factor_Activitat × Factor_Edat', 1.00, 0.95, 0.90, 'Calories totals diàries. Es calcula multiplicant la TMB pel factor d\'activitat física.'),
(5, 'ICC', 'AMBOS', 'Perímetre_Cintura (cm) / Perímetre_Maluc (cm)', 1.00, 1.00, 1.00, 'Índex Cintura-Maluc. Mesura la distribució de greix corporal. Important per avaluar risc cardiovascular.'),
(6, 'ICC_RIESGO', 'M', 'Risc alt si ICC > 0.95', 1.00, 1.00, 1.00, 'Per a homes, un ICC superior a 0.95 indica risc cardiovascular elevat.'),
(7, 'ICC_RIESGO', 'F', 'Risc alt si ICC > 0.85', 1.00, 1.00, 1.00, 'Per a dones, un ICC superior a 0.85 indica risc cardiovascular elevat.'),
(8, 'HIDRATACION', 'AMBOS', '30-35 ml × pes_kg', 0.95, 0.90, 0.85, 'Aigua diària recomanada. Per a seniors: 30-35 ml per kg de pes. Ajustat per edat per evitar sobrecàrrega renal.'),
(9, 'MASA_MUSCULAR', 'M', '(Pes × 1.10) - (Pes × (%Greix/100))', 0.90, 0.85, 0.80, 'Estimació de massa muscular per a homes. La pèrdua de massa muscular (sarcopènia) és important en seniors.'),
(10, 'MASA_MUSCULAR', 'F', '(Pes × 1.07) - (Pes × (%Greix/100))', 0.88, 0.83, 0.78, 'Estimació de massa muscular per a dones. Important per mantenir la mobilitat i independència.'),
(11, 'PROTEINA_DIARIA', 'AMBOS', '1.0-1.2 g × pes_kg', 1.00, 1.05, 1.10, 'Proteïna diària recomanada per a seniors. Més alta que en adults joves per prevenir sarcopènia.'),
(12, 'PRESION_ARTERIAL', 'AMBOS', 'Normal: <140/90 mmHg en seniors', 1.00, 1.00, 1.00, 'Per a seniors, una pressió arterial lleugerament més alta és acceptable. Objectiu: <140/90 mmHg.'),
(13, 'ICC', 'M', 'icc = perimetreCintura / perimetreCapdera', 1.00, 1.00, 1.00, 'Homes: ICC < 0.90 = Baix risc | ICC 0.90-1.0 = Risc moderat | ICC > 1.0 = Risc alt'),
(14, 'ICC', 'F', 'icc = perimetreCintura / perimetreCapdera', 1.00, 1.00, 1.00, 'Dones: ICC < 0.80 = Baix risc | ICC 0.80-0.85 = Risc moderat | ICC > 0.85 = Risc alt');

-- ============================================
-- 09. FACTORES_ACTIVIDAD
-- ============================================

CREATE TABLE IF NOT EXISTS factores_actividad (
  id INT NOT NULL AUTO_INCREMENT,
  nivel VARCHAR(50) NOT NULL,
  nombre_ca VARCHAR(100) NOT NULL,
  factor_tmb DECIMAL(3, 2) NOT NULL,
  descripcion_ca TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factores_nivel (nivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO factores_actividad (id, nivel, nombre_ca, factor_tmb, descripcion_ca) VALUES 
(5, 'MOLT_SEDENTARI', 'Molt sedentari', 1.15, 'Gairebé sempre assegut. Menys de 15 min d\'activitat al dia.'),
(6, 'SEDENTARI', 'Sedentari', 1.20, 'Principalment assegut. Passejos ocasionals curts de 15-30 min/dia.'),
(7, 'LLEUGERAMENT_ACTIU', 'Lleugerament actiu', 1.30, 'Passejos diaris de 30-45 min. Tasques domèstiques lleugeres.'),
(8, 'MODERADAMENT_ACTIU', 'Moderadament actiu', 1.40, 'Passejos diaris més de 45 min. Jardineria, neteja, compres caminant.'),
(9, 'ACTIU', 'Actiu', 1.50, 'Activitat física regular: natació, gimnàs suau, ioga 2-3 dies/setmana.'),
(10, 'MOLT_ACTIU', 'Molt actiu', 1.60, 'Exercici regular 4-5 dies/setmana: natació, gimnàs, tennis, esports.'),
(11, 'CONVALESCENT', 'Convalescent/Recuperació', 1.10, 'Recuperació d\'una malaltia o cirurgia. Activitat molt reduïda temporalment.');

-- ============================================
-- 10. CONFIG_APP
-- ============================================

CREATE TABLE IF NOT EXISTS config_app (
  id INT NOT NULL DEFAULT 1,
  ultima_actualizacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  version VARCHAR(10) NULL DEFAULT '1.0.0',
  dias_actualizacion INT NULL DEFAULT 30,
  idioma_defecto VARCHAR(5) NULL DEFAULT 'ca',
  modo_defecto VARCHAR(20) NULL DEFAULT 'oscuro',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO config_app (id, ultima_actualizacion, version, dias_actualizacion, idioma_defecto, modo_defecto) VALUES 
(1, '2026-02-05 09:41:22', '1.0.0', 30, 'ca', 'oscuro');
