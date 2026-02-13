/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Script Principal - app.js
 * ============================================
 */

'use strict';

// ============================================
// DADES GLOBALS
// ============================================
let dadesApp = {
    estacions:          [],
    categoriesAliments: [],
    aliments:           [],
    condicionsSalut:    [],
    consells:           [],
    telefonos:          [],
    rangosIMC:          [],
    formules:           [],
    factorsActivitat:   [],
    config:             null
};

// ============================================
// INICIALITZACIÓ
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciant LSTYLE-SENIORS-PLUS...');

    try {
        // 1. Inicialitzar client Supabase
        inicialitzarSupabase();

        // 2. Inicialitzar botó pantalla completa
        inicialitzarPantallaCompleta();

        // 3. Inicialitzar tooltips globals
        inicialitzarTooltips();

        // 4. Mostrar disclaimer (les dades es carreguen en clicar Continuar)
        setTimeout(() => {
            ocultarPantallaInici();
            mostrarPantalla('pantalla-disclaimer');
        }, 1500);

        // 5. Inicialitzar disclaimer
        inicialitzarDisclaimer();

        console.log('✅ App inicialitzada correctament');

    } catch (error) {
        console.error('❌ Error durant la inicialització:', error);
        ocultarPantallaInici();
        mostrarPantalla('pantalla-disclaimer');
    }
});

// ============================================
// SUPABASE
// ============================================

function inicialitzarSupabase() {
    try {
        window._supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            SUPABASE_CONFIG.options || {}
        );
        console.log('✅ Supabase inicialitzat');
    } catch (error) {
        console.error('❌ Error inicialitzant Supabase:', error);
        throw error;
    }
}

async function carregarDadesSupabase() {
    console.log('📦 Carregant dades des de Supabase...');

    const client = window._supabaseClient;

    try {
        const [
            estacions, categories, aliments,
            condicions, consells, telefonos,
            rangos, formules, factors, config
        ] = await Promise.all([
            client.from('estaciones').select('*').order('id'),
            client.from('categorias_alimentos').select('*').order('orden'),
            client.from('alimentos').select('*'),
            client.from('condiciones_salud').select('*').order('orden'),
            client.from('consejos_condiciones').select('*'),
            client.from('telefonos_emergencia').select('*').order('orden'),
            client.from('rangos_imc_seniors').select('*'),
            client.from('formulas_calculos').select('*'),
            client.from('factores_actividad').select('*'),
            client.from('config_app').select('*').eq('id', 1).single()
        ]);

        // Comprovar errors
        if (estacions.error)  throw new Error('estaciones: '          + estacions.error.message);
        if (categories.error) throw new Error('categorias_alimentos: ' + categories.error.message);
        if (aliments.error)   throw new Error('alimentos: '            + aliments.error.message);
        if (condicions.error) throw new Error('condiciones_salud: '    + condicions.error.message);
        if (consells.error)   throw new Error('consejos_condiciones: ' + consells.error.message);
        if (telefonos.error)  throw new Error('telefonos_emergencia: ' + telefonos.error.message);
        if (rangos.error)     throw new Error('rangos_imc_seniors: '   + rangos.error.message);
        if (formules.error)   throw new Error('formulas_calculos: '    + formules.error.message);
        if (factors.error)    throw new Error('factores_actividad: '   + factors.error.message);
        if (config.error)     throw new Error('config_app: '           + config.error.message);

        // Guardar dades globals
        dadesApp.estacions          = estacions.data    || [];
        dadesApp.categoriesAliments = categories.data   || [];
        dadesApp.aliments           = aliments.data     || [];
        dadesApp.condicionsSalut    = condicions.data   || [];
        dadesApp.consells           = consells.data     || [];
        dadesApp.telefonos          = telefonos.data    || [];
        dadesApp.rangosIMC          = rangos.data       || [];
        dadesApp.formules           = formules.data     || [];
        dadesApp.factorsActivitat   = factors.data      || [];
        dadesApp.config             = config.data;

        console.log('✅ Dades carregades:', {
            estacions:  dadesApp.estacions.length,
            aliments:   dadesApp.aliments.length,
            condicions: dadesApp.condicionsSalut.length,
            activitats: dadesApp.factorsActivitat.length
        });

    } catch (error) {
        console.error('❌ Error carregant dades:', error);
        throw error;
    }
}

// ============================================
// DISCLAIMER
// ============================================

