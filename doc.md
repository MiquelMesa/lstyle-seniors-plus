# LSTYLE-SENIORS-PLUS — Documentació Tècnica i Pla d'Implementació

**Versió:** 2.8  
**Data:** 17 agost 2026  
**Estat actual:** Fases 0–3b ✅ · Català IEC · Plats mediterranis realistes · PDF KPIs amb significat · IA externa ajornada · Intro amb diapositives `VideoIntro/` (6 escenes) ✅

---

## 0. INVENTARI FASE 0 — 22/07/2026

### 0.1 Intent via API REST (publicat)

Connexió de **només lectura** a `https://michaelprojects.org/api/lstyle/*.php`:

| URL | HTTP | Conclusió |
|-----|------|-----------|
| `https://michaelprojects.org/` | 200 | Domini actiu |
| `https://michaelprojects.org/api/lstyle/` | 404 (ruta antiga) | API antiga no usada |
| `.../lstyle-seniors-plus/api/endpoints/` | ✅ PHP actiu (24/07/2026) | `prova.php` → `PHP_OK` |

### 0.2 Connexió directa MariaDB (túnel local) — ÈXIT

Data: **22/07/2026 ~21:30**  
Mètode: TCP `127.0.0.1:13306` (túnel SSH → VPS Hostinger)  
Usuari BD que ha funcionat: `lstyle_seniors_plus` (veure `Backend/config/database.php`)  
**Nota didàctica:** la cadena amb `User=root` i una altra contrasenya ha fallat (`Access denied`). Al VPS el root local no és el compte de l’aplicació.

#### Comptes reals a la BD

| Taula | Registres | Estat |
|-------|-----------|-------|
| `estaciones` | 4 | Complet |
| `categorias_alimentos` | 9 | Complet |
| `alimentos` | 129 | Complet |
| `condiciones_salud` | 12 | Complet |
| `consejos_condiciones` | **61** | Complet (sorpresa positiva: ja importat) |
| `telefonos_emergencia` | 10 | Complet |
| `rangos_imc_seniors` | **30** | Complet (ja importat) |
| `formulas_calculos` | 14 | Complet |
| `factores_actividad` | 7 | Complet |
| `config_app` | 1 | Complet |

**Total:** 10/10 taules presents · dades de referència **completes**.

#### `config_app` (valors reals)

| Camp | Valor actual | Estat |
|------|--------------|-------|
| `version` | `1.0.0` | OK |
| `dias_actualizacion` | **30** | ✅ Actualitzat 22/07/2026 (abans era 45) |
| `idioma_defecto` | `ca` | OK |
| `modo_defecto` | `oscuro` | OK |
| `ultima_actualizacion` | 2026-02-05 | Actualitzar quan es refresquin dades |

#### Esquema `alimentos` (bug endpoint corregit en local)

Columnes confirmades: `estacion_id int(11)` (una estació per aliment).  
**No existeix** `estaciones_disponibles` (JSON).  
→ Endpoint `Backend/endpoints/alimentos.php` **corregit** (22/07/2026): ara usa `AND estacion_id = ?`.  
⚠️ Cal **tornar a pujar** aquest fitxer al VPS quan es desplegui l’API.

### 0.3 Accions Fase 0

| # | Acció | Estat |
|---|-------|-------|
| 1 | Inventari BD via túnel | ✅ Fet |
| 2 | `dias_actualizacion = 30` a MariaDB | ✅ Fet |
| 3 | Corregir `alimentos.php` (`estacion_id`) | ✅ Fet (local; pendent desplegar) |
| 4 | Desplegar API PHP a `/public_html/api/lstyle/` | ⏳ Pendent (manual Hostinger) |
| 5 | Ampliar model (vegà, tipologies dieta, rangs PA…) | ⏳ Següent |
| 6 | Caché 30 dies a `utils/api-client.js` | ✅ Fet (24/07/2026) |

### 0.4 Neteja de carpetes (23/07/2026)

Carpetes renombrades: **`Backend/`** (API PHP) i **`BaseDeDades/`** (SQL MariaDB).

**Eliminat del projecte** (conservat a la còpia de seguretat de l’usuari):

- Duplicats PostgreSQL/Supabase i CSV a l’arrel de `BaseDeDades/`
- API alternativa `api/reference-data.php` i `config/db-config.php` (no usats pel frontend)
- `Backend/README.md`, `00_INSTRUCCIONS_IMPORT.md` (substituïts per `Backend/DESPLIEGUE.md` i `BaseDeDades/README.md`)

