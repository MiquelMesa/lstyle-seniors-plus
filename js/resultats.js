/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Mòdul de càlculs i visualització de resultats
 * ============================================
 *
 * QUÈ FA AQUEST FITXER?
 * - Calcula IMC, TMB, TDEE, ICC, hidratació i proteïna (fórmules seniors)
 * - Interpreta els valors amb rangs de la BD (rangos_imc_seniors, formulas_calculos)
 * - Renderitza la pantalla de resultats i recomanacions personalitzades
 * - Exporta un PDF amb jsPDF
 * - Prepara dades per al motor de dieta (Fase 3)
 *
 * PATRÓ: IIFE — exposa window.resultats per a formulari.js i app.js
 */

'use strict';

const resultats = (() => {

    // ============================================
    // ESTAT PRIVAT
    // ============================================

    /** Dades de l'usuari de l'últim càlcul */
    let dadesUsuari = null;

    /** Resultats numèrics i interpretacions de l'últim càlcul */
    let resultatsCalcul = null;

    /** Menú de 2 setmanes generat pel motor local */
    let menuDieta = null;

    /** Offset de seed per regenerar menús diferents */
    let menuSeedOffset = 0;

    /** Evita registrar esdeveniments duplicats */
    let jaInicialitzat = false;

    /** Accés a dades globals de l'API (carregades per app.js) */
    const obtenirDadesApp = () => (window.app && window.app.dadesApp) ? window.app.dadesApp : {};

    /**
     * Rangs IMC de reserva si la BD no està disponible.
     * Basats en criteris ESPEN/Gerontologia per a +60 anys.
     */
    const RANGOS_IMC_FALLBACK = [
        { imc_min: 0,    imc_max: 22,  categoria: 'Sota pes',      mensaje_ca: 'Augmentar calories i proteïna. Consulta el teu metge.' },
        { imc_min: 22,   imc_max: 27,  categoria: 'Pes saludable', mensaje_ca: 'Mantenir els hàbits alimentaris i l\'activitat física.' },
        { imc_min: 27,   imc_max: 30,  categoria: 'Sobrepès',      mensaje_ca: 'Reduir lleugerament les calories i augmentar l\'activitat.' },
        { imc_min: 30,   imc_max: 35,  categoria: 'Obesitat I',    mensaje_ca: 'Reduir moderadament les calories. Seguiment mèdic recomanat.' },
        { imc_min: 35,   imc_max: 40,  categoria: 'Obesitat II',   mensaje_ca: 'Supervisió mèdica necessària per a un pla segur.' },
        { imc_min: 40,   imc_max: 999, categoria: 'Obesitat III',  mensaje_ca: 'Tractament especialitzat amb equip mèdic.' }
    ];

    // ============================================
    // INICIALITZACIÓ
    // ============================================

    /**
     * Registra els botons de la pantalla de resultats (només una vegada).
     */
    function inicialitzarResultats() {
        if (jaInicialitzat) return;

        const btnNou = document.getElementById('btn-nou-calcul');
        const btnPdf = document.getElementById('btn-exportar-pdf');

        if (btnNou) {
            btnNou.addEventListener('click', () => {
                // Formulari en blanc per a un nou càlcul
                window.formulari?.netejarFormulari({ silenci: true });
                sessionStorage.removeItem('lstyle_resultats');
                dadesUsuari = null;
                resultatsCalcul = null;
                menuDieta = null;
                menuSeedOffset = 0;
                window.app?.mostrarPantalla('pantalla-entrada-dades');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        if (btnPdf) {
            btnPdf.addEventListener('click', () => {
                if (!dadesUsuari || !resultatsCalcul) {
                    window.app?.mostrarToast('Primer has de calcular els resultats.', 'error', 4000);
                    return;
                }
                exportarPDF(dadesUsuari, resultatsCalcul);
            });
        }

        jaInicialitzat = true;
        console.log('✅ Mòdul resultats inicialitzat');
    }

    // ============================================
    // PUNT D'ENTRADA PRINCIPAL
    // ============================================

    /**
     * Rep les dades del formulari, calcula tot i mostra la UI.
     * Cridat per formulari.js després d'un enviament vàlid.
     * @param {Object} dades - Objecte de recollirDadesFormulari()
     */
    function mostrarResultats(dades) {
        if (!dades || !dades.pes || !dades.alcada) {
            window.app?.mostrarToast('Dades incompletes per calcular resultats.', 'error', 5000);
            return;
        }

        console.log('📊 Calculant resultats per:', dades.nom);

        dadesUsuari = dades;
        resultatsCalcul = calcularTot(dades);

        // Generar menú setmanal amb el motor local (Fase 3)
        generarMenuDieta(dades, resultatsCalcul);

        renderitzarUI(dades, resultatsCalcul);
        desarResultatsLocals(dades, resultatsCalcul);

        console.log('✅ Resultats calculats:', resultatsCalcul);
    }

    /**
     * Genera el menú de 2 setmanes amb motor-dieta.js.
     * @param {Object} dades
     * @param {Object} res
     * @param {boolean} [nouSeed=true] — si true, genera un seed nou (càlcul o «Nou menú»)
     */
    function generarMenuDieta(dades, res, nouSeed = true) {
        if (!window.motorDieta) {
            console.warn('⚠️ motor-dieta.js no carregat');
            menuDieta = null;
            return;
        }

        const app = obtenirDadesApp();
        if (!app.aliments || app.aliments.length === 0) {
            console.warn('⚠️ No hi ha aliments carregats de l\'API');
            menuDieta = null;
            return;
        }

        if (nouSeed) {
            menuSeedOffset = (Date.now() + Math.floor(Math.random() * 1000)) % 9973;
        }

        menuDieta = window.motorDieta.generarMenuSetmanal(dades, res, app, {
            seedOffset: menuSeedOffset
        });
        console.log('🍽️ Menú de 2 setmanes generat (seed ' + menuSeedOffset + '):', menuDieta.resum);
    }

    // ============================================
    // MOTOR DE CÀLCULS
    // ============================================

    /**
     * Executa tots els càlculs i retorna un objecte complet.
     * @param {Object} dades
     * @returns {Object}
     */
    function calcularTot(dades) {
        const imc = calcularIMC(dades.pes, dades.alcada);
        const interpretacioIMC = interpretarIMC(imc, dades.edat, dades.sexe);

        const tmb = calcularTMB(dades);
        const tdee = calcularTDEE(tmb, dades.factorActivitat);

        const icc = calcularICC(dades.cintura, dades.maluc);
        const interpretacioICC = interpretarICC(icc, dades.sexe);

        const hidratacio = calcularHidratacio(dades.pes, dades.edat);
        const proteina = calcularProteina(dades.pes, dades.edat, dades.factorActivitat);

        const pressio = interpretarPressio(dades.pressioMax, dades.pressioMin);
        const frequencia = interpretarFrequencia(dades.frequencia, dades.edat);

        return {
            imc,
            imcCategoria: interpretacioIMC.categoria,
            imcMissatge: interpretacioIMC.missatge,
            imcClasse: interpretacioIMC.classe,
            imcAccent: interpretacioIMC.accent,

            tmb: Math.round(tmb),
            tdee: Math.round(tdee),

            icc,
            iccInterpretacio: interpretacioICC.text,
            iccClasse: interpretacioICC.classe,
            iccAccent: interpretacioICC.accent,
            iccDisponible: icc !== null,

            hidratacio: Math.round(hidratacio),
            hidratacioText: formatHidratacio(hidratacio),

            proteina: Math.round(proteina),
            proteinaMin: Math.round(dades.pes * 1.0),
            proteinaMax: Math.round(dades.pes * 1.2 * obtenirFactorFormula('PROTEINA_DIARIA', dades.edat)),

            pressio,
            frequencia,

            dataCalcul: new Date().toISOString()
        };
    }

    /** IMC = pes (kg) / alçada (m)² */
    function calcularIMC(pes, alcadaCm) {
        const alcadaM = alcadaCm / 100;
        return pes / (alcadaM * alcadaM);
    }

    /**
     * TMB Harris-Benedict ajustada per factor d'edat senior (BD formulas_calculos).
     */
    function calcularTMB(dades) {
        let tmb;

        if (dades.sexe === 'M') {
            tmb = 66.5 + (13.75 * dades.pes) + (5.003 * dades.alcada) - (6.75 * dades.edat);
        } else {
            tmb = 655.1 + (9.563 * dades.pes) + (1.850 * dades.alcada) - (4.676 * dades.edat);
        }

        const factorEdat = obtenirFactorFormula('TMB', dades.edat);
        return Math.max(tmb * factorEdat, 800);
    }

    /** TDEE = TMB × factor d'activitat física (de la BD factores_actividad) */
    function calcularTDEE(tmb, factorActivitat) {
        const factor = factorActivitat || 1.20;
        return tmb * factor;
    }

    /** ICC = cintura / maluc (null si falten mesures) */
    function calcularICC(cintura, maluc) {
        if (!cintura || !maluc || maluc <= 0) return null;
        return cintura / maluc;
    }

    /**
     * Hidratació: 30-35 ml/kg × pes, ajustat per edat (protecció renal).
     * Utilitza el punt mig (32,5 ml/kg) com a valor recomanat.
     */
    function calcularHidratacio(pes, edat) {
        const mlPerKg = 32.5;
        const factorEdat = obtenirFactorFormula('HIDRATACION', edat);
        return pes * mlPerKg * factorEdat;
    }

    /**
     * Proteïna diària: 1,0-1,2 g/kg, amb increment per edat avançada (ESPEN seniors).
     * Bonus del 10% si activitat moderada-alta (factor ≥ 1,4).
     */
    function calcularProteina(pes, edat, factorActivitat) {
        const gramsPerKg = 1.1;
        let proteina = pes * gramsPerKg * obtenirFactorFormula('PROTEINA_DIARIA', edat);

        if (factorActivitat && factorActivitat >= 1.4) {
            proteina *= 1.1;
        }

        return proteina;
    }

    // ============================================
    // INTERPRETACIONS
    // ============================================

    /**
     * Busca el rang IMC adequat a la BD segons edat i sexe.
     * Si no hi ha dades a la BD, usa els rangs de reserva.
     */
    function interpretarIMC(imc, edat, sexe) {
        const app = obtenirDadesApp();
        let rangos = (app.rangosIMC || []).filter((r) => {
            const edatOk = edat >= r.edad_min && edat <= r.edad_max;
            const sexeOk = r.sexo === sexe || r.sexo === 'AMBOS';
            return edatOk && sexeOk;
        });

        if (rangos.length === 0) {
            rangos = RANGOS_IMC_FALLBACK;
        }

        const rang = rangos.find((r) => imc >= parseFloat(r.imc_min) && imc <= parseFloat(r.imc_max));

        if (rang) {
            return {
                categoria: rang.categoria,
                missatge: rang.mensaje_ca || '',
                classe: mapCategoriaAClasse(rang.categoria),
                accent: mapCategoriaAAccent(rang.categoria)
            };
        }

        // Fora de tots els rangs: classificar per extrem
        if (imc < parseFloat(rangos[0].imc_min)) {
            return {
                categoria: 'Sota pes',
                missatge: 'El teu IMC és inferior al rang saludable per a la teva edat.',
                classe: 'categoria-baix',
                accent: 'verd'
            };
        }

        return {
            categoria: 'Obesitat severa',
            missatge: 'El teu IMC supera els rangs habituals. Consulta el teu metge.',
            classe: 'categoria-molto_alt',
            accent: 'vermell'
        };
    }

    /** Interpretació ICC segons sexe (fórmules BD id 13 i 14) */
    function interpretarICC(icc, sexe) {
        if (icc === null) {
            return {
                text: 'Introdueix cintura i maluc al formulari',
                classe: '',
                accent: 'cyan'
            };
        }

        if (sexe === 'M') {
            if (icc < 0.90) return { text: 'Baix risc cardiovascular', classe: 'categoria-saludable', accent: 'verd' };
            if (icc <= 1.0)  return { text: 'Risc moderat', classe: 'categoria-modernat', accent: 'groc' };
            return { text: 'Risc alt', classe: 'categoria-alt', accent: 'vermell' };
        }

        if (icc < 0.80) return { text: 'Baix risc cardiovascular', classe: 'categoria-saludable', accent: 'verd' };
        if (icc <= 0.85) return { text: 'Risc moderat', classe: 'categoria-modernat', accent: 'groc' };
        return { text: 'Risc alt', classe: 'categoria-alt', accent: 'vermell' };
    }

    /** Pressió arterial segons criteris seniors (<140/90 és acceptable) */
    function interpretarPressio(sist, diast) {
        if (sist === null && diast === null) return null;

        const s = sist ?? 0;
        const d = diast ?? 0;

        if (s < 140 && d < 90) {
            return { text: 'Dins del rang acceptable per a seniors', classe: 'categoria-saludable' };
        }
        if (s < 160 && d < 100) {
            return { text: 'Lleugerament elevada — seguiment recomanat', classe: 'categoria-modernat' };
        }
        return { text: 'Elevada — consulta el teu metge', classe: 'categoria-alt' };
    }

    /** Freqüència cardíaca en repòs */
    function interpretarFrequencia(freq, edat) {
        if (freq === null) return null;

        const maxNormal = edat >= 80 ? 90 : 100;

        if (freq >= 60 && freq <= maxNormal) {
            return { text: 'Dins del rang normal en repòs', classe: 'categoria-saludable' };
        }
        if (freq < 60) {
            return { text: 'Bradicàrdia — consulta el teu metge si és habitual', classe: 'categoria-modernat' };
        }
        return { text: 'Taquicàrdia en repòs — consulta el teu metge', classe: 'categoria-alt' };
    }

    // ============================================
    // HELPERS DE FÓRMULES BD
    // ============================================

    /**
     * Obté el factor d'edat d'una fórmula de la BD segons el grup d'edat.
     * @param {string} tipus - TMB | HIDRATACION | PROTEINA_DIARIA | CALORIAS_DIARIAS
     * @param {number} edat
     * @returns {number}
     */
    function obtenirFactorFormula(tipus, edat) {
        const app = obtenirDadesApp();
        const formula = (app.formules || []).find((f) => f.tipo_calculo === tipus);

        if (!formula) {
            return factorEdatPerDefecte(edat, tipus);
        }

        if (edat < 70) return parseFloat(formula.factor_edad_60_70) || 1.0;
        if (edat < 80) return parseFloat(formula.factor_edad_70_80) || 1.0;
        return parseFloat(formula.factor_edad_80_plus) || 1.0;
    }

    /** Factors per defecte si l'API no ha carregat les fórmules */
    function factorEdatPerDefecte(edat, tipus) {
        const mapa = {
            TMB:             { jove: 0.95, mitja: 0.90, gran: 0.85 },
            HIDRATACION:     { jove: 0.95, mitja: 0.90, gran: 0.85 },
            PROTEINA_DIARIA: { jove: 1.00, mitja: 1.05, gran: 1.10 },
            CALORIAS_DIARIAS:{ jove: 1.00, mitja: 0.95, gran: 0.90 }
        };

        const factors = mapa[tipus] || { jove: 1.0, mitja: 1.0, gran: 1.0 };
        if (edat < 70) return factors.jove;
        if (edat < 80) return factors.mitja;
        return factors.gran;
    }

    /** Mapeja el nom de categoria IMC a classe CSS del semàfor */
    function mapCategoriaAClasse(categoria) {
        const c = (categoria || '').toLowerCase();
        if (c.includes('sota') || c.includes('baix')) return 'categoria-baix';
        if (c.includes('saludable') || c.includes('normal')) return 'categoria-saludable';
        if (c.includes('sobre')) return 'categoria-modernat';
        if (c.includes('obesitat iii') || c.includes('severa')) return 'categoria-molto_alt';
        if (c.includes('obesitat')) return 'categoria-alt';
        return 'categoria-modernat';
    }

    /** Mapeja categoria IMC a color d'accent de la targeta */
    function mapCategoriaAAccent(categoria) {
        const c = (categoria || '').toLowerCase();
        if (c.includes('sota') || c.includes('baix')) return 'verd';
        if (c.includes('saludable') || c.includes('normal')) return 'cyan';
        if (c.includes('sobre')) return 'groc';
        if (c.includes('obesitat iii') || c.includes('severa')) return 'vermell';
        if (c.includes('obesitat')) return 'taronja';
        return 'cyan';
    }

    /** Formata ml com a text llegible (ml o litres) */
    function formatHidratacio(ml) {
        if (ml >= 1000) {
            const litres = (ml / 1000).toFixed(1);
            return `${Math.round(ml)} ml (${litres} L)`;
        }
        return `${Math.round(ml)} ml`;
    }

    /** Format curt per al PDF (evita text massa llarg a la targeta KPI). */
    function formatHidratacioPdf(ml) {
        if (ml >= 1000) {
            return `${(ml / 1000).toFixed(1).replace('.', ',')} L`;
        }
        return `${Math.round(ml)} ml`;
    }

    // ============================================
    // RENDERITZACIÓ UI
    // ============================================

    /**
     * Omple tots els elements del DOM amb els resultats calculats.
     */
    function renderitzarUI(dades, res) {
        // Capçalera
        const titol = document.getElementById('resultats-titol');
        if (titol) titol.textContent = `Resultats per a ${dades.nom}`;

        // Targetes principals
        actualitzarTargeta('resultats-imc-valor', res.imc.toFixed(1), 'cyan');
        actualitzarInterpretacio('resultats-imc-categoria', res.imcCategoria, res.imcClasse);

        actualitzarTargeta('resultats-tmb-valor', res.tmb.toLocaleString('ca-ES'), 'lila');
        actualitzarTargeta('resultats-tdee-valor', res.tdee.toLocaleString('ca-ES'), 'taronja');

        if (res.iccDisponible) {
            actualitzarTargeta('resultats-icc-valor', res.icc.toFixed(2), res.iccAccent);
            actualitzarInterpretacio('resultats-icc-interpretacio', res.iccInterpretacio, res.iccClasse);
        } else {
            actualitzarTargeta('resultats-icc-valor', 'N/D', 'cyan');
            actualitzarInterpretacio('resultats-icc-interpretacio', res.iccInterpretacio, '');
        }

        actualitzarTargeta('resultats-hidratacio-valor', res.hidratacioText, 'cyan');
        actualitzarTargeta('resultats-proteina-valor', res.proteina.toString(), 'lila');
        actualitzarInterpretacio(
            'resultats-proteina-interpretacio',
            `${res.proteinaMin}–${res.proteinaMax} g/dia (rang recomanat)`,
            'categoria-saludable'
        );

        // Colors d'accent de les targetes
        aplicarAccentTargeta('resultats-imc-valor', res.imcAccent);
        aplicarAccentTargeta('resultats-tmb-valor', 'lila');
        aplicarAccentTargeta('resultats-tdee-valor', 'taronja');
        aplicarAccentTargeta('resultats-icc-valor', res.iccAccent);
        aplicarAccentTargeta('resultats-hidratacio-valor', 'cyan');
        aplicarAccentTargeta('resultats-proteina-valor', 'lila');

        // Recomanacions, menú i telèfons
        renderitzarRecomanacions(dades, res);
        renderitzarMenuSetmanal(dades, res);
        renderitzarTelefonos();

        // Icones Lucide
        if (window.lucide) lucide.createIcons();
    }

    /** Actualitza el text d'un element de valor */
    function actualitzarTargeta(elementId, valor, accent) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = valor;

        const targeta = el.closest('.resultat-targeta');
        if (targeta && accent) {
            targeta.setAttribute('data-accent', accent);
        }
    }

    /** Actualitza un element d'interpretació amb classe de semàfor */
    function actualitzarInterpretacio(elementId, text, classe) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = text;
        el.className = 'resultat-interpretacio';
        if (classe) el.classList.add(classe);
    }

    /** Aplica data-accent a la targeta pare */
    function aplicarAccentTargeta(elementId, accent) {
        const el = document.getElementById(elementId);
        const targeta = el?.closest('.resultat-targeta');
        if (targeta && accent) targeta.setAttribute('data-accent', accent);
    }

    /**
     * Genera la llista de recomanacions: consells de BD + interpretacions pròpies.
     */
    function renderitzarRecomanacions(dades, res) {
        const contenidor = document.getElementById('resultats-recomanacions');
        const seccio = document.getElementById('seccio-recomanacions');
        if (!contenidor) return;

        const items = [];

        // Consell general segons IMC
        if (res.imcMissatge) {
            items.push({
                tipus: 'GENERAL',
                text: res.imcMissatge,
                meta: `IMC: ${res.imc.toFixed(1)} — ${res.imcCategoria}`
            });
        }

        // Consells de la BD per condicions de salut seleccionades
        const app = obtenirDadesApp();
        const consellsBD = (app.consells || [])
            .filter((c) => dades.condicions.includes(c.condicion_id))
            .sort((a, b) => (a.prioridad || 2) - (b.prioridad || 2));

        consellsBD.forEach((consell) => {
            const condicio = (app.condicionsSalut || []).find((c) => c.id === consell.condicion_id);
            items.push({
                tipus: consell.tipo || 'GENERAL',
                text: consell.consejo_ca,
                meta: condicio ? condicio.nombre_ca : ''
            });
        });

        // Consells segons hàbits
        if (dades.fumador) {
            items.push({
                tipus: 'GENERAL',
                text: 'Si fumes, considera demanar ajuda per deixar-ho. El tabac augmenta el risc cardiovascular i respiratori.',
                meta: 'Hàbit: fumador'
            });
        }

        if (dades.alcohol === 'habitual') {
            items.push({
                tipus: 'ALIMENTACION',
                text: 'Redueix el consum d\'alcohol. En seniors, fins i tot quantitats moderades poden interactuar amb medicaments.',
                meta: 'Hàbit: alcohol habitual'
            });
        }

        if (dades.son === 'menys6') {
            items.push({
                tipus: 'GENERAL',
                text: 'Dormir menys de 6 hores augmenta el risc de caigudes i problemes cognitius. Intenta mantenir una rutina de son regular.',
                meta: 'Hàbit: son insuficient'
            });
        }

        // Pressió arterial
        if (res.pressio) {
            items.push({
                tipus: 'MEDICACION',
                text: res.pressio.text,
                meta: `Pressió: ${dades.pressioMax || '?'}/${dades.pressioMin || '?'} mmHg`
            });
        }

        // Freqüència cardíaca
        if (res.frequencia) {
            items.push({
                tipus: 'GENERAL',
                text: res.frequencia.text,
                meta: `Freqüència: ${dades.frequencia} bpm`
            });
        }

        // Proteïna i hidratació
        items.push({
            tipus: 'ALIMENTACION',
            text: `Objectiu de proteïna: ${res.proteina} g/dia. Distribueix-la en 3-4 àpats per optimitzar la síntesi muscular.`,
            meta: 'Recomanació ESPEN per a seniors'
        });

        items.push({
            tipus: 'ALIMENTACION',
            text: `Beu almenys ${res.hidratacioText} d'aigua al dia, repartits en tot el dia (no tot d'un cop).`,
            meta: 'Hidratació adaptada a l\'edat'
        });

        if (items.length === 0) {
            if (seccio) seccio.classList.add('ocult');
            return;
        }

        if (seccio) seccio.classList.remove('ocult');

        const iconesTipus = {
            ALIMENTACION: 'utensils',
            EJERCICIO: 'dumbbell',
            MEDICACION: 'pill',
            GENERAL: 'heart-pulse'
        };
        const ordreTipus = ['ALIMENTACION', 'EJERCICIO', 'MEDICACION', 'GENERAL'];
        const titolsTipus = {
            ALIMENTACION: 'Alimentació',
            EJERCICIO: 'Activitat física',
            MEDICACION: 'Salut i medicació',
            GENERAL: 'Estil de vida'
        };

        // Agrupar: 1r per patologia (meta de condició), després per tipus de recomanació
        const perPatologia = new Map();

        items.forEach((item) => {
            const esPatologia = item.meta
                && !item.meta.startsWith('Hàbit:')
                && !item.meta.startsWith('IMC:')
                && !item.meta.startsWith('Pressió:')
                && !item.meta.startsWith('Freqüència:')
                && !item.meta.startsWith('Recomanació')
                && !item.meta.startsWith('Hidratació');

            const clau = esPatologia ? item.meta : 'Estil de vida';
            if (!perPatologia.has(clau)) perPatologia.set(clau, []);
            perPatologia.get(clau).push(item);
        });

        // Ordenar: patologies alfabètiques, "Estil de vida" al final
        const claus = [...perPatologia.keys()].sort((a, b) => {
            if (a === 'Estil de vida') return 1;
            if (b === 'Estil de vida') return -1;
            return a.localeCompare(b, 'ca');
        });

        contenidor.innerHTML = claus.map((patologia) => {
            const llista = perPatologia.get(patologia);
            const perTipus = {};
            llista.forEach((item) => {
                const t = ordreTipus.includes(item.tipus) ? item.tipus : 'GENERAL';
                if (!perTipus[t]) perTipus[t] = [];
                perTipus[t].push(item);
            });

            const blocsTipus = ordreTipus
                .filter((t) => perTipus[t]?.length)
                .map((t) => `
                    <div class="recomanacio-subgrup">
                        <h5 class="recomanacio-subgrup-titol">
                            <i data-lucide="${iconesTipus[t]}" class="lucide-14"></i>
                            ${escaparHtml(titolsTipus[t])}
                        </h5>
                        ${perTipus[t].map((item) => `
                            <div class="consell-item">
                                <div class="consell-item-icona">
                                    <i data-lucide="${iconesTipus[t]}" class="lucide-16"></i>
                                </div>
                                <div>
                                    <p class="consell-item-text">${escaparHtml(item.text)}</p>
                                    ${item.meta && patologia === 'Estil de vida'
                                        ? `<span class="consell-item-meta">${escaparHtml(item.meta)}</span>`
                                        : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('');

            const iconaGrup = patologia === 'Estil de vida' ? 'heart-pulse' : 'stethoscope';
            return `
                <div class="recomanacio-grup" data-patologia="${escaparHtml(patologia)}">
                    <h4 class="recomanacio-grup-titol">
                        <i data-lucide="${iconaGrup}" class="lucide-16"></i>
                        ${escaparHtml(patologia)}
                    </h4>
                    <div class="recomanacio-grup-llista">
                        ${blocsTipus}
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Renderitza el menú de 2 setmanes en format calendari (14 dies × 5 àpats).
     * Les dades de l'usuari s'introdueixen una sola vegada; el pla es mostra sencer.
     */
    function renderitzarMenuSetmanal(dades, res) {
        const contenidor = document.getElementById('menu-setmanal-contingut');
        const seccioMenu = contenidor?.closest('.resultat-seccio');
        if (!contenidor) return;

        if (!menuDieta || !menuDieta.menuSetmana?.length) {
            contenidor.innerHTML = `
                <div class="menu-pendent">
                    <div class="menu-pendent-icona">🍽️</div>
                    <p><strong>Menú no disponible</strong></p>
                    <p>No s'han pogut carregar els aliments de la base de dades.
                       Comprova la connexió amb l'API i torna a calcular.</p>
                    <p>Objectiu: <strong>${res.tdee.toLocaleString('ca-ES')} kcal/dia</strong>
                       · <strong>${res.proteina} g proteïna</strong></p>
                </div>
            `;
            return;
        }

        const subtitol = seccioMenu?.querySelector('.resultat-subtitol');
        if (subtitol) {
            subtitol.textContent =
                `Pla de ${menuDieta.menuSetmana.length} dies · Dieta del Plat · Mediterrània · Temporada: ${menuDieta.estacio} · ${dades.dieta}`;
        }

        const numDies = menuDieta.menuSetmana.length;
        const apats = window.motorDieta.APATS;
        const nomsApats = window.motorDieta.NOMS_APATS;

        // Capçaleres dels dies (columnes del calendari)
        const capcaleresDies = menuDieta.menuSetmana.map((dia) => `
            <div class="header-dia">
                <span class="header-dia-num">Dia ${dia.dia}</span>
                <span class="header-dia-data">${formatarDataCatala(dia.data)}</span>
            </div>
        `).join('');

        // Files d'àpats (cada fila = un àpat, 15 columnes de plats)
        const filesApats = apats.map((tipus) => {
            const celles = menuDieta.menuSetmana.map((dia) => {
                const apat = dia[tipus];
                return `
                    <div class="plat-menu menu-cal-cella" title="${escaparHtml(apat.descripcio)}">
                        <div class="nom-plat">${escaparHtml(apat.descripcio)}</div>
                        <div class="detalls-plat">${apat.calories} kcal · ${apat.proteina} g prot.</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="header-tipus menu-cal-apat-label">${escaparHtml(nomsApats[tipus])}</div>
                ${celles}
            `;
        }).join('');

        const resumSetmana = `
            <div class="menu-resum-setmana">
                <span>Mitjana: <strong>${menuDieta.resum.kcalMitjana} kcal/dia</strong>
                (objectiu: ${menuDieta.resum.objectiuKcal})</span>
                <span>Proteïna mitjana: <strong>${menuDieta.resum.proteinaMitjana} g</strong>
                (objectiu: ${menuDieta.resum.objectiuProteina} g)</span>
            </div>
        `;

        const llistaHtml = construirHtmlLlistaCompra(menuDieta.llistaCompra);

        contenidor.innerHTML = `
            <div class="menu-controls menu-controls--centrat">
                <p class="menu-cal-info">
                    Calendari de <strong>${numDies} dies</strong> ·
                    ${(dades.alergies?.length || dades.intolerancies?.length || dades.alergiesAltres?.length)
                        ? 'Adaptat a les teves al·lèrgies i intoleràncies'
                        : 'Sense restriccions d\'al·lèrgies'}
                </p>
                <button type="button" id="btn-regenerar-menu" class="btn-regenerar-menu" title="Generar un menú diferent">
                    <i data-lucide="shuffle" class="lucide-14"></i>
                    Nou menú
                </button>
            </div>
            ${resumSetmana}
            <div class="menu-calendari-scroll" role="region" aria-label="Calendari del menú quinzenal">
                <div class="grid-menu-setmanal menu-calendari"
                     style="grid-template-columns: minmax(88px, 100px) repeat(${numDies}, minmax(112px, 1fr));">
                    <div class="header-dia buit menu-cal-corner"></div>
                    ${capcaleresDies}
                    ${filesApats}
                </div>
            </div>
            <details class="menu-llista-compra" open>
                <summary>
                    <i data-lucide="shopping-cart" class="lucide-14"></i>
                    Llista de la compra — ${numDies} dies (${menuDieta.llistaCompra.length} productes)
                </summary>
                ${llistaHtml}
            </details>
        `;

        const btnRegenerar = document.getElementById('btn-regenerar-menu');
        if (btnRegenerar) {
            btnRegenerar.addEventListener('click', () => {
                // Seed nou → combinació d'aliments diferent
                generarMenuDieta(dadesUsuari, resultatsCalcul, true);
                renderitzarMenuSetmanal(dadesUsuari, resultatsCalcul);
                desarResultatsLocals(dadesUsuari, resultatsCalcul);
                window.app?.mostrarToast('Menú regenerat amb plats diferents', 'exit', 3000);
                if (window.lucide) lucide.createIcons();
            });
        }
    }

    /**
     * Mostra els telèfons d'emergència carregats de l'API.
     */
    function renderitzarTelefonos() {
        const contenidor = document.getElementById('resultats-telefonos');
        const seccio = document.getElementById('seccio-telefonos');
        if (!contenidor) return;

        const telefonos = obtenirDadesApp().telefonos || [];
        if (!telefonos.length) {
            if (seccio) seccio.classList.add('ocult');
            contenidor.innerHTML = '';
            return;
        }

        if (seccio) seccio.classList.remove('ocult');

        const iconesTipus = {
            EMERGENCIA: 'phone-call',
            SALUD: 'heart-pulse',
            SOCIAL: 'helping-hand'
        };

        contenidor.innerHTML = telefonos.map((t) => {
            const icona = iconesTipus[t.tipo] || 'phone';
            const telNet = String(t.telefono || '').replace(/\s+/g, '');
            return `
                <a class="telefono-targeta" href="tel:${escaparHtml(telNet)}" data-tipus="${escaparHtml(t.tipo || '')}">
                    <div class="telefono-icona">
                        <i data-lucide="${icona}" class="lucide-18"></i>
                    </div>
                    <div class="telefono-info">
                        <strong class="telefono-nom">${escaparHtml(t.nombre_ca || '')}</strong>
                        <span class="telefono-numero">${escaparHtml(t.telefono || '')}</span>
                        <span class="telefono-desc">${escaparHtml(t.descripcion_ca || '')}</span>
                    </div>
                </a>
            `;
        }).join('');
    }

    /** Formata una data ISO com a "Dl 28/07" */
    function formatarDataCatala(dataIso) {
        const data = new Date(`${dataIso}T12:00:00`);
        const abrev = ['Dg', 'Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds'];
        const dd = String(data.getDate()).padStart(2, '0');
        const mm = String(data.getMonth() + 1).padStart(2, '0');
        return `${abrev[data.getDay()]} ${dd}/${mm}`;
    }

    /**
     * Llista de la compra en 2 columnes, agrupada per tipus d'aliment
     * (peix, carn, llegums…).
     */
    function construirHtmlLlistaCompra(llista) {
        const nomsCat = window.motorDieta?.NOMS_CATEGORIES || {};
        const ordre = window.motorDieta?.ORDRE_COMPRA || [];
        const perCat = new Map();

        (llista || []).forEach((item) => {
            const cat = item.categoriaId;
            if (!perCat.has(cat)) perCat.set(cat, []);
            perCat.get(cat).push(item);
        });

        const blocs = (ordre.length ? ordre : [...perCat.keys()])
            .filter((cat) => perCat.has(cat))
            .map((cat) => {
                const items = perCat.get(cat);
                const lis = items.map((item) => {
                    const grams = item.gramsTotal >= 1000
                        ? `${(item.gramsTotal / 1000).toFixed(1)} kg`
                        : `${item.gramsTotal} g`;
                    return `<li><span>${escaparHtml(item.nom)}</span><span>${grams}</span></li>`;
                }).join('');
                return `
                    <div class="compra-categoria">
                        <h5 class="compra-categoria-titol">${escaparHtml(nomsCat[cat] || 'Altres')}</h5>
                        <ul>${lis}</ul>
                    </div>
                `;
            }).join('');

        return `<div class="compra-grid">${blocs}</div>`;
    }

    /**
     * Agrupa el menú en setmanes Dilluns–Diumenge (7 columnes).
     * Amb pla de 14 dies des de dilluns → exactament 2 setmanes plenes.
     */
    function agrupadesPerSetmana(menuSetmana) {
        const setmanes = [];
        let actual = [null, null, null, null, null, null, null];

        (menuSetmana || []).forEach((dia) => {
            const d = new Date(`${dia.data}T12:00:00`);
            const idx = d.getDay() === 0 ? 6 : d.getDay() - 1; // Dl=0 … Dg=6

            if (idx === 0 && actual.some(Boolean)) {
                setmanes.push(actual);
                actual = [null, null, null, null, null, null, null];
            }

            actual[idx] = dia;

            if (idx === 6) {
                setmanes.push(actual);
                actual = [null, null, null, null, null, null, null];
            }
        });

        if (actual.some(Boolean)) setmanes.push(actual);
        return setmanes;
    }

    /** Escurta text per a cel·les d'infografia PDF. */
    function escurcarTextPdf(text, max) {
        const t = String(text || '').replace(/\s+/g, ' ').trim();
        if (t.length <= max) return t;
        return `${t.slice(0, Math.max(0, max - 1)).trim()}…`;
    }

    /** Grams llegibles per a la llista de compra. */
    function formatGramsCompra(grams) {
        if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
        return `${grams} g`;
    }

    /**
     * Genera un PDF landscape tipus infografia:
     * 1) Portada amb KPIs · 2–3) Setmanes Dl–Dg · 4) Llista de compra per categories.
     */
    function exportarPDF(dades, res) {
        if (!window.jspdf) {
            window.app?.mostrarToast('La llibreria PDF no està carregada. Refresca la pàgina.', 'error', 5000);
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const dataAvui = new Date().toLocaleDateString('ca-ES', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            // Paleta infografia (marca LSTYLE)
            const C = {
                fons: [10, 27, 42],
                fonsSuau: [14, 36, 56],
                targeta: [19, 47, 76],
                cyan: [0, 200, 232],
                verd: [0, 230, 118],
                blau: [0, 136, 204],
                taronja: [255, 183, 77],
                lila: [171, 140, 255],
                blanc: [255, 255, 255],
                text: [220, 235, 245],
                muted: [140, 170, 190],
                linia: [40, 70, 95]
            };

            const colorsApat = {
                esmorzar: C.cyan,
                migMatinar: [100, 180, 210],
                dinar: C.verd,
                berenar: C.taronja,
                sopar: C.lila
            };

            const etiquetesAlergies = {
                ou: 'Ou', peix: 'Peix', marisc: 'Marisc', lactics: 'Làctics',
                'fruits-secs': 'Fruits secs', soja: 'Soja', cacauet: 'Cacauet', sesam: 'Sèsam'
            };
            const alergiesTxt = [
                ...(dades.alergies || []).map((a) => etiquetesAlergies[a] || a),
                ...(dades.alergiesAltres || [])
            ].join(', ') || 'Cap';
            const intoleranciesTxt = (dades.intolerancies || []).join(', ') || 'Cap';
            const totalDies = menuDieta?.menuSetmana?.length || 14;

            /** Fons fosc de pàgina completa. */
            function pintarFons() {
                doc.setFillColor(...C.fons);
                doc.rect(0, 0, pageW, pageH, 'F');
            }

            /** Capçalera amb accent de color. */
            function pintarCapcalera(colorAccent, titol, subtitolDreta) {
                doc.setFillColor(...colorAccent);
                doc.rect(0, 0, pageW, 4, 'F');
                doc.setFillColor(...C.fonsSuau);
                doc.rect(0, 4, pageW, 18, 'F');
                doc.setTextColor(...C.blanc);
                doc.setFontSize(13);
                doc.setFont(undefined, 'bold');
                doc.text(titol, 12, 15);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                doc.setTextColor(...C.muted);
                doc.text(subtitolDreta || '', pageW - 12, 15, { align: 'right' });
            }

            function pintarPeu(text) {
                doc.setDrawColor(...C.linia);
                doc.setLineWidth(0.3);
                doc.line(12, pageH - 9, pageW - 12, pageH - 9);
                doc.setFontSize(7);
                doc.setTextColor(...C.muted);
                doc.text(text, 12, pageH - 5);
                doc.text('LSTYLE-SENIORS-PLUS · orientatiu, no substitueix consell mèdic', pageW - 12, pageH - 5, { align: 'right' });
            }

            // ========== 1) PORTADA INFOGRAFIA ==========
            pintarFons();
            doc.setFillColor(...C.cyan);
            doc.rect(0, 0, pageW, 5, 'F');

            doc.setTextColor(...C.cyan);
            doc.setFontSize(22);
            doc.setFont(undefined, 'bold');
            doc.text('LSTYLE-SENIORS-PLUS', 14, 20);
            doc.setFontSize(11);
            doc.setTextColor(...C.text);
            doc.setFont(undefined, 'normal');
            doc.text('Infografia de salut · Pla alimentari de 2 setmanes (Dl–Dg)', 14, 28);

            doc.setFontSize(10);
            doc.setTextColor(...C.muted);
            doc.text(dataAvui, pageW - 14, 18, { align: 'right' });
            doc.setTextColor(...C.blanc);
            doc.setFont(undefined, 'bold');
            doc.text(
                `${dades.nom}  ·  ${dades.sexe === 'M' ? 'Home' : 'Dona'}  ·  ${dades.edat} anys`,
                pageW - 14, 28, { align: 'right' }
            );
            doc.setFont(undefined, 'normal');

            // KPIs amb sigles + significat (infografia)
            const kpis = [
                {
                    sigla: 'IMC',
                    nom: 'Índex de massa corporal',
                    valor: res.imc.toFixed(1),
                    meta: escurcarTextPdf(res.imcCategoria, 22),
                    color: C.cyan,
                    fontValor: 13
                },
                {
                    sigla: 'TMB',
                    nom: 'Taxa metabòlica basal',
                    valor: `${res.tmb}`,
                    meta: 'kcal/dia',
                    color: C.blau,
                    fontValor: 13
                },
                {
                    sigla: 'TDEE',
                    nom: 'Despesa energètica total',
                    valor: `${res.tdee}`,
                    meta: 'kcal/dia',
                    color: C.verd,
                    fontValor: 13
                },
                {
                    sigla: 'ICC',
                    nom: 'Índex cintura-maluc',
                    valor: res.iccDisponible ? res.icc.toFixed(2) : 'N/D',
                    meta: escurcarTextPdf(res.iccInterpretacio || '', 20),
                    color: C.taronja,
                    fontValor: 12
                },
                {
                    sigla: 'Aigua',
                    nom: 'Hidratació diària',
                    valor: formatHidratacioPdf(res.hidratacio),
                    meta: 'recomanada',
                    color: C.cyan,
                    fontValor: 10
                },
                {
                    sigla: 'Prot.',
                    nom: 'Proteïna diària',
                    valor: `${res.proteina} g`,
                    meta: 'al dia',
                    color: C.lila,
                    fontValor: 12
                }
            ];
            const cardW = (pageW - 28 - 25) / 6;
            const cardH = 48;
            kpis.forEach((kpi, i) => {
                const x = 14 + i * (cardW + 5);
                const y = 40;
                doc.setFillColor(...C.targeta);
                doc.roundedRect(x, y, cardW, cardH, 4, 4, 'F');
                doc.setFillColor(...kpi.color);
                doc.roundedRect(x, y, cardW, 3.5, 2, 2, 'F');

                doc.setTextColor(...kpi.color);
                doc.setFontSize(7);
                doc.setFont(undefined, 'bold');
                doc.text(kpi.sigla, x + cardW / 2, y + 10, { align: 'center' });

                doc.setFont(undefined, 'normal');
                doc.setFontSize(5);
                doc.setTextColor(...C.muted);
                const liniesNom = doc.splitTextToSize(kpi.nom, cardW - 4);
                doc.text(liniesNom.slice(0, 2), x + cardW / 2, y + 14, { align: 'center' });

                doc.setTextColor(...C.blanc);
                doc.setFontSize(kpi.fontValor || 12);
                doc.setFont(undefined, 'bold');
                doc.text(String(kpi.valor), x + cardW / 2, y + 28, { align: 'center' });

                doc.setFont(undefined, 'normal');
                doc.setFontSize(5.5);
                doc.setTextColor(...C.muted);
                doc.text(escurcarTextPdf(String(kpi.meta), 18), x + cardW / 2, y + 38, { align: 'center' });
            });

            // Blocs de perfil (3 columnes) — ajustats per targetes KPI més altes
            const perfilY = 96;
            const blocsPerfil = [
                {
                    titol: 'MESURES',
                    color: C.cyan,
                    linies: [
                        `Alçada  ${dades.alcada} cm`,
                        `Pes  ${dades.pes} kg`,
                        `Cintura  ${dades.cintura ? `${dades.cintura} cm` : 'N/D'}`,
                        `Maluc  ${dades.maluc ? `${dades.maluc} cm` : 'N/D'}`
                    ]
                },
                {
                    titol: 'ESTIL DE VIDA',
                    color: C.verd,
                    linies: [
                        `Activitat  ${dades.activitatNivell || 'N/D'}`,
                        `Dieta  ${dades.dieta || 'N/D'}`,
                        `Pressió  ${dades.pressioMax ? `${dades.pressioMax}/${dades.pressioMin}` : 'N/D'}`,
                        `Pla  ${totalDies} dies (2 setmanes)`
                    ]
                },
                {
                    titol: 'RESTRICCIONS',
                    color: C.taronja,
                    linies: [
                        `Al·lèrgies  ${escurcarTextPdf(alergiesTxt, 40)}`,
                        `Intoleràncies  ${escurcarTextPdf(intoleranciesTxt, 36)}`,
                        `Temporada  ${menuDieta?.estacio || '—'}`,
                        'Patró  Dieta del Plat · Mediterrània'
                    ]
                }
            ];
            const blocW = (pageW - 28 - 16) / 3;
            blocsPerfil.forEach((bloc, i) => {
                const x = 14 + i * (blocW + 8);
                const y = perfilY;
                doc.setFillColor(...C.targeta);
                doc.roundedRect(x, y, blocW, 78, 4, 4, 'F');
                doc.setFillColor(...bloc.color);
                doc.circle(x + 8, y + 10, 2.2, 'F');
                doc.setTextColor(...bloc.color);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(bloc.titol, x + 14, y + 12);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...C.text);
                doc.setFontSize(9);
                bloc.linies.forEach((linia, li) => {
                    doc.text(linia, x + 8, y + 28 + li * 12);
                });
            });

            pintarPeu(`Generat el ${dataAvui}`);

            // ========== 2–3) SETMANES Dl–Dg ==========
            if (menuDieta?.menuSetmana?.length) {
                const setmanes = agrupadesPerSetmana(menuDieta.menuSetmana);
                const abrevDies = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
                const apats = window.motorDieta.APATS;
                const nomsApats = window.motorDieta.NOMS_APATS;

                setmanes.forEach((setmana, p) => {
                    doc.addPage('a4', 'landscape');
                    pintarFons();
                    pintarCapcalera(
                        p === 0 ? C.blau : C.cyan,
                        `SETMANA ${p + 1}  ·  Dilluns — Diumenge`,
                        `${dades.nom}  ·  ${menuDieta.estacio || ''}`
                    );

                    const margeX = 8;
                    const margeY = 28;
                    const gap = 2.5;
                    const colW = (pageW - margeX * 2 - gap * 6) / 7;
                    const peusH = 12;
                    const colH = pageH - margeY - peusH;
                    const capDiaH = 14;
                    const apatH = (colH - capDiaH) / apats.length;

                    setmana.forEach((dia, idx) => {
                        const x = margeX + idx * (colW + gap);
                        const y = margeY;

                        // Columna dia
                        doc.setFillColor(...C.targeta);
                        doc.roundedRect(x, y, colW, colH, 2.5, 2.5, 'F');

                        // Capçalera del dia
                        doc.setFillColor(...(dia ? C.blau : [50, 70, 90]));
                        doc.roundedRect(x, y, colW, capDiaH, 2.5, 2.5, 'F');
                        doc.rect(x, y + capDiaH - 3, colW, 3, 'F'); // cantonades inferiors quadrades

                        doc.setTextColor(...C.blanc);
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'bold');
                        doc.text(abrevDies[idx], x + colW / 2, y + 5.5, { align: 'center' });
                        doc.setFont(undefined, 'normal');
                        doc.setFontSize(6.5);
                        if (dia) {
                            const parts = formatarDataCatala(dia.data).split(' ');
                            doc.text(parts[1] || parts[0], x + colW / 2, y + 11, { align: 'center' });
                        } else {
                            doc.setTextColor(...C.muted);
                            doc.text('—', x + colW / 2, y + 11, { align: 'center' });
                        }

                        apats.forEach((tipus, ai) => {
                            const ay = y + capDiaH + ai * apatH;
                            const color = colorsApat[tipus] || C.cyan;

                            // Banda de color de l'àpat
                            doc.setFillColor(...color);
                            doc.rect(x, ay, 2.2, apatH, 'F');

                            // Separador
                            if (ai > 0) {
                                doc.setDrawColor(...C.linia);
                                doc.setLineWidth(0.2);
                                doc.line(x + 3, ay, x + colW - 1, ay);
                            }

                            doc.setTextColor(...color);
                            doc.setFontSize(5.5);
                            doc.setFont(undefined, 'bold');
                            doc.text((nomsApats[tipus] || tipus).toUpperCase(), x + 4, ay + 4);

                            if (!dia) {
                                doc.setTextColor(...C.muted);
                                doc.setFont(undefined, 'normal');
                                doc.setFontSize(6);
                                doc.text('—', x + 4, ay + 10);
                                return;
                            }

                            const apat = dia[tipus];
                            const desc = escurcarTextPdf(apat?.descripcio || '', 55);
                            const linies = doc.splitTextToSize(desc, colW - 6);
                            doc.setTextColor(...C.text);
                            doc.setFont(undefined, 'normal');
                            doc.setFontSize(6);
                            const maxLinies = Math.max(1, Math.floor((apatH - 12) / 3.2));
                            doc.text(linies.slice(0, maxLinies), x + 4, ay + 8);

                            doc.setTextColor(...color);
                            doc.setFontSize(5.5);
                            doc.setFont(undefined, 'bold');
                            doc.text(`${apat?.calories || 0} kcal`, x + 4, ay + apatH - 2.5);
                            doc.setFont(undefined, 'normal');
                        });
                    });

                    // Llegenda d'àpats
                    let lx = 8;
                    const ly = pageH - 7;
                    apats.forEach((tipus) => {
                        const color = colorsApat[tipus];
                        doc.setFillColor(...color);
                        doc.roundedRect(lx, ly - 3, 3, 3, 0.5, 0.5, 'F');
                        doc.setTextColor(...C.muted);
                        doc.setFontSize(6.5);
                        doc.text(nomsApats[tipus], lx + 4.5, ly);
                        lx += doc.getTextWidth(nomsApats[tipus]) + 10;
                    });
                    doc.setTextColor(...C.muted);
                    doc.text(`Setmana ${p + 1}/${setmanes.length}`, pageW - 8, ly, { align: 'right' });
                });

                // ========== 4) LLISTA DE COMPRA INFOGRAFIA ==========
                if (menuDieta.llistaCompra?.length) {
                    const nomsCat = window.motorDieta.NOMS_CATEGORIES || {};
                    const ordre = window.motorDieta.ORDRE_COMPRA || [];
                    const perCat = new Map();
                    menuDieta.llistaCompra.forEach((item) => {
                        const cat = item.categoriaId;
                        if (!perCat.has(cat)) perCat.set(cat, []);
                        perCat.get(cat).push(item);
                    });

                    const categoriesBase = (ordre.length ? ordre : [...perCat.keys()])
                        .filter((cat) => perCat.has(cat))
                        .map((cat) => ({
                            id: cat,
                            nom: nomsCat[cat] || 'Altres',
                            items: perCat.get(cat)
                        }));

                    const colorsCat = [
                        C.cyan, C.blau, C.verd, C.taronja, C.lila,
                        [80, 200, 180], [255, 120, 120], [180, 200, 80], [120, 160, 255]
                    ];

                    const cols = 3;
                    const margeX = 10;
                    const margeY = 28;
                    const gapX = 5;
                    const gapY = 4;
                    const cardW = (pageW - margeX * 2 - gapX * (cols - 1)) / cols;
                    const itemH = 4.2;
                    const capCatH = 10;
                    const paddingBaix = 3;
                    const alturaDisponible = pageH - margeY - 12;
                    const maxItemsPerTargeta = Math.max(4, Math.floor((alturaDisponible - capCatH - paddingBaix) / itemH));

                    // Divideix categories molt llargues en diverses targetes
                    const categories = [];
                    categoriesBase.forEach((cat) => {
                        if (cat.items.length <= maxItemsPerTargeta) {
                            categories.push(cat);
                            return;
                        }
                        for (let s = 0; s < cat.items.length; s += maxItemsPerTargeta) {
                            const tros = cat.items.slice(s, s + maxItemsPerTargeta);
                            categories.push({
                                id: cat.id,
                                nom: s === 0 ? cat.nom : `${cat.nom} (cont.)`,
                                items: tros
                            });
                        }
                    });

                    // Empaquem categories en pàgines (3 columnes, sense tallar una categoria)
                    const paginesCompra = [];
                    let columnes = Array.from({ length: cols }, () => ({ y: 0, cats: [] }));
                    let paginaActual = [];

                    function tancarPaginaCompra() {
                        if (paginaActual.length) {
                            paginesCompra.push(paginaActual);
                            paginaActual = [];
                            columnes = Array.from({ length: cols }, () => ({ y: 0, cats: [] }));
                        }
                    }

                    categories.forEach((cat, i) => {
                        const h = Math.min(
                            alturaDisponible,
                            capCatH + cat.items.length * itemH + paddingBaix
                        );
                        // Columna més baixa
                        let colIdx = 0;
                        for (let c = 1; c < cols; c++) {
                            if (columnes[c].y < columnes[colIdx].y) colIdx = c;
                        }
                        if (columnes[colIdx].y + h > alturaDisponible + 0.5 && columnes.some((c) => c.cats.length)) {
                            tancarPaginaCompra();
                            colIdx = 0;
                        }
                        const y = columnes[colIdx].y;
                        const entrada = {
                            cat,
                            color: colorsCat[i % colorsCat.length],
                            x: margeX + colIdx * (cardW + gapX),
                            y: margeY + y,
                            h
                        };
                        paginaActual.push(entrada);
                        columnes[colIdx].cats.push(entrada);
                        columnes[colIdx].y += h + gapY;
                    });
                    tancarPaginaCompra();

                    paginesCompra.forEach((pagina, pi) => {
                        doc.addPage('a4', 'landscape');
                        pintarFons();
                        pintarCapcalera(
                            C.verd,
                            `LLISTA DE LA COMPRA  ·  ${totalDies} dies`,
                            pi === 0
                                ? `${menuDieta.llistaCompra.length} productes  ·  ${dades.nom}`
                                : `Continuació  ·  ${dades.nom}`
                        );

                        pagina.forEach((bloc) => {
                            const { cat, color, x, y, h } = bloc;
                            doc.setFillColor(...C.targeta);
                            doc.roundedRect(x, y, cardW, h, 3, 3, 'F');
                            doc.setFillColor(...color);
                            doc.roundedRect(x, y, cardW, 8, 3, 3, 'F');
                            doc.rect(x, y + 5, cardW, 3, 'F');

                            doc.setTextColor(...C.fons);
                            doc.setFontSize(8);
                            doc.setFont(undefined, 'bold');
                            doc.text(cat.nom.toUpperCase(), x + 4, y + 5.5);
                            doc.setFont(undefined, 'normal');

                            const maxItems = Math.max(1, Math.floor((h - capCatH - 1) / itemH));
                            cat.items.slice(0, maxItems).forEach((item, ii) => {
                                const iy = y + 12 + ii * itemH;
                                doc.setDrawColor(...C.muted);
                                doc.setLineWidth(0.3);
                                doc.rect(x + 3.5, iy - 2.2, 2.4, 2.4);

                                doc.setTextColor(...C.text);
                                doc.setFontSize(6.5);
                                doc.text(escurcarTextPdf(item.nom, 30), x + 8, iy);

                                doc.setTextColor(...color);
                                doc.setFont(undefined, 'bold');
                                doc.text(formatGramsCompra(item.gramsTotal), x + cardW - 3.5, iy, { align: 'right' });
                                doc.setFont(undefined, 'normal');
                            });
                        });

                        pintarPeu('Marca cada producte a mesura que el compres');
                    });
                }
            }

            // ========== TELÈFONS D'EMERGÈNCIA (mateix estil infografia) ==========
            const telefonos = (obtenirDadesApp().telefonos || []).slice()
                .sort((a, b) => (a.orden || 0) - (b.orden || 0));

            if (telefonos.length) {
                const colorsTipus = {
                    EMERGENCIA: [255, 100, 100],
                    SALUD: C.verd,
                    SOCIAL: C.lila
                };
                const etiquetesTipus = {
                    EMERGENCIA: 'Emergència',
                    SALUD: 'Salut',
                    SOCIAL: 'Social'
                };

                doc.addPage('a4', 'landscape');
                pintarFons();
                pintarCapcalera(
                    [255, 100, 100],
                    'TELÈFONS D\'EMERGÈNCIA I AJUDA',
                    `${telefonos.length} números  ·  Catalunya  ·  ${dades.nom}`
                );

                const colsTel = 2;
                const margeX = 12;
                const margeY = 28;
                const gapX = 6;
                const gapY = 5;
                const cardW = (pageW - margeX * 2 - gapX * (colsTel - 1)) / colsTel;
                const cardH = 28;
                const files = Math.ceil(telefonos.length / colsTel);
                const alturaNecessaria = files * cardH + (files - 1) * gapY;
                const inicioY = margeY + Math.max(0, (pageH - margeY - 14 - alturaNecessaria) / 2);

                telefonos.forEach((t, i) => {
                    const col = i % colsTel;
                    const fila = Math.floor(i / colsTel);
                    const x = margeX + col * (cardW + gapX);
                    const y = inicioY + fila * (cardH + gapY);
                    const tipus = t.tipo || 'SOCIAL';
                    const color = colorsTipus[tipus] || C.cyan;

                    doc.setFillColor(...C.targeta);
                    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
                    doc.setFillColor(...color);
                    doc.roundedRect(x, y, 4, cardH, 2, 2, 'F');
                    doc.rect(x + 2, y, 2, cardH, 'F');

                    // Etiqueta de tipus
                    doc.setFillColor(...color);
                    doc.roundedRect(x + 8, y + 4, 28, 5.5, 1.5, 1.5, 'F');
                    doc.setTextColor(...C.fons);
                    doc.setFontSize(6);
                    doc.setFont(undefined, 'bold');
                    doc.text((etiquetesTipus[tipus] || tipus).toUpperCase(), x + 22, y + 7.8, { align: 'center' });

                    // Nom
                    doc.setTextColor(...C.blanc);
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(escurcarTextPdf(t.nombre_ca || '', 42), x + 8, y + 15);

                    // Número destacat
                    doc.setTextColor(...color);
                    doc.setFontSize(12);
                    doc.text(String(t.telefono || ''), x + cardW - 6, y + 15, { align: 'right' });

                    // Descripció
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(...C.muted);
                    const desc = doc.splitTextToSize(escurcarTextPdf(t.descripcion_ca || '', 110), cardW - 16);
                    doc.text(desc.slice(0, 2), x + 8, y + 21);
                });

                pintarPeu('En cas d\'urgència vital trucar al 112');
            }

            const nomFitxer = `LSTYLE-Infografia-${dades.nom.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
            doc.save(nomFitxer);
            window.app?.mostrarToast('PDF infografia descarregat', 'exit', 3000);

        } catch (err) {
            console.error('Error generant PDF:', err);
            window.app?.mostrarToast('Error generant el PDF. Torna-ho a provar.', 'error', 5000);
        }
    }

    // ============================================
    // EMMAGATZEMATGE LOCAL
    // ============================================

    /** Desa resultats i menú a sessionStorage */
    function desarResultatsLocals(dades, res) {
        try {
            sessionStorage.setItem('lstyle_resultats', JSON.stringify({
                dades,
                resultats: res,
                menuDieta,
                menuSeedOffset,
                data: new Date().toISOString()
            }));
        } catch (err) {
            console.warn('No s\'han pogut desar els resultats locals:', err);
        }
    }

    /**
     * Restaura l'última sessió de resultats (si n'hi ha a sessionStorage).
     * @returns {boolean} true si s'ha restaurat
     */
    function provarRestaurarSessio() {
        try {
            const raw = sessionStorage.getItem('lstyle_resultats');
            if (!raw) return false;

            const guardat = JSON.parse(raw);
            if (!guardat?.dades || !guardat?.resultats) return false;

            dadesUsuari = guardat.dades;
            resultatsCalcul = guardat.resultats;
            menuDieta = guardat.menuDieta || null;
            menuSeedOffset = Number.isFinite(guardat.menuSeedOffset) ? guardat.menuSeedOffset : 0;

            // Si falta el menú (o no hi ha aliments encara), regenerar amb el mateix seed
            if (!menuDieta?.menuSetmana?.length) {
                generarMenuDieta(dadesUsuari, resultatsCalcul, false);
            }

            renderitzarUI(dadesUsuari, resultatsCalcul);
            console.log('♻️ Sessió de resultats restaurada');
            return true;
        } catch (err) {
            console.warn('No s\'ha pogut restaurar la sessió:', err);
            return false;
        }
    }

    // ============================================
    // UTILITATS
    // ============================================

    function escaparHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /** Retorna els resultats de l'últim càlcul (per a Fase 3 — dieta) */
    function obtenirResultats() {
        return resultatsCalcul ? { ...resultatsCalcul } : null;
    }

    /** Retorna les dades de l'usuari de l'últim càlcul */
    function obtenirDadesUsuari() {
        return dadesUsuari ? { ...dadesUsuari } : null;
    }

    /** Retorna el menú setmanal generat */
    function obtenirMenuDieta() {
        return menuDieta ? JSON.parse(JSON.stringify(menuDieta)) : null;
    }

    /**
     * Construeix un resum textual del menú (per exportació o depuració).
     */
    function construirPromptDieta(dades, res) {
        const condicionsText = (dades.condicionsCodis || []).join(', ') || 'Cap';
        const estacio = menuDieta?.estacio || 'N/D';

        let resumMenu = 'Menú no generat';
        if (menuDieta?.menuSetmana?.length) {
            resumMenu = menuDieta.menuSetmana.map((dia) => {
                const apats = window.motorDieta.APATS.map((t) => {
                    const a = dia[t];
                    return `${a.nom}: ${a.descripcio} (${a.calories} kcal)`;
                }).join(' | ');
                return `${dia.nom}: ${apats}`;
            }).join('\n');
        }

        return `
Perfil: ${dades.nom}, ${dades.edat} anys, ${dades.dieta}
TDEE: ${res.tdee} kcal | Proteïna: ${res.proteina} g | Estació: ${estacio}
Condicions: ${condicionsText}

MENÚ SETMANAL:
${resumMenu}
`.trim();
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    return {
        inicialitzarResultats,
        mostrarResultats,
        calcularTot,
        obtenirResultats,
        obtenirDadesUsuari,
        obtenirMenuDieta,
        exportarPDF,
        construirPromptDieta,
        provarRestaurarSessio
    };

})();

window.resultats = resultats;

// Inicialitzar quan el DOM estigui llest
document.addEventListener('DOMContentLoaded', () => {
    resultats.inicialitzarResultats();
});