function inicialitzarDisclaimer() {
    const checkbox     = document.getElementById('checkbox-acceptacio');
    const btnContinuar = document.getElementById('btn-continuar-disclaimer');

    if (!checkbox || !btnContinuar) {
        console.error('❌ Elements disclaimer no trobats');
        return;
    }

    // Activa/desactiva botó
    checkbox.addEventListener('change', () => {
        btnContinuar.disabled = !checkbox.checked;
    });

    // Clic Continuar → mostrar càrrega → carregar dades → formulari
    btnContinuar.addEventListener('click', async () => {
        try {
            // 1. Amagar disclaimer
            const pantallaDisclaimer = document.getElementById('pantalla-disclaimer');
            if (pantallaDisclaimer) pantallaDisclaimer.classList.add('ocult');

            // 2. Mostrar pantalla càrrega de dades
            const pantallaCarrega = document.getElementById('pantalla-carrega-dades');
            if (pantallaCarrega) pantallaCarrega.classList.remove('ocult');

            // 3. Carregar dades de Supabase
            await carregarDadesSupabase();

            // 4. Espera mínima per veure l'animació (mínim 1.5s)
            await esperar(1500);

            // 5. Amagar càrrega
            if (pantallaCarrega) {
                pantallaCarrega.classList.add('ocultar');
                await esperar(500);
                pantallaCarrega.classList.add('ocult');
                pantallaCarrega.classList.remove('ocultar');
            }

            // 6. Mostrar formulari
            mostrarPantalla('pantalla-entrada-dades');

            // 7. Inicialitzar formulari
            if (window.formulari && window.formulari.inicialitzarFormulari) {
                window.formulari.inicialitzarFormulari();
            }

        } catch (error) {
            console.error('❌ Error carregant dades:', error);

            // Si hi ha error, mostrar formulari igualment (amb dades buides)
            const pantallaCarrega = document.getElementById('pantalla-carrega-dades');
            if (pantallaCarrega) pantallaCarrega.classList.add('ocult');

            mostrarPantalla('pantalla-entrada-dades');

            if (window.formulari && window.formulari.inicialitzarFormulari) {
                window.formulari.inicialitzarFormulari();
            }
        }
    });
}

// ============================================
// GESTIÓ DE PANTALLES
// ============================================

function mostrarPantalla(idPantalla) {
    const pantalles = [
        'pantalla-disclaimer',
        'pantalla-carrega-dades',
        'pantalla-entrada-dades',
        'pantalla-resultats'
    ];

    pantalles.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('ocult');
    });

    const pantalla = document.getElementById(idPantalla);
    if (pantalla) {
        pantalla.classList.remove('ocult');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`❌ Pantalla "${idPantalla}" no trobada`);
    }
}

function ocultarPantallaInici() {
    const pantalla = document.getElementById('pantalla-inici');
    if (pantalla) {
        pantalla.classList.add('ocultar');
        setTimeout(() => {
            pantalla.style.display = 'none';
        }, 500);
    }
}

// ============================================
// PANTALLA COMPLETA
// ============================================

function inicialitzarPantallaCompleta() {
    const btn = document.getElementById('btn-pantalla-completa');
    if (!btn) return;

    btn.addEventListener('click', alternarPantallaCompleta);

    ['fullscreenchange', 'webkitfullscreenchange',
     'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
        document.addEventListener(ev, actualitzarBotoPantallaCompleta);
    });
}

function alternarPantallaCompleta() {
    const enPC = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement;

    if (!enPC) {
        const el = document.documentElement;
        if      (el.requestFullscreen)       el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
        else if (el.msRequestFullscreen)     el.msRequestFullscreen();
    } else {
        if      (document.exitFullscreen)       document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
        else if (document.msExitFullscreen)     document.msExitFullscreen();
    }
}

function actualitzarBotoPantallaCompleta() {
    const btn  = document.getElementById('btn-pantalla-completa');
    if (!btn) return;

    const enPC = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement;

    btn.innerHTML = enPC
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
           </svg>`;

    btn.title = enPC ? 'Sortir de pantalla completa' : 'Pantalla completa';
}

// ============================================
// TOOLTIPS
// ============================================

function inicialitzarTooltips() {
    const tooltipEl = document.getElementById('tooltip-global');
    if (!tooltipEl) return;

    document.addEventListener('mouseover', (e) => {
        const icona = e.target.closest('.tooltip-icona');
        if (!icona) return;

        const text = icona.dataset.tooltip;
        if (!text) return;

        tooltipEl.textContent = text;
        tooltipEl.classList.remove('ocult');

        posicionarTooltip(e, tooltipEl);
    });

    document.addEventListener('mousemove', (e) => {
        if (!tooltipEl.classList.contains('ocult')) {
            posicionarTooltip(e, tooltipEl);
        }
    });

    document.addEventListener('mouseout', (e) => {
        const icona = e.target.closest('.tooltip-icona');
        if (icona) {
            tooltipEl.classList.add('ocult');
        }
    });
}

function posicionarTooltip(e, tooltipEl) {
    const marge   = 14;
    const ampTool = tooltipEl.offsetWidth  || 280;
    const altTool = tooltipEl.offsetHeight || 80;
    const ampFin  = window.innerWidth;
    const altFin  = window.innerHeight;

    let x = e.clientX + marge;
    let y = e.clientY + marge;

    if (x + ampTool > ampFin - marge) x = e.clientX - ampTool - marge;
    if (y + altTool > altFin - marge) y = e.clientY - altTool - marge;

    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top  = y + 'px';
}

// ============================================
// UTILITATS
// ============================================

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function obtenirEstacioActual() {
    const avui   = new Date();
    const mes    = String(avui.getMonth() + 1).padStart(2, '0');
    const dia    = String(avui.getDate()).padStart(2, '0');
    const data   = `${mes}-${dia}`;

    for (const estacio of dadesApp.estacions) {
        if (data >= estacio.fecha_inicio && data <= estacio.fecha_fin) {
            return estacio;
        }
    }
    return dadesApp.estacions[0] || null;
}

// ============================================
// EXPORTAR GLOBALS
// ============================================
window.app = {
    mostrarPantalla,
    obtenirEstacioActual,
    dadesApp
};