**Què pujar a la VPS:** només `Backend/config`, `Backend/middleware`, `Backend/endpoints`  
dins de `/var/www/michaelprojects/lstyle-seniors-plus/api/` → veure `Backend/DESPLIEGUE.md`.

**Correcció 24/07/2026:** `middleware/auth.php` compatible amb Nginx/PHP-FPM.

**Verificació API (24/07/2026) — ÈXIT:**
- Sense clau → HTTP 401 Unauthorized
- Amb X-API-Key → HTTP 200 + config_app (dias_actualizacion: 30)
- PDO + MariaDB OK
- Esborrar del VPS: `diag.php` i `prova.php` si encara hi són

---

## 1. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA)                           │
│  index.html  →  5 pantalles  →  css/  js/  config/  utils/      │
│  • Vanilla JS ES6+ (mòduls per arquitectura)                    │
│  • CSS Custom Properties (tema fosc, responsive)                │
│  • Lucide Icons + Animate.css (CDN)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS + API Key
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (PHP REST API)                     │
│  https://michaelprojects.org/api/lstyle/                        │
│  • 10 endpoints GET (estaciones, condiciones, alimentos...)     │
│  • Middleware: CORS, Auth (API Key), Rate Limit (100/min)       │
│  • PDO + Prepared Statements (MariaDB)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DADES (MariaDB)                      │
│  lstyle_seniors_plus @ Hostinger VPS                            │
│  10 taules: estaciones, categorias_alimentos, alimentos (129),  │
│  condiciones_salud (12), consejos_condiciones (61),             │
│  telefonos_emergencia (10), rangos_imc_seniors (30),            │
│  formulas_calculos (14), factores_actividad (7), config_app (1) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ESTAT ACTUAL PER COMPONENT

| Component | Fitxer | Estat | Línies | Queda per fer |
|-----------|--------|-------|--------|---------------|
| **HTML/SPA** | `index.html` | ✅ Complet | 892 | — |
| **Estils base** | `css/estils.css` | ✅ Complet | 623 | — |
| **Estils pantalles** | `css/pantalles.css` | ✅ Complet | — | — |
| **Estils formulari** | `css/formulari.css` | ✅ Complet | — | — |
| **App principal** | `js/app.js` | ✅ Complet | 554 | — |
| **API Config** | `config/api-config.js` | ✅ Complet | 48 | — |
| **API Client** | `utils/api-client.js` | ✅ Complet | ~280 | Caché 30 dies |
| **Seguretat** | `utils/seguretat.js` | ✅ Complet | — | — |
| **Formulari** | `js/formulari.js` | ✅ Complet | ~850 | Al·lèrgies + valors típics cintura/maluc |
| **Motor dieta** | `js/motor-dieta.js` | ✅ Complet | ~800 | Menú 14 dies (2 setmanes Dl–Dg) |
| **Resultats** | `js/resultats.js` | ✅ Complet | ~1300 | Calendari, PDF infografia, recomanacions |
| **Imatges general** | `img/general/` | ✅ Complet | 3 SVG | — |
| **Backend PHP** | `Backend/` | ✅ Complet | 10 endpoints | Pujar només config, middleware, endpoints |
| **Base de dades** | `BaseDeDades/MariaDB/` | ✅ Scripts | 4 fitxers SQL | No pujar al web; phpMyAdmin |

---

## 3. PLA DETALLAT FASE 2 — CÀLCULS I RESULTATS

### 3.1 FASE 2A — `formulari.js` ✅ COMPLET (24/07/2026)

**Objectiu:** Formulari completament funcional amb validacions, càrrega dinàmica, rangs i progress bar.

#### 3.1.1 Estructura del mòdul
```javascript
// js/formulari.js
const formulari = (() => {
    // Estat privat
    let dadesFormulari = {};
    let seccionsCompletades = new Set();
    
    // API pública
    return {
        inicialitzarFormulari,
        obtenirDades,
        netejarFormulari,
        validarSeccio
    };
})();
window.formulari = formulari;
```

#### 3.1.2 Funcionalitats a implementar

