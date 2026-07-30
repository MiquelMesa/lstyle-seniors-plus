-- ============================================
-- Script de verificació de la importació
-- Executar a phpMyAdmin després d'importar
-- ============================================

-- Mostrar totes les taules
SHOW TABLES;

-- Comptar registres de cada taula
SELECT 'estaciones' AS taula, COUNT(*) AS registres FROM estaciones
UNION ALL
SELECT 'categorias_alimentos', COUNT(*) FROM categorias_alimentos
UNION ALL
SELECT 'alimentos', COUNT(*) FROM alimentos
UNION ALL
SELECT 'condiciones_salud', COUNT(*) FROM condiciones_salud
UNION ALL
SELECT 'consejos_condiciones', COUNT(*) FROM consejos_condiciones
UNION ALL
SELECT 'telefonos_emergencia', COUNT(*) FROM telefonos_emergencia
UNION ALL
SELECT 'rangos_imc_seniors', COUNT(*) FROM rangos_imc_seniors
UNION ALL
SELECT 'formulas_calculos', COUNT(*) FROM formulas_calculos
UNION ALL
SELECT 'factores_actividad', COUNT(*) FROM factores_actividad
UNION ALL
SELECT 'config_app', COUNT(*) FROM config_app;

-- Test: Seleccionar un registre de cada taula
SELECT * FROM estaciones LIMIT 1;
SELECT * FROM categorias_alimentos LIMIT 1;
SELECT * FROM alimentos LIMIT 1;
SELECT * FROM condiciones_salud LIMIT 1;
SELECT * FROM consejos_condiciones LIMIT 1;
SELECT * FROM telefonos_emergencia LIMIT 1;
SELECT * FROM rangos_imc_seniors LIMIT 1;
SELECT * FROM formulas_calculos LIMIT 1;
SELECT * FROM factores_actividad LIMIT 1;
SELECT * FROM config_app LIMIT 1;
