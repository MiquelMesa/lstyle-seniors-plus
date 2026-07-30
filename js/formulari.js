/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Mòdul del formulari d'entrada de dades
 * ============================================
 *
 * QUÈ FA AQUEST FITXER?
 * - Carrega condicions de salut i activitat física des de l'API (dadesApp)
 * - Valida els camps en temps real i mostra errors amigables
 * - Calcula mitjanes quan l'usuari introdueix un rang (mínim/màxim)
 * - Actualitza la barra de progrés (6 seccions)
 * - Envia les dades netes a resultats.js quan tot és correcte
 *
 * PATRÓ: IIFE (funció autoexecutada) per no contaminar l'àmbit global
 * excepte window.formulari, que app.js necessita cridar.
 */

'use strict';

const formulari = (() => {

    // ============================================
    // ESTAT PRIVAT DEL MÒDUL
    // ============================================

    /** Dades recollides de l'últim enviament vàlid */
    let dadesFormulari = {};

    /** Evita registrar els mateixos esdeveniments dues vegades */
    let jaInicialitzat = false;

    /** Claus de les 6 seccions (coincideixen amb data-seccio del HTML) */
    const SECCIONS = ['personals', 'fisiques', 'pressio', 'condicions', 'activitat', 'habits'];

    /** Referència al formulari del DOM */
    const form = () => document.getElementById('formulari-dades');

    /** Accés a les dades globals carregades per app.js */
    const obtenirDadesApp = () => (window.app && window.app.dadesApp) ? window.app.dadesApp : {};

    // ============================================
    // INICIALITZACIÓ PRINCIPAL
    // ============================================

    /**
     * Punt d'entrada: app.js crida aquesta funció en obrir la pantalla del formulari.
     */
    function inicialitzarFormulari() {
        console.log('📋 Inicialitzant formulari...');

        carregarCondicionsSalut();
        carregarActivitatFisica();

        if (!jaInicialitzat) {
            registrarEsdeveniments();
            jaInicialitzat = true;
        }

        actualitzarProgressBar();
        actualitzarEstilsHabits();

        if (window.lucide) {
            lucide.createIcons();
        }

        console.log('✅ Formulari llest');
    }

    /**
     * Registra listeners del formulari, botons i modal (només una vegada).
     */
    function registrarEsdeveniments() {
        const elForm = form();
        if (!elForm) {
            console.error('❌ No s\'ha trobat #formulari-dades');
            return;
        }

        // Enviament del formulari
        elForm.addEventListener('submit', gestionarEnviament);

        // Validació en temps real quan l'usuari surt d'un camp
        elForm.addEventListener('focusout', (e) => {
            if (e.target.matches('input, select, textarea')) {
                validarCamp(e.target);
                actualitzarProgressBar();
            }
        });

        // Actualització immediata en escriure (nom, números, pressió)
        elForm.addEventListener('input', (e) => {
            const id = e.target.id;
            if (id && (id.includes('-min') || id.includes('-max') || id.startsWith('pressio') || id === 'frequencia' || id === 'nom')) {
                validarCamp(e.target);
                actualitzarProgressBar();
            }
            if (id === 'pressio-max') {
                actualitzarBarraPressio('pressio-max', 'barra-pressio-max', true);
            }
            if (id === 'pressio-min') {
                actualitzarBarraPressio('pressio-min', 'barra-pressio-min', false);
            }
            if (id === 'frequencia') {
                actualitzarBarraFrequencia();
            }
        });

        // Canvis en radio/checkbox
        elForm.addEventListener('change', (e) => {
            if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
                actualitzarEstilsHabits();
                actualitzarEstilsCondicions();
                actualitzarEstilsActivitat();
                actualitzarProgressBar();
            }
        });

        // Clic a la targeta sencera per marcar condició / activitat
        document.getElementById('contenidor-condicions')?.addEventListener('click', (e) => {
            const item = e.target.closest('.condicio-item');
            if (!item || e.target.tagName === 'INPUT') return;
            const cb = item.querySelector('input[type="checkbox"]');
            if (cb) {
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        document.getElementById('contenidor-activitat')?.addEventListener('click', (e) => {
            const item = e.target.closest('.activitat-item');
            if (!item || e.target.tagName === 'INPUT') return;
            const radio = item.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Botó netejar + modal
        document.getElementById('btn-netejar')?.addEventListener('click', obrirModalNetejar);
        document.getElementById('modal-cancelar')?.addEventListener('click', tancarModalNetejar);
        document.getElementById('modal-confirmar')?.addEventListener('click', () => {
            tancarModalNetejar();
            netejarFormulari();
        });
        document.getElementById('modal-netejar')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-netejar') {
                tancarModalNetejar();
            }
        });
    }

    // ============================================
    // CÀRREGA DINÀMICA DES DE LA BASE DE DADES
    // ============================================

    /**
     * Renderitza les checkboxes de condicions de salut des de dadesApp.condicionsSalut.
     */
    function carregarCondicionsSalut() {
        const contenidor = document.getElementById('contenidor-condicions');
        if (!contenidor) return;

        const condicions = obtenirDadesApp().condicionsSalut || [];

        if (condicions.length === 0) {
            contenidor.innerHTML = '<p class="text-secundari">No s\'han pogut carregar les condicions. Comprova la connexió amb l\'API.</p>';
            return;
        }

        const ordenades = [...condicions].sort((a, b) => (a.orden || 0) - (b.orden || 0));

        contenidor.innerHTML = ordenades.map((c) => `
            <label class="condicio-item" data-condicio-id="${c.id}">
                <input
                    type="checkbox"
                    name="condicions"
                    value="${c.id}"
                    data-codi="${escaparHtml(c.codigo || '')}"
                >
                <span class="condicio-label">${escaparHtml(c.nombre_ca)}</span>
            </label>
        `).join('');
    }

    /**
     * Renderitza les opcions d'activitat física des de dadesApp.factorsActivitat.
     */
    function carregarActivitatFisica() {
        const contenidor = document.getElementById('contenidor-activitat');
        if (!contenidor) return;

        const factors = obtenirDadesApp().factorsActivitat || [];

        if (factors.length === 0) {
            contenidor.innerHTML = '<p class="text-secundari">No s\'han pogut carregar els nivells d\'activitat.</p>';
            return;
        }

        const ordenats = [...factors].sort((a, b) => (a.id || 0) - (b.id || 0));

        contenidor.innerHTML = ordenats.map((f) => `
            <label class="activitat-item" data-activitat-id="${f.id}">
                <input
                    type="radio"
                    name="activitat"
                    value="${f.id}"
                    data-factor="${f.factor_tmb}"
                    data-nivell="${escaparHtml(f.nivel || '')}"
                    required
                >
                <div class="activitat-text">
                    <span class="activitat-nom">${escaparHtml(f.nombre_ca)}</span>
                    <span class="activitat-desc">${escaparHtml(f.descripcion_ca || '')} · Factor TMB: ×${f.factor_tmb}</span>
                </div>
            </label>
        `).join('');
    }

    // ============================================
    // CÀLCUL DE MITJANES (RANGS)
    // ============================================

    /**
     * Calcula la mitjana d'un rang numèric.
     * Si només hi ha un valor (mínim o màxim), retorna aquest.
     * Si ambdós estan buits, retorna null.
     *
     * @param {string} idMin - ID de l'input mínim
     * @param {string} idMax - ID de l'input màxim
     * @returns {number|null}
     */
    function calcularMitjaRang(idMin, idMax) {
        const elMin = document.getElementById(idMin);
        const elMax = document.getElementById(idMax);
        const min = parseFloat(elMin?.value);
        const max = parseFloat(elMax?.value);

        const teMin = !isNaN(min);
        const teMax = !isNaN(max);

        if (teMin && teMax) {
            return (min + max) / 2;
        }
        if (teMin) return min;
        if (teMax) return max;
        return null;
    }

    // ============================================
    // VALIDACIÓ
    // ============================================

    /**
     * Valida un camp individual i actualitza la UI d'error.
     * @param {HTMLElement} camp
     * @returns {boolean}
     */
    function validarCamp(camp) {
        if (!camp || !camp.id) return true;

        const id = camp.id;
        let missatge = '';

        switch (id) {
            case 'nom':
                missatge = validarNom(camp.value);
                break;
            case 'sexe':
                missatge = camp.value ? '' : 'Selecciona el sexe';
                break;
            case 'edat':
                missatge = validarEdat(camp.value);
                break;
            case 'alcada-min':
            case 'alcada-max':
                missatge = validarRangObligatori('alcada-min', 'alcada-max', 100, 250, 'cm', true);
                break;
            case 'pes-min':
            case 'pes-max':
                missatge = validarRangObligatori('pes-min', 'pes-max', 30, 300, 'kg', true);
                break;
            case 'cintura-min':
            case 'cintura-max':
                missatge = validarRangOpcional('cintura-min', 'cintura-max', 40, 200, 'cm');
                break;
            case 'maluc-min':
            case 'maluc-max':
                missatge = validarRangOpcional('maluc-min', 'maluc-max', 40, 200, 'cm');
                break;
            case 'pressio-max':
                missatge = validarNumeroOpcional(camp.value, 60, 250, 'La pressió màxima');
                break;
            case 'pressio-min':
                missatge = validarNumeroOpcional(camp.value, 40, 150, 'La pressió mínima');
                break;
            case 'frequencia':
                missatge = validarNumeroOpcional(camp.value, 40, 200, 'La freqüència cardíaca');
                break;
            default:
                return true;
        }

        const errorId = obtenirIdError(id);
        if (missatge) {
            mostrarError(errorId, missatge);
            camp.classList.remove('camp-valid');
            camp.setAttribute('aria-invalid', 'true');
            return false;
        }

        netejarError(errorId);
        if (camp.value !== '' || camp.required) {
            camp.classList.add('camp-valid');
        }
        camp.removeAttribute('aria-invalid');
        return true;
    }

    /**
     * Valida una secció sencera del formulari.
     * @param {string} seccio - personals | fisiques | pressio | condicions | activitat | habits
     * @returns {boolean}
     */
    function validarSeccio(seccio) {
        switch (seccio) {
            case 'personals':
                return validarCamp(document.getElementById('nom'))
                    && validarCamp(document.getElementById('sexe'))
                    && validarCamp(document.getElementById('edat'));

            case 'fisiques':
                // Obligatori: alçada i pes. Cintura/maluc opcionals (per a l'ICC)
                return validarCamp(document.getElementById('alcada-min'))
                    && validarCamp(document.getElementById('pes-min'))
                    && validarCamp(document.getElementById('cintura-min'))
                    && validarCamp(document.getElementById('maluc-min'));

            case 'pressio': {
                const okMax = validarCamp(document.getElementById('pressio-max'));
                const okMin = validarCamp(document.getElementById('pressio-min'));
                const okFreq = validarCamp(document.getElementById('frequencia'));
                const sist = parseFloat(document.getElementById('pressio-max')?.value);
                const diast = parseFloat(document.getElementById('pressio-min')?.value);
                if (!isNaN(sist) && !isNaN(diast) && sist <= diast) {
                    mostrarError('error-pressio', 'La pressió màxima ha de ser superior a la mínima');
                    return false;
                }
                netejarError('error-pressio');
                return okMax && okMin && okFreq;
            }

            case 'condicions':
                // Cap condició és obligatòria
                return true;

            case 'activitat': {
                const seleccionat = document.querySelector('input[name="activitat"]:checked');
                if (!seleccionat) {
                    mostrarError('error-activitat', 'Selecciona el teu nivell d\'activitat física');
                    return false;
                }
                netejarError('error-activitat');
                return true;
            }

            case 'habits': {
                const fumador = document.querySelector('input[name="fumador"]:checked');
                const dieta = document.querySelector('input[name="dieta"]:checked');
                const alcohol = document.querySelector('input[name="alcohol"]:checked');
                const son = document.querySelector('input[name="son"]:checked');
                if (!fumador || !dieta || !alcohol || !son) {
                    return false;
                }
                return true;
            }

            default:
                return false;
        }
    }

    /** Valida totes les seccions abans d'enviar */
    function validarTotElFormulari() {
        let totOk = true;
        let primeraSeccioFallida = null;

        for (const seccio of SECCIONS) {
            if (!validarSeccio(seccio)) {
                totOk = false;
                if (!primeraSeccioFallida) {
                    primeraSeccioFallida = seccio;
                }
            }
        }

        if (!totOk) {
            desplacarASeccio(primeraSeccioFallida);
            window.app?.mostrarToast(
                'Revisa les dades marcades. Alguns camps necessiten la teva atenció.',
                'error',
                5000
            );
        }

        return totOk;
    }

    // --- Helpers de validació ---

    function validarNom(valor) {
        const net = (valor || '').trim();
        if (net.length < 2) {
            return 'Introdueix el teu nom (mínim 2 lletres)';
        }
        if (net.length > 100) {
            return 'El nom és massa llarg (màxim 100 caràcters)';
        }
        if (!/^[\p{L}\s.'\-]+$/u.test(net)) {
            return 'El nom només pot contenir lletres i espais';
        }
        return '';
    }

    function validarEdat(valor) {
        const edat = parseInt(valor, 10);
        if (isNaN(edat)) return 'Introdueix l\'edat en anys';
        if (edat < 60) return 'Aquesta aplicació està pensada per a persones de 60 anys o més';
        if (edat > 120) return 'L\'edat ha de ser realista (màxim 120)';
        return '';
    }

    function validarRangObligatori(idMin, idMax, minPermes, maxPermes, unitat, minObligatori) {
        const elMin = document.getElementById(idMin);
        const elMax = document.getElementById(idMax);
        const vMin = parseFloat(elMin?.value);
        const vMax = parseFloat(elMax?.value);
        const teMin = !isNaN(vMin);
        const teMax = !isNaN(vMax);

        if (minObligatori && !teMin && !teMax) {
            return `Introdueix un valor en ${unitat}`;
        }

        if (teMin && (vMin < minPermes || vMin > maxPermes)) {
            return `El valor ha d'estar entre ${minPermes} i ${maxPermes} ${unitat}`;
        }
        if (teMax && (vMax < minPermes || vMax > maxPermes)) {
            return `El valor ha d'estar entre ${minPermes} i ${maxPermes} ${unitat}`;
        }
        if (teMin && teMax && vMax < vMin) {
            return 'El valor màxim no pot ser inferior al mínim';
        }
        return '';
    }

    function validarRangOpcional(idMin, idMax, minPermes, maxPermes, unitat) {
        const elMin = document.getElementById(idMin);
        const elMax = document.getElementById(idMax);
        const vMin = parseFloat(elMin?.value);
        const vMax = parseFloat(elMax?.value);
        const teMin = !isNaN(vMin);
        const teMax = !isNaN(vMax);

        if (!teMin && !teMax) return '';

        return validarRangObligatori(idMin, idMax, minPermes, maxPermes, unitat, false);
    }

    function validarNumeroOpcional(valor, min, max, etiqueta) {
        if (valor === '' || valor === null || valor === undefined) return '';
        const num = parseFloat(valor);
        if (isNaN(num)) return `${etiqueta} ha de ser un número`;
        if (num < min || num > max) return `${etiqueta} ha d'estar entre ${min} i ${max}`;
        return '';
    }

    // ============================================
    // BARRA DE PROGRÉS
    // ============================================

    /**
     * Actualitza els 6 segments i les targetes de secció:
     * es coloregen a mesura que s'introdueixen dades vàlides.
     */
    function actualitzarProgressBar() {
        let completades = 0;
        const mapaTargetes = {
            personals: 'targeta-personals',
            fisiques: 'targeta-fisiques',
            pressio: 'targeta-pressio',
            condicions: 'targeta-condicions',
            activitat: 'targeta-activitat',
            habits: 'targeta-habits'
        };

        SECCIONS.forEach((seccio) => {
            const segment = document.querySelector(`.progres-segment[data-seccio="${seccio}"]`);
            const targeta = document.getElementById(mapaTargetes[seccio]);
            const completa = seccioCompletadaVisualment(seccio);
            if (completa) completades++;
            if (segment) segment.classList.toggle('actiu', completa);
            if (targeta) targeta.classList.toggle('seccio-completa', completa);
        });

        const comptador = document.getElementById('progres-completat');
        if (comptador) {
            comptador.textContent = String(completades);
        }
    }

    /**
     * Criteri visual de coloració (progressiu amb les dades introduïdes).
     * Les seccions opcionals només es coloregen quan hi ha dades.
     */
    function seccioCompletadaVisualment(seccio) {
        switch (seccio) {
            case 'personals':
            case 'activitat':
            case 'habits':
                return validarSeccio(seccio);

            case 'fisiques': {
                // Color quan alçada + pes són vàlids (obligatoris)
                return validarCamp(document.getElementById('alcada-min'))
                    && !!(document.getElementById('alcada-min')?.value)
                    && validarCamp(document.getElementById('pes-min'))
                    && !!(document.getElementById('pes-min')?.value);
            }

            case 'pressio': {
                const teDades = ['pressio-max', 'pressio-min', 'frequencia']
                    .some((id) => document.getElementById(id)?.value !== '');
                return teDades && validarSeccio('pressio');
            }

            case 'condicions': {
                return document.querySelectorAll('input[name="condicions"]:checked').length > 0;
            }

            default:
                return false;
        }
    }

    // ============================================
    // PRESSIÓ ARTERIAL — BARRES VISUALS
    // ============================================

    function actualitzarBarraPressio(inputId, barraId, esSistolica) {
        const input = document.getElementById(inputId);
        const barra = document.getElementById(barraId);
        if (!input || !barra) return;

        const valor = parseFloat(input.value);
        barra.classList.remove('normal', 'alta', 'baixa');

        if (isNaN(valor)) return;

        if (esSistolica) {
            if (valor < 120) barra.classList.add('normal');
            else if (valor < 140) barra.classList.add('baixa');
            else barra.classList.add('alta');
        } else {
            if (valor < 80) barra.classList.add('normal');
            else if (valor < 90) barra.classList.add('baixa');
            else barra.classList.add('alta');
        }
    }

    function actualitzarBarraFrequencia() {
        const input = document.getElementById('frequencia');
        const barra = document.getElementById('barra-frequencia');
        if (!input || !barra) return;

        const valor = parseFloat(input.value);
        barra.classList.remove('normal', 'alta', 'baixa');

        if (isNaN(valor)) return;

        if (valor >= 60 && valor <= 100) barra.classList.add('normal');
        else if (valor < 60) barra.classList.add('baixa');
        else barra.classList.add('alta');
    }

    // ============================================
    // ESTILS DINÀMICS (SELECCIONAT)
    // ============================================

    function actualitzarEstilsCondicions() {
        document.querySelectorAll('.condicio-item').forEach((item) => {
            const cb = item.querySelector('input[type="checkbox"]');
            item.classList.toggle('seleccionat', cb && cb.checked);
        });
    }

    function actualitzarEstilsActivitat() {
        document.querySelectorAll('.activitat-item').forEach((item) => {
            const radio = item.querySelector('input[type="radio"]');
            item.classList.toggle('seleccionat', radio && radio.checked);
        });
    }

    function actualitzarEstilsHabits() {
        document.querySelectorAll('.habit-opcio').forEach((opcio) => {
            const input = opcio.querySelector('input');
            const actiu = input && (
                (input.type === 'radio' && input.checked) ||
                (input.type === 'checkbox' && input.checked)
            );
            opcio.classList.toggle('seleccionat', actiu);
        });
    }

    // ============================================
    // ERRORS A LA UI
    // ============================================

    function obtenirIdError(campId) {
        const mapa = {
            'alcada-min': 'error-alcada',
            'alcada-max': 'error-alcada',
            'pes-min': 'error-pes',
            'pes-max': 'error-pes',
            'pressio-max': 'error-pressio',
            'pressio-min': 'error-pressio'
        };
        return mapa[campId] || `error-${campId}`;
    }

    function mostrarError(idError, missatge) {
        const el = document.getElementById(idError);
        if (el) {
            el.textContent = missatge;
            el.style.display = 'block';
        }
    }

    function netejarError(idError) {
        const el = document.getElementById(idError);
        if (el) {
            el.textContent = '';
            el.style.display = '';
        }
    }

    function netejarTotsErrors() {
        document.querySelectorAll('.camp-error').forEach((el) => {
            el.textContent = '';
            el.style.display = '';
        });
    }

    // ============================================
    // RECOLLIDA DE DADES
    // ============================================

    /**
     * Construeix l'objecte net que consumirà resultats.js.
     * @returns {Object}
     */
    function recollirDadesFormulari() {
        const activitatRadio = document.querySelector('input[name="activitat"]:checked');
        const factorActivitat = activitatRadio
            ? parseFloat(activitatRadio.dataset.factor)
            : null;

        const condicionsIds = [...document.querySelectorAll('input[name="condicions"]:checked')]
            .map((cb) => parseInt(cb.value, 10));

        const condicionsCodis = [...document.querySelectorAll('input[name="condicions"]:checked')]
            .map((cb) => cb.dataset.codi)
            .filter(Boolean);

        const intolerancies = [...document.querySelectorAll('input[name="intolerancias"]:checked')]
            .map((cb) => cb.value);

        const alergies = [...document.querySelectorAll('input[name="alergies"]:checked')]
            .map((cb) => cb.value);

        const alergiesAltres = parsejarAlergiesAltres(
            document.getElementById('alergies-altres')?.value || ''
        );

        const fumadorVal = document.querySelector('input[name="fumador"]:checked')?.value;

        const dades = {
            nom: (document.getElementById('nom')?.value || '').trim(),
            sexe: document.getElementById('sexe')?.value || '',
            edat: parseInt(document.getElementById('edat')?.value, 10),

            alcada: calcularMitjaRang('alcada-min', 'alcada-max'),
            pes: calcularMitjaRang('pes-min', 'pes-max'),
            cintura: calcularMitjaRang('cintura-min', 'cintura-max'),
            maluc: calcularMitjaRang('maluc-min', 'maluc-max'),

            pressioMax: parseOpcional('pressio-max'),
            pressioMin: parseOpcional('pressio-min'),
            frequencia: parseOpcional('frequencia'),

            condicions: condicionsIds,
            condicionsCodis: condicionsCodis,

            activitatId: activitatRadio ? parseInt(activitatRadio.value, 10) : null,
            activitatNivell: activitatRadio?.dataset.nivell || null,
            factorActivitat: factorActivitat,

            fumador: fumadorVal === 'si',
            dieta: document.querySelector('input[name="dieta"]:checked')?.value || '',
            alcohol: document.querySelector('input[name="alcohol"]:checked')?.value || '',
            son: document.querySelector('input[name="son"]:checked')?.value || '',
            intolerancies: intolerancies,
            alergies: alergies,
            alergiesAltres: alergiesAltres,

            dataEnviament: new Date().toISOString()
        };

        dadesFormulari = dades;
        return dades;
    }

    function parseOpcional(id) {
        const v = parseFloat(document.getElementById(id)?.value);
        return isNaN(v) ? null : v;
    }

    /** Separa "maduixes, carbassó, tomàquet" en una llista neta */
    function parsejarAlergiesAltres(text) {
        return String(text || '')
            .split(/[,;|/]+/)
            .map((t) => t.trim())
            .filter((t) => t.length >= 2);
    }

    // ============================================
    // ENVIAMENT I EMMAGATZEMATGE
    // ============================================

    async function gestionarEnviament(e) {
        e.preventDefault();

        if (!validarTotElFormulari()) {
            return;
        }

        const dades = recollirDadesFormulari();

        // Validació extra amb el mòdul de seguretat (si està disponible)
        if (window.Seguretat && typeof Seguretat.validarDadesUsuari === 'function') {
            const perSeguretat = {
                nom: dades.nom,
                edat: dades.edat,
                alcada: dades.alcada,
                pes: dades.pes,
                perimetreCintura: dades.cintura,
                pressioMax: dades.pressioMax,
                pressioMin: dades.pressioMin,
                frequenciaCardiaca: dades.frequencia
            };
            const resultat = Seguretat.validarDadesUsuari(perSeguretat);
            if (!resultat.valid) {
                window.app?.mostrarToast(resultat.errors[0], 'error', 5000);
                return;
            }
        }

        // Desar còpia local xifrada (privacitat: només al navegador de l'usuari)
        await desarDadesLocals(dades);

        console.log('📊 Dades del formulari recollides:', dades);

        // Passar a resultats.js
        if (window.resultats && typeof window.resultats.mostrarResultats === 'function') {
            window.resultats.mostrarResultats(dades);
            window.app?.mostrarPantalla('pantalla-resultats');
        } else {
            window.app?.mostrarToast(
                'Dades guardades, però el mòdul de resultats no està carregat. Refresca la pàgina.',
                'error',
                5000
            );
            sessionStorage.setItem('lstyle_dades_usuari', JSON.stringify(dades));
        }
    }

    /**
     * Desa les dades a sessionStorage (còpia de sessió + opcionalment xifrada).
     */
    async function desarDadesLocals(dades) {
        try {
            const json = JSON.stringify(dades);
            // Còpia de sessió per poder restaurar el formulari en recarregar
            sessionStorage.setItem('lstyle_dades_usuari', json);
            if (window.Seguretat && typeof Seguretat.xifrar === 'function') {
                const xifrat = await Seguretat.xifrar(json);
                sessionStorage.setItem('lstyle_dades_xifrades', xifrat);
            }
        } catch (err) {
            console.warn('No s\'han pogut desar les dades locals:', err);
        }
    }

    // ============================================
    // NETEJA DEL FORMULARI
    // ============================================

    function obrirModalNetejar() {
        const modal = document.getElementById('modal-netejar');
        if (modal) {
            modal.classList.remove('ocult');
            if (window.lucide) lucide.createIcons();
        }
    }

    function tancarModalNetejar() {
        document.getElementById('modal-netejar')?.classList.add('ocult');
    }

    function netejarFormulari(opcions = {}) {
        const elForm = form();
        if (elForm) {
            elForm.reset();
        }

        // Camp de text d'al·lèrgies (reset() no sempre el buida si s'ha tocat via JS)
        const altres = document.getElementById('alergies-altres');
        if (altres) altres.value = '';

        netejarTotsErrors();
        document.querySelectorAll('.camp-valid').forEach((el) => el.classList.remove('camp-valid'));

        ['barra-pressio-max', 'barra-pressio-min', 'barra-frequencia'].forEach((id) => {
            document.getElementById(id)?.classList.remove('normal', 'alta', 'baixa');
        });

        actualitzarEstilsCondicions();
        actualitzarEstilsActivitat();
        actualitzarEstilsHabits();
        actualitzarProgressBar();

        dadesFormulari = {};
        sessionStorage.removeItem('lstyle_dades_usuari');
        sessionStorage.removeItem('lstyle_dades_xifrades');

        if (!opcions.silenci) {
            window.app?.mostrarToast('Formulari netejat', 'exit', 3000);
        }
    }

    /**
     * Omple el formulari amb dades guardades (sessionStorage).
     */
    function omplirDesDeDades(dades) {
        if (!dades) return;

        const setVal = (id, valor) => {
            const el = document.getElementById(id);
            if (el && valor != null && valor !== '') el.value = valor;
        };

        setVal('nom', dades.nom);
        setVal('sexe', dades.sexe);
        setVal('edat', dades.edat);
        setVal('alcada-min', dades.alcada);
        setVal('pes-min', dades.pes);
        if (dades.cintura != null) setVal('cintura-min', dades.cintura);
        if (dades.maluc != null) setVal('maluc-min', dades.maluc);
        if (dades.pressioMax != null) setVal('pressio-max', dades.pressioMax);
        if (dades.pressioMin != null) setVal('pressio-min', dades.pressioMin);
        if (dades.frequencia != null) setVal('frequencia', dades.frequencia);

        document.querySelectorAll('input[name="condicions"]').forEach((cb) => {
            cb.checked = (dades.condicions || []).map(String).includes(String(cb.value));
        });

        if (dades.activitatId != null) {
            const radio = document.querySelector(`input[name="activitat"][value="${dades.activitatId}"]`);
            if (radio) radio.checked = true;
        }

        const marcarRadio = (name, valor) => {
            if (valor == null || valor === '') return;
            const v = name === 'fumador' ? (valor === true || valor === 'si' ? 'si' : 'no') : valor;
            const radio = document.querySelector(`input[name="${name}"][value="${v}"]`);
            if (radio) radio.checked = true;
        };
        marcarRadio('fumador', dades.fumador);
        marcarRadio('dieta', dades.dieta);
        marcarRadio('alcohol', dades.alcohol);
        marcarRadio('son', dades.son);

        document.querySelectorAll('input[name="intolerancias"]').forEach((cb) => {
            cb.checked = (dades.intolerancies || []).includes(cb.value);
        });
        document.querySelectorAll('input[name="alergies"]').forEach((cb) => {
            cb.checked = (dades.alergies || []).includes(cb.value);
        });
        if (dades.alergiesAltres?.length) {
            setVal('alergies-altres', dades.alergiesAltres.join(', '));
        }

        actualitzarEstilsCondicions();
        actualitzarEstilsActivitat();
        actualitzarEstilsHabits();
        actualitzarProgressBar();
        dadesFormulari = { ...dades };
    }

    /** Intenta restaurar dades del formulari des de sessionStorage */
    function provarRestaurarDades() {
        try {
            const raw = sessionStorage.getItem('lstyle_dades_usuari');
            if (!raw) return false;
            const dades = JSON.parse(raw);
            if (!dades?.nom) return false;
            omplirDesDeDades(dades);
            window.app?.mostrarToast('S\'han restaurat les dades del formulari', 'info', 3500);
            return true;
        } catch (err) {
            console.warn('No s\'han pogut restaurar les dades del formulari:', err);
            return false;
        }
    }

    // ============================================
    // UTILITATS
    // ============================================

    function desplacarASeccio(seccio) {
        const mapaTargetes = {
            personals: 'targeta-personals',
            fisiques: 'targeta-fisiques',
            pressio: 'targeta-pressio',
            condicions: 'targeta-condicions',
            activitat: 'targeta-activitat',
            habits: 'targeta-habits'
        };
        const targeta = document.getElementById(mapaTargetes[seccio]);
        if (targeta) {
            targeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function escaparHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function obtenirDades() {
        return { ...dadesFormulari };
    }

    // ============================================
    // API PÚBLICA DEL MÒDUL
    // ============================================

    return {
        inicialitzarFormulari,
        obtenirDades,
        netejarFormulari,
        validarSeccio,
        recollirDadesFormulari,
        calcularMitjaRang,
        omplirDesDeDades,
        provarRestaurarDades
    };

})();

window.formulari = formulari;