| Funció | Descripció | Complexitat |
|--------|------------|-------------|
| `inicialitzarFormulari()` | Carregar condicions/activitat de BD, attach events, init progress bar | Alta |
| `carregarCondicionsSalut()` | Renderitzar checkboxes dinàmiques des de `dadesApp.condicionsSalut` | Mitjana |
| `carregarActivitatFisica()` | Renderitzar radio buttons des de `dadesApp.factorsActivitat` | Mitjana |
| `validarCamp(camp)` | Validació temps real: required, min/max, patterns | Alta |
| `validarSeccio(seccio)` | Validar tots camps d'una secció, actualitzar progress bar | Alta |
| `calcularMitjaRang(min, max)` | `(min + max) / 2` si hi ha dos valors, sino el valor únic | Baixa |
| `actualitzarProgressBar()` | Comptar seccions vàlides (6 total), animar segments | Mitjana |
| `recollirDadesFormulari()` | Recollir tots camps → objecte net per càlculs | Alta |
| `netejarFormulari()` | Reset camps, progress bar, errors (amb modal confirmació) | Mitjana |
| `mostrarError(camp, missatge)` / `netejarError(camp)` | UI errors inline | Baixa |

#### 3.1.3 Validacions per camp

| Camp | Tipus | Validacions |
|------|-------|-------------|
| `nom` | text | required, 2-100 chars, solo letras/espacios |
| `sexe` | select | required, M/F |
| `edat` | number | required, 60-120 |
| `alcada-min/max` | number | required (min), 100-250, step 0.1, max ≥ min |
| `pes-min/max` | number | required (min), 30-300, step 0.1, max ≥ min |
| `cintura-min/max` | number | opcional, 40-200 |
| `maluc-min/max` | number | opcional, 40-200 |
| `pressio-max` | number | opcional, 60-250 |
| `pressio-min` | number | opcional, 40-150 |
| `frequencia` | number | opcional, 40-200 |
| `condicions` | checkbox[] | cap obligatori |
| `activitat` | radio | **required**, un de 7 valors |
| `fumador` | radio | required, si/no |
| `dieta` | radio | required, 4 valors |
| `alcohol` | radio | required, 3 valors |
| `son` | radio | required, 3 valors |
| `intolerancies` | checkbox[] | cap obligatori |

#### 3.1.4 Dades que s'han de passar a resultats.js
```javascript
{
    // Personals
    nom: string,
    sexe: 'M' | 'F',
    edat: number,
    
    // Físiques (mitjanes de rangs)
    alcada: number,        // cm
    pes: number,           // kg
    cintura: number|null,  // cm
    maluc: number|null,    // cm
    
    // Pressió
    pressioMax: number|null,
    pressioMin: number|null,
    frequencia: number|null,
    
    // Condicions (array IDs)
    condicions: number[],
    
    // Activitat
    activitatId: number,   // 1-7
    factorActivitat: number, // de BD (1.10-1.60)
    
    // Hábits
    fumador: boolean,
    dieta: 'omnivora'|'flexitariana'|'vegetariana'|'vegana',
    alcohol: 'no'|'ocasional'|'habitual',
    son: 'menys6'|'6a8'|'mes8',
    intolerancies: string[] // 'lactosa','gluten','fruits-secs'
}
```

---

### 3.2 FASE 2B — `resultats.js` ✅ COMPLET (24/07/2026)

**Objectiu:** Implementar totes les fórmules seniors, interpretació, UI resultats i export PDF.

#### 3.2.1 Fórmules a implementar (des de BD `formulas_calculos`)

| Indicador | Fórmula | Font | Específics Seniors |
|-----------|---------|------|-------------------|
| **IMC** | `pes / (alcada/100)²` | BD rangos_imc_seniors (30 rangs) | Rangos distintos a adultos jóvenes |
| **TMB Homes** | `66.5 + 13.75×pes + 5.003×alcada - 6.75×edat` | Harris-Benedict | Factor edat: 0.95 (60-70), 0.90 (70-80), 0.85 (80+) |
| **TMB Dones** | `655.1 + 9.563×pes + 1.850×alcada - 4.676×edat` | Harris-Benedict | MATEIX factor edat |
| **TDEE** | `TMB × factorActivitat × factorEdat` | BD factores_activitat | Factor activitat 1.10-1.60 |
| **ICC** | `cintura / maluc` | — | Home >0.95 risc, Dona >0.85 risc |
| **Hidratació** | `30-35 ml × pes` | — | Ajustar edat (renal) |
| **Proteïna** | `1.0-1.2 g × pes` | ESPEN seniors | Més si activitat/sarcopènia |

#### 3.2.2 Interpretació IMC Seniors (exemple rangs BD)

| IMC | Categoria Senior | Acció |
|-----|------------------|-------|
| < 22 | Sota pes | Augmentar calories/proteïna |
| 22-27 | Pes saludable | Mantenir |
| 27-30 | Sobrepès | Reduir lleugerament |
| 30-35 | Obesitat I | Reduir moderadament |
| 35-40 | Obesitat II | Supervisió mèdica |
| > 40 | Obesitat III | Tractament especialitzat |

