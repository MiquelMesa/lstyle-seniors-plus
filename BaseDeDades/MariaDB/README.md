# 📦 Scripts SQL adaptats per MariaDB

Aquesta carpeta conté **tots els scripts SQL** adaptats de PostgreSQL (Supabase) a **MariaDB** (Hostinger).

---

## 📋 Ordre d'importació

**IMPORTANT:** Importar en aquest ordre per respectar les claus forànies (FOREIGN KEY):

```
1. ✅ 01_estaciones.sql
2. ✅ 02_categorias_alimentos.sql
3. ✅ 03_alimentos.sql            (depèn de 1 i 2)
4. ✅ 04_a_10_taules_restants.sql (inclou taules 4 a 10)
```

---

## 🔧 Canvis realitzats PostgreSQL → MariaDB (CORREGIT)

| PostgreSQL | MariaDB |
|------------|---------|
| `serial` | `INT AUTO_INCREMENT` |
| `bigint` | `INT` (per IDs i FK) |
| `boolean` | `TINYINT(1)` (1=true, 0=false) |
| `text` | `VARCHAR(X)` o `TEXT` |
| `numeric(X,Y)` | `DECIMAL(X,Y)` |
| `TABLESPACE pg_default` | **Eliminat** |
| `constraint X check (...)` | `ENUM(...)` o eliminat |
| `UNIQUE` inline | `UNIQUE KEY uk_nom (columna)` |
| Índexs `using btree` | Inclosos a CREATE TABLE |
| FOREIGN KEY sense nom | `CONSTRAINT fk_nom FOREIGN KEY ...` |

---

## 📂 Fitxers creats

### 01_estaciones.sql
- **Taula:** `estaciones` (4 registres)
- **Dades:** Primavera, Estiu, Tardor, Hivern
- **Dependencies:** Cap

### 02_categorias_alimentos.sql
- **Taula:** `categorias_alimentos` (9 registres)
- **Dades:** Carns, Peixos, Fruites, Verdures, Làctics, etc.
- **Dependencies:** Cap

### 03_alimentos.sql
- **Taula:** `alimentos` (129 registres)
- **Dades:** Tots els aliments amb valors nutricionals
- **Dependencies:** 
  - `FOREIGN KEY (categoria_id)` → categorias_alimentos
  - `FOREIGN KEY (estacion_id)` → estaciones

### 04_a_10_taules_restants.sql
Conté **7 taules**:

4. **condiciones_salud** (12 condicions)
5. **consejos_condiciones** (61 consells) ⚠️ **NOTA:** Només estructura creada, dades cal insertar manualment
6. **telefonos_emergencia** (10 telèfons)
7. **rangos_imc_seniors** (30 rangs) ⚠️ **NOTA:** Només estructura, dades cal insertar manualment
8. **formulas_calculos** (14 fórmules)
9. **factores_actividad** (7 factors)
10. **config_app** (1 registre)

---

## ⚠️ Taules amb dades incompletes

Per estalviar espai, les següents taules només tenen l'**estructura CREATE TABLE** i cal **insertar les dades manualment** dels fitxers originals:

- **consejos_condiciones** → 61 registres (restaurar des del backup si cal)
- **rangos_imc_seniors** → 30 registres (restaurar des del backup si cal)

### Com insertar-les:

1. Obrir la teva **còpia de seguretat** o restaurar des de phpMyAdmin les dades de `consejos_condiciones` i `rangos_imc_seniors` si després de `verificar_importacio.sql` surten 0 files.

---

## 🚀 Importació a Hostinger

### Via phpMyAdmin

1. Accedir a phpMyAdmin de Hostinger
2. Seleccionar BD `lstyle_seniors_plus`
3. Anar a **Importar**
4. Pujar fitxers **EN ORDRE**:
   - `01_estaciones.sql`
   - `02_categorias_alimentos.sql`
   - `03_alimentos.sql`
   - `04_a_10_taules_restants.sql`
5. Executar cada fitxer (clicar **Continuar**)
6. **Completar dades** (només si cal): restaurar `consejos_condiciones` i `rangos_imc_seniors` des de la còpia de seguretat.

### Verificar importació

```sql
-- Mostrar totes les taules
SHOW TABLES;

-- Comptar registres
SELECT 'estaciones' AS taula, COUNT(*) AS total FROM estaciones
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
```

**Totals esperats:**
- `estaciones`: 4
- `categorias_alimentos`: 9
- `alimentos`: 129
- `condiciones_salud`: 12
- `consejos_condiciones`: 61
- `telefonos_emergencia`: 10
- `rangos_imc_seniors`: 30
- `formulas_calculos`: 14
- `factores_actividad`: 7
- `config_app`: 1

---

## 📝 Notes addicionals

- **Charset:** utf8mb4 (suporta emojis i caràcters especials catalans)
- **Collation:** utf8mb4_unicode_ci (ordenació correcta de català)
- **Motor:** InnoDB (suporta FOREIGN KEY i transaccions)
- **FOREIGN KEY:** Activades per mantenir integritat referencial

---

**Creat per:** Oz (AI Agent)  
**Data:** 17 març 2026  
**Projecte:** LSTYLE-SENIORS-PLUS
