-- ============================================
-- Correccions de català (Catalunya / IEC)
-- Executar a phpMyAdmin o MariaDB després del desplegament
-- Data: 29/07/2026
-- ============================================

-- Fruites: termes valencians o impropis → català estàndard
UPDATE alimentos SET nombre_ca = 'Nectarina' WHERE id = 39 AND nombre_ca = 'Bresquilla';
UPDATE alimentos SET nombre_ca = 'Aranja' WHERE id = 53 AND nombre_ca = 'Pomelo';

-- Verdures: denominació habitual a Catalunya
UPDATE alimentos SET nombre_ca = 'Mongeta verda' WHERE id = 66 AND nombre_ca = 'Mongeta tendra';

-- Condicions de salut: terminologia clínica en català
UPDATE condiciones_salud SET nombre_ca = 'Glicèmia elevada (prediabetis)' WHERE id = 2 AND codigo = 'AZUCAR';

-- Nota: «Clara d'ou» es manté a la BD per dades nutricionals,
-- però el motor de dieta l'exclou (no és un plat habitual per a seniors).