*Nota: Rangos exactes veen de BD `rangos_imc_seniors` (30 registres per edat/sexe)*

#### 3.2.3 UI Resultats a renderitzar

1. **Targetes principals (6):** IMC, TMB, TDEE, ICC, Hidratació, Proteïna
2. **Cada targeta:** Valor gran + interpretació + detall + color semàfor (verd/groc/vermell)
3. **Menú 2 setmanes:** Estructura 14 dies (Dl–Dg) × 5 àpats (motor local Fase 3)
4. **Botons:** "Nou Càlcul" (formulari en blanc), "Exportar PDF" (infografia landscape)

#### 3.2.4 Exportar PDF (jsPDF + autoTable)

```javascript
// CDN: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// CDN: https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js

function exportarPDF(dades, resultats) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // 1. Capçalera app + data + usuari
    // 2. Taula dades entrades
    // 3. Taula resultats (IMC, TMB, TDEE, ICC, Hidratació)
    // 4. Interpretacions + recomanacions
    // 5. Menú setmanal (si existeix)
    // 6. Disclaimer legal peu
    doc.save(`LSTYLE-Resultats-${dades.nom}-${Date.now()}.pdf`);
}
```

---

## 4. FASE 3 — MOTOR DE DIETA LOCAL ✅ COMPLET (24–27/07/2026)

**Decisió:** Motor local sense IA externa (ajornada la integració Gemini per falta d'API gratuïta estable).

### 4.1 `js/motor-dieta.js`

| Funció | Descripció |
|--------|------------|
| `generarMenuSetmanal(dades, resultats, dadesApp)` | **14 dies** × 5 àpats (2 setmanes Dl–Dg, inici en dilluns) |
| `esAlimentPermes()` | Dieta, condicions, al·lèrgies, intoleràncies |
| `coincideixAlergiaPersonalitzada()` | Exclou aliments per text lliure (maduixes, carbassó…) |
| Plantilles mediterrànies | Esmorzar / mig matí / dinar / berenar / sopar amb descripció de plat |
| `generarLlistaCompra()` | Un ítem per aliment + grams totals (deduplicat per nom) |

**Filtres aplicats:**
- Dieta: omnívora / flexitariana / vegetariana / vegana
- Condicions: `evitar_diabetes`, `evitar_hipertension`, `evitar_colesterol`
- Al·lèrgies (checkboxes): ou, peix, marisc, làctics, fruits secs, soja, cacauet, sèsam
- Al·lèrgies personalitzades: camp de text separat per comes
- Intoleràncies: lactosa, gluten, fruits secs
- Estació: prioritza `estacion_id` actual
- **Sense repeticions el mateix dia** (ni el mateix aliment ni la mateixa categoria de proteïna dinar/sopar)

**Distribució calòrica (Dieta del Plat):** Esmorzar 25% · Mig matí 10% · Dinar 35% · Berenar 10% · Sopar 20%

**UI integrada a `resultats.js`:**
- Calendari de 2 setmanes (14 columnes × 5 files d'àpat)
- Descripció de plat mediterrani per cel·la
- Llista de la compra unificada (un producte = suma de grams)
- Botó «Nou menú» (regenerar)
- Recomanacions en **2 columnes** agrupades per tema
- «Nou càlcul» → formulari **en blanc**
- PDF **horizontal** tipus infografia (KPIs + calendari Dia/Àpat + compra)

### 4.2 IA externa (ajornada)

La integració amb Gemini/Groq queda documentada com a opció futura si es disposa d'API key.

---

## 5. PLA FASE 3 ORIGINAL — IA (REFERÈNCIA, NO IMPLEMENTAT)

### 4.1 Proveïdor IA Recomanat: **Google Gemini 1.5 Flash (GRATUÏT)**

| Proveïdor | Límit Gratuït | JSON Mode | Multilingüe | Latència |
|-----------|---------------|-----------|-------------|----------|
| **Gemini 1.5 Flash** | **1.500 req/dia, 1M tokens/min** | ✅ Sí | ✅ Català | Ràpid |
| Groq (Llama 3) | 14.400 req/dia | ✅ Sí | ✅ Català | Molt ràpid |
| OpenAI GPT-4o-mini | No gratuït (crèdits) | ✅ Sí | ✅ Català | Ràpid |

**Decisió:** Gemini 1.5 Flash — més generós, JSON mode natiu, suport català excel·lent.

### 4.2 Prompt Dinàmic (construït a `resultats.js`)

```javascript
function construirPromptDieta(dadesUsuari, resultats, estacioActual, alimentsTemporada) {
    return `
Ets un nutricionista especialitzat en gent gran (+60 anys). Genera una DIETA QUINZENAL (14 dies) 
completament personalitzada en format JSON ESTRICTE.

=== PERFIL USUARI ===
Nom: ${dadesUsuari.nom}
Sexe: ${dadesUsuari.sexe === 'M' ? 'Home' : 'Dona'}
Edat: ${dadesUsuari.edat} anys
Alçada: ${dadesUsuari.alcada} cm
Pes: ${dadesUsuari.pes} kg
IMC: ${resultats.imc.toFixed(1)} (${resultats.imcCategoria})
TMB: ${resultats.tmb.toFixed(0)} kcal/dia
TDEE: ${resultats.tdee.toFixed(0)} kcal/dia
ICC: ${resultats.icc?.toFixed(2) || 'N/A'} (${resultats.iccInterpretacio})
Hidratació: ${resultats.hidratacio} ml/dia

=== CONDICIONS DE SALUT ===
${dadesUsuari.condicions.map(c => `- ${c}`).join('\n') || 'Cap'}

=== HÀBITS ===
Dieta: ${dadesUsuari.dieta}
Activitat: ${dadesUsuari.activitatLabel} (factor ${dadesUsuari.factorActivitat})
Fumador: ${dadesUsuari.fumador ? 'Sí' : 'No'}
Alcohol: ${dadesUsuari.alcohol}
Son: ${dadesUsuari.son}
Intoleràncies: ${dadesUsuari.intolerancies.join(', ') || 'Cap'}

=== ESTACIÓ ACTUAL ===
${estacioActual.nom} — Aliments de temporada disponibles:
${alimentsTemporada.map(a => `- ${a.nom} (${a.categoria})`).join('\n')}

=== REQUISITS OBLIGATORIS ===
1. Dieta del Plat (Harvard): 50% verdures/frutes, 25% proteïnes, 25% cereals integrals
2. Dieta Mediterrània: Oli oliva, peix Blau 2-3/setmana, llegums 3-4/setmana
3. 5 àpats/dia: Esmorzar, Mig-matinar, Dinar, Berenar, Sopar
4. Calories diàries objectiu: ${resultats.tdee} kcal (distribuir: 25/10/35/10/20%)
5. Proteïna: ${resultats.proteina} g/dia mínim
6. Aigua: ${resultats.hidratacio} ml/dia (incloure a cada àpat)
7. Adaptar a CADA condició: 
   - Hipertensió: <2g sodi/dia, potentiació potassi
   - Diabetis: IG baix, repartir HC, evitar sucres afegits
   - Colesterol: Fibra soluble, omega-3, limitar greixos saturats
   - Osteoporosi: Calci 1200mg, Vit D, proteïna adequada
   - Vegana/Vegetariana: B12, ferro, omega-3 vegetal, proteïnes completes
8. Varietat: MÍNIM 14 aliments diferents/dia, sense repetir plats principals
9. Estacionalitat: Prioritzar aliments de ${estacioActual.nom.toLowerCase()}

=== FORMAT JSON DE RESPOSTA (ESTRICTE) ===
{
  "menuQuinzena": [
    {
      "dia": 1,
      "data": "2026-07-22",
      "esmorzar": {"plats": [...], "calories": 0, "proteina": 0, "aigua_ml": 200},
      "migMatinar": {"plats": [...], "calories": 0, "proteina": 0, "aigua_ml": 150},
      "dinar": {"plats": [...], "calories": 0, "proteina": 0, "aigua_ml": 250},
      "berenar": {"plats": [...], "calories": 0, "proteina": 0, "aigua_ml": 150},
      "sopar": {"plats": [...], "calories": 0, "proteina": 0, "aigua_ml": 200},
      "totals": {"calories": 0, "proteina": 0, "hc": 0, "greixos": 0, "fibra": 0, "sodi": 0, "aigua_ml": 0}
    },
    ... 14 dies
  ],
  "resumSetmanal": {...},
  "llistaCompra": [...],
  "recomanacions": [...]
}
`;
}
```

### 4.3 Integració a `resultats.js`

```javascript
async function generarDietaAmbIA(dadesUsuari, resultats) {
    const prompt = construirPromptDieta(dadesUsuari, resultats, estacioActual, alimentsTemporada);
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.3,
                    maxOutputTokens: 8192
                }
            })
        }
    );
    
    const data = await response.json();
    const jsonText = data.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText);
}
```

---

## 5. SEGURETAT I PRIVACITAT (REVISIÓ)

| Mesura | Implementació Actual | Pendent |
|--------|---------------------|---------|
| **Dades al navegador** | `localStorage`/`sessionStorage` (xifrat AES-256-GCM) | ✅ |
| **API Key frontend** | `api-config.js` (públic) | ⚠️ Moure a backend proxy |
| **CSP** | `utils/seguretat.js` | ✅ |
| **Sanitització** | `utils/seguretat.sanitizeHTML()` | ✅ |
| **Rate limit API** | 100 req/min per IP (middleware) | ✅ |
| **CORS** | Domains permitits a `cors.php` | ✅ Verificar `michaelprojects.org` |
| **HTTPS** | Hostinger SSL | ✅ |
| **SQL Injection** | Prepared Statements (PDO) | ✅ |
| **Gemini API Key** | **NO posar al frontend** — Crear endpoint proxy PHP | 🔴 CRÍTIC |

**Acció crítica:** Crear endpoint `/api/lstyle/gemini-proxy.php` que rebi el prompt, cridi a Gemini amb API Key del servidor, retorni resposta. Així la key **MAI** toca el frontend.

---

## 6. DESPLEGAMENT A HOSTINGER

### 6.1 Estructura fitxers a `/public_html/api/lstyle/`

```
/public_html/api/lstyle/
├── config/
│   └── database.php          (credencials BD)
├── middleware/
│   ├── cors.php
│   ├── auth.php
│   └── rate-limit.php
├── endpoints/
│   ├── estaciones.php
│   ├── condiciones.php
│   ├── actividad.php
│   ├── categorias.php
│   ├── alimentos.php
│   ├── consejos.php
│   ├── telefonos.php
│   ├── rangos-imc.php
│   ├── formulas.php
│   ├── config.php
│   └── gemini-proxy.php      (NOU - Fase 3)
├── .htaccess                 (CORS, seguretat)
└── index.php                 (opcional - health check)
```

### 6.2 Base de Dades - Importar scripts

Ordre d'importació (respeクト FK):
```bash
# 1. Taules sense FK
estaciones.sql → categorias_alimentos.sql → condiciones_salud.sql → 
factores_actividad.sql → formulas_calculos.sql → rangos_imc_seniors.sql → 
config_app.sql → telefonos_emergencia.sql

# 2. Taules amb FK
alimentos.sql (FK categoria_id, estaciones_disponibles JSON)
consejos_condiciones.sql (FK condicion_id)

# 3. Dades (INSERTs)
*_rows.sql en mateix ordre
```

---

## 7. CHECKLIST FASE 2A — FORMULARI.JS ✅

- [x] Crear estructura mòdul `formulari` (IIFE pattern)
- [x] `inicialitzarFormulari()`: attach events, carregar condicions/activitat BD
- [x] `carregarCondicionsSalut()`: renderitzar checkboxes grid 3 columnes
- [x] `carregarActivitatFisica()`: renderitzar radio cards amb factor TMB visible
- [x] Validació temps real: `input`/`change` events per cada camp
- [x] `validarSeccio(seccio)`: retornar boolean, actualitzar progress bar
- [x] `calcularMitjaRang(minId, maxId)`: helper reutilitzable
- [x] `actualitzarProgressBar()`: 6 segments, colors accent, animació
- [x] `recollirDadesFormulari()`: objecte net per `resultats.js`
- [x] `netejarFormulari()`: modal confirmació + reset complet
- [x] Tooltips: delegació events (ja fet a `app.js` global)
- [x] Accessibilitat: `aria-invalid`, `aria-describedby` errors
- [ ] Test manual en producció: omplir tot, verificar dades recollides correctes

---

## 7. CHECKLIST FASE 2B — RESULTATS.JS ✅

- [x] `calcularIMC()`, `calcularTMB()`, `calcularTDEE()`, `calcularICC()`, `calcularHidratacio()`, `calcularProteina()`
- [x] Interpretació IMC des de `rangos_imc_seniors` (amb fallback local)
- [x] Factors d'edat des de `formulas_calculos` (TMB, hidratació, proteïna)
- [x] `mostrarResultats(dades)` — integració amb `formulari.js`
- [x] UI: 6 targetes (IMC, TMB, TDEE, ICC, Hidratació, Proteïna) amb semàfor de colors
- [x] Recomanacions personalitzades (consells BD + hàbits + pressió)
- [x] Recomanacions en 2 columnes agrupades per tema (27/07/2026)
- [x] Menú quinzenal calendari (Fase 3)
- [x] Exportar PDF infografia landscape (jsPDF + autoTable)
- [x] Botó «Nou Càlcul» → formulari en blanc + torna a l'entrada
- [x] `construirPromptDieta()` preparat per IA futura (ajornada)
- [ ] Test manual en producció: flux complet formulari → resultats → PDF

---

## 7b. CHECKLIST FASE 3 — MOTOR DIETA LOCAL ✅

- [x] `js/motor-dieta.js` — generador **14×5** àpats sense IA
- [x] Filtres: dieta, condicions, al·lèrgies, intoleràncies, estació
- [x] Plantilles mediterrànies / Dieta del Plat (Harvard)
- [x] Sense repeticions d'aliment ni proteïna el mateix dia
- [x] Llista de compra deduplicada (1 producte + grams totals)
- [x] Dieta del Plat: distribució 25/10/35/10/20% kcal
- [x] UI calendari quinzenal + botó «Nou menú»
- [x] PDF horizontal amb capçaleres Dia/Àpat + compra
- [x] `index.html` carrega `motor-dieta.js`
- [ ] Test manual: omnívora, vegetariana, diabetis + lactosa + al·lèrgia personalitzada

---

## 8. PROPER PAS I HISTÒRIC DE CANVIS

**Proper pas:** provar flux complet al VPS amb els fitxers actualitzats.

### Fase 3b — Millores UX i menú (27/07/2026) ✅

| # | Canvi | Fitxers |
|---|-------|---------|
| 1 | Valors típics cintura (OMS) i maluc al formulari | `index.html`, `css/formulari.css` |
| 2 | Al·lèrgies checkboxes + camp «Altres» (text lliure) | `index.html`, `formulari.js`, `motor-dieta.js` |
| 3 | Pla de **14 dies** (2 setmanes Dl–Dg) + calendari visual | `motor-dieta.js`, `resultats.js`, `pantalles.css` |
| 4 | Plantilles mediterrànies amb descripció de plat | `motor-dieta.js` |
| 5 | PDF landscape tipus infografia (KPIs + Dia/Àpat + compra) | `resultats.js` |
| 6 | Sense peix al dinar i peix al sopar (ni aliments repetits el mateix dia) | `motor-dieta.js` |
| 7 | Llista de compra: un ítem per aliment + grams sumats | `motor-dieta.js` |
| 8 | «Nou càlcul» buida el formulari | `resultats.js`, `formulari.js` |
| 9 | Recomanacions en 2 columnes per tema | `resultats.js`, `pantalles.css` |
| 10 | Seccions que es coloregen en omplir dades + hàbits en fitxes | `formulari.js`, `index.html`, `pantalles.css`, `formulari.css` |
| 11 | Recomanacions per patologia → tipus (alimentació, estil de vida…) | `resultats.js` |
| 12 | Llista compra 2 columnes ordenada (peix, carn, llegums…) | `motor-dieta.js`, `resultats.js`, `pantalles.css` |
| 13 | PDF menús per setmanes Dilluns–Diumenge | `resultats.js` |
| 14 | PDF infografia visual (fons fosc, 14 dies, compra amb checkboxes) | `resultats.js`, `motor-dieta.js` |
| 15 | **Bloc A+B (29/07):** Seguretat exportada, telèfons UI, disclaimer sense IA, «Nou menú» aleatori, restaurar sessió, textos 14 dies | `seguretat.js`, `resultats.js`, `formulari.js`, `app.js`, `motor-dieta.js`, `index.html`, `pantalles.css` |
| 16 | Telèfons d'emergència també al PDF (pàgina infografia) | `resultats.js` |
| 17 | Català IEC (BD) + plats mediterranis realistes + PDF KPIs amb significat | `03_alimentos.sql`, `05_correccio_catala.sql`, `motor-dieta.js`, `resultats.js` |

### Fase 3c — Intro amb diapositives `VideoIntro/` (17/08/2026) ✅

| # | Canvi | Fitxers |
|---|-------|---------|
| 1 | Substituir el vídeo/imatge introductòria (URLs externes FAL) per diapositives locals de `VideoIntro/` | `index.html` |
| 2 | Carregar les 5 escenes existents des de `VideoIntro/01–05 slide.png` (rutes relatives, sense dependències externes) | `index.html` |
| 3 | **Escena 6 (nova):** `VideoIntro/06 slide.png` — «Connecta amb els teus» · «La tecnologia t'apropa als que més estimes» (videotrucada familiar) | `index.html` |
| 4 | Descripcions adaptades al contingut real de cada imatge (caminar, cuinar, ioga, aprendre, metge, família) | `index.html` |
| 5 | Indicador de progrés núm. 6 afegit al HTML | `index.html` |
| 6 | `NUM_ESCENES` actualitzat de 5 a 6 | `js/video-bienvenida.js` |
| 7 | Nova carpeta `VideoIntro/` (6 PNG + PDF de referència) — **cal pujar-la sencera al desplegament** | `VideoIntro/` |

### Checklist desplegament VPS (Bloc A)

| # | Acció | Estat |
|---|--------|--------|
| A1 | Pujar frontend: `index.html`, `js/*`, `css/*`, `utils/seguretat.js`, `img/general/` | ⏳ Manual |
| A2 | API viva: sense clau → 401; frontend → 200 (verificat 29/07) | ✅ |
| A3 | Esborrar `diag.php` / `prova.php` del VPS si encara hi són | ⏳ Manual |
| A4–A6 | Prova manual producció: formulari → resultats → menú → PDF + casos dieta | ⏳ Després de pujar |

### Resum de fases

| Fase | Contingut | Estat |
|------|-----------|-------|
| **0** | Inventari BD + `dias_actualizacion=30` + fix `alimentos.php` | ✅ |
| **1** | SPA HTML/CSS + API client + seguretat | ✅ |
| **2A** | `formulari.js` (validació, rangs, progress) | ✅ |
| **2B** | `resultats.js` (IMC, TMB, TDEE, ICC, PDF) | ✅ |
| **3** | Motor dieta local 14 dies + calendari | ✅ |
| **3b** | Al·lèrgies, plantilles, PDF infografia, UX | ✅ 27/07 |
| **3c** | Intro amb diapositives `VideoIntro/` (6 escenes) | ✅ 17/08 |
| **A+B** | Desplegament/proves + polish (Seguretat, telèfons, sessió, seed) | ✅ codi 29/07 · ⏳ pujar VPS |
| **Futur** | IA externa (Gemini/Groq), PWA, seguretat D | ⏳ Ajornat |

### Imatges `img/general/` ✅ (24/07/2026)

| Fitxer | Ús |
|--------|-----|
| `favicon.svg` | Icona del navegador (pestanya) |
| `envejecer-saludablemente.svg` | Il·lustració disclaimer (seniors actius + plat saludable) |
| `loading-data.svg` | Animació càrrega API (servidor + núvol, SVG animat) |

Estil: tema fosc, accents cian (#00c8e8) i verd (#00e676), coherents amb l'app.

### Caché 30 dies (`utils/api-client.js`) ✅

| Comportament | Detall |
|--------------|--------|
| Emmagatzematge | `localStorage` clau `lstyle_api_cache_v1` |
| Validesa | `config_app.dias_actualizacion` (30 dies per defecte) |
| Flux | Caché vàlida → sense peticions API; caducada → descarrega i actualitza |
| Reserva | Si l'API falla, usa caché caducada abans d'error |
| API pública | `ApiClient.esborrarCache()`, `ApiClient.obtenirInfoCache()` |
| Forçar recàrrega | `ApiClient.carregarDadesInicials({ forcarRecarrega: true })` |

### Com provar la caché (consola del navegador)

```javascript
// Veure estat de la caché
ApiClient.obtenirInfoCache()

// Forçar nova descàrrega de l'API
ApiClient.carregarDadesInicials({ forcarRecarrega: true })

// Esborrar caché
ApiClient.esborrarCache()
```

### Com provar la Fase 3 (actualitzat 29/07/2026)

1. Omplir formulari (provar al·lèrgies + «Altres»: maduixes, carbassó)
2. «Calcular i veure resultats» → calendari de **14 dies** (2 setmanes)
3. Comprovar: sense peix al dinar i al sopar el mateix dia; llista de compra sense duplicats
4. Recomanacions en 2 columnes; telèfons d'emergència visibles
5. «Nou menú» → plats diferents; Exportar PDF infografia
6. Recarregar la pàgina → ha de restaurar la sessió de resultats
7. «Nou càlcul» → formulari en blanc
8. Pujar al VPS:
   `index.html`, `js/app.js`, `js/formulari.js`, `js/resultats.js`, `js/motor-dieta.js`,
   `utils/seguretat.js`, `css/pantalles.css`, `css/formulari.css`, `img/general/`

---

*Documentació viva — S'actualitza a cada fase o millora completada.*

