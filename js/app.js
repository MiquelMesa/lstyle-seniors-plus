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
        // 1. Comprovar connexió amb l'API
        await comprovarConnexioAPI();

        // 2. Inicialitzar botó pantalla completa + zoom
        inicialitzarPantallaCompleta();
        inicialitzarZoom();

        // 3. Inicialitzar tooltips globals
        inicialitzarTooltips();

        // 4. Mostrar disclaimer (les dades es carreguen en clicar Continuar)
        setTimeout(() => {
            ocultarPantallaInici();
            mostrarPantalla('pantalla-disclaimer');
        }, 1500);

        // 5. Inicialitzar disclaimer
        inicialitzarDisclaimer();

        // 6. Inicialitzar context temporal (data/hora/estació)
        inicialitzarContextTemporal();

        // 7. Inicialitzar icones Lucide
        if (window.lucide) lucide.createIcons();

        console.log('✅ App inicialitzada correctament');

    } catch (error) {
        console.error('❌ Error durant la inicialització:', error);
        ocultarPantallaInici();
        mostrarPantalla('pantalla-disclaimer');
    }
});

// ============================================
// API REST (MariaDB - Hostinger)
// ============================================

async function comprovarConnexioAPI() {
    try {
        const connectat = await ApiClient.comprovarConnexio();
        if (connectat) {
            console.log('✅ Connexió amb API establerta');
        } else {
            console.warn('⚠️ No s\'ha pogut connectar amb l\'API');
        }
    } catch (error) {
        console.error('❌ Error comprovant connexió API:', error);
        // No fem throw per permetre que l'app carregui igualment
    }
}

async function carregarDadesAPI() {
    console.log('📦 Carregant dades des de l\'API...');

    try {
        const dades = await ApiClient.carregarDadesInicials();

        // Guardar dades globals
        dadesApp.estacions          = dades.estacions       || [];
        dadesApp.categoriesAliments = dades.categories      || [];
        dadesApp.aliments           = dades.aliments        || [];
        dadesApp.condicionsSalut    = dades.condicions      || [];
        dadesApp.consells           = dades.consells        || [];
        dadesApp.telefonos          = dades.telefonos       || [];
        dadesApp.rangosIMC          = dades.rangosImc       || [];
        dadesApp.formules           = dades.formules        || [];
        dadesApp.factorsActivitat   = dades.activitats      || [];
        dadesApp.config             = dades.config;

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

            // 3. Carregar dades de l'API
            await carregarDadesAPI();

            // 4. Espera mínima per veure l'animació (mínim 1.5s)
            await esperar(1500);

            // 5. Amagar càrrega
            if (pantallaCarrega) {
                pantallaCarrega.classList.add('ocultar');
                await esperar(500);
                pantallaCarrega.classList.add('ocult');
                pantallaCarrega.classList.remove('ocultar');
            }

            // 6. Sempre inicialitzar formulari (per «Nou càlcul» i restauració)
            if (window.formulari && window.formulari.inicialitzarFormulari) {
                window.formulari.inicialitzarFormulari();
            }

            // 7. Restaurar sessió prèvia o anar al formulari
            const restaurat = window.resultats && typeof window.resultats.provarRestaurarSessio === 'function'
                ? window.resultats.provarRestaurarSessio()
                : false;

            if (restaurat) {
                mostrarPantalla('pantalla-resultats');
                setTimeout(() => {
                    mostrarToast('S\'ha restaurat l\'última sessió d\'aquesta pestanya', 'info', 4000);
                }, 600);
            } else {
                mostrarPantalla('pantalla-entrada-dades');
                window.formulari?.provarRestaurarDades?.();
            }

        } catch (error) {
            console.error('❌ Error carregant dades:', error);

            // Si hi ha error, mostrar formulari igualment (amb dades buides)
            const pantallaCarrega = document.getElementById('pantalla-carrega-dades');
            if (pantallaCarrega) pantallaCarrega.classList.add('ocult');

            if (window.formulari && window.formulari.inicialitzarFormulari) {
                window.formulari.inicialitzarFormulari();
            }

            const restaurat = window.resultats?.provarRestaurarSessio?.() || false;
            if (restaurat) {
                mostrarPantalla('pantalla-resultats');
            } else {
                mostrarPantalla('pantalla-entrada-dades');
                window.formulari?.provarRestaurarDades?.();
            }

            // Notificació d'error
            setTimeout(() => {
                mostrarToast('Error carregant dades. Algunes funcions poden no estar disponibles.', 'error', 5000);
            }, 600);
        }
    });
}

// ============================================
// GESTIÓ DE PANTALLES
// ============================================

async function mostrarPantalla(idPantalla) {
    const pantalles = [
        'pantalla-disclaimer',
        'pantalla-carrega-dades',
        'pantalla-entrada-dades',
        'pantalla-resultats'
    ];

    // 1. Animar sortida de pantalles visibles (Animate.css)
    const sortides = pantalles
        .filter(id => id !== idPantalla)
        .map(id => {
            const el = document.getElementById(id);
            if (!el || el.classList.contains('ocult')) return null;
            el.classList.add('animate__animated', 'animate__fadeOut', 'animate__faster');
            return new Promise(resolve => {
                setTimeout(() => {
                    el.classList.add('ocult');
                    el.classList.remove('animate__animated', 'animate__fadeOut', 'animate__faster');
                    resolve();
                }, 400);
            });
        })
        .filter(Boolean);

    if (sortides.length > 0) await Promise.all(sortides);

    // 2. Mostrar pantalla destí amb animació d'entrada (Animate.css)
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) {
        pantalla.classList.remove('ocult');
        pantalla.classList.add('animate__animated', 'animate__fadeInUp');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            pantalla.classList.remove('animate__animated', 'animate__fadeInUp');
        }, 600);
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
        ? '<i data-lucide="minimize" class="lucide-20"></i>'
        : '<i data-lucide="maximize" class="lucide-20"></i>';

    if (window.lucide) lucide.createIcons();

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
// ZOOM ACCESSIBILITAT
// ============================================

const ZOOM_NIVELLS = [100, 110, 120, 130, 140];
let zoomIndex = 0;

function inicialitzarZoom() {
    const btnIn  = document.getElementById('btn-zoom-in');
    const btnOut = document.getElementById('btn-zoom-out');

    if (btnIn)  btnIn.addEventListener('click', () => canviarZoom(1));
    if (btnOut) btnOut.addEventListener('click', () => canviarZoom(-1));

    // Recuperar preferència guardada
    const guardat = sessionStorage.getItem('zoomNivell');
    if (guardat) {
        const idx = ZOOM_NIVELLS.indexOf(parseInt(guardat));
        if (idx !== -1) {
            zoomIndex = idx;
            aplicarZoom();
        }
    }
}

function canviarZoom(direccio) {
    const nouIndex = zoomIndex + direccio;
    if (nouIndex < 0 || nouIndex >= ZOOM_NIVELLS.length) return;

    zoomIndex = nouIndex;
    aplicarZoom();
    sessionStorage.setItem('zoomNivell', ZOOM_NIVELLS[zoomIndex]);
}

function aplicarZoom() {
    const nivell = ZOOM_NIVELLS[zoomIndex];
    document.documentElement.style.zoom = (nivell / 100).toString();

    const elNivell = document.getElementById('zoom-nivell');
    if (elNivell) elNivell.textContent = `${nivell}%`;

    // Desactivar botons als extrems
    const btnIn  = document.getElementById('btn-zoom-in');
    const btnOut = document.getElementById('btn-zoom-out');
    if (btnIn)  btnIn.disabled  = (zoomIndex >= ZOOM_NIVELLS.length - 1);
    if (btnOut) btnOut.disabled = (zoomIndex <= 0);
}

// ============================================
// CONTEXT TEMPORAL (DATA / HORA / ESTACIÓ)
// ============================================

const ESTACIONS_MAPA = {
    primavera: { icona: 'flower-2', nom: 'Primavera', classe: 'primavera' },
    estiu:     { icona: 'sun',      nom: 'Estiu',     classe: 'estiu' },
    tardor:    { icona: 'leaf',     nom: 'Tardor',    classe: 'tardor' },
    hivern:    { icona: 'snowflake', nom: 'Hivern',   classe: 'hivern' }
};

function obtenirEstacioPerMes() {
    const avui = new Date();
    const mes  = avui.getMonth() + 1; // 1-12
    const dia  = avui.getDate();

    // Dates astronòmiques aproximades
    if ((mes === 3 && dia >= 20) || mes === 4 || mes === 5 || (mes === 6 && dia <= 20)) return 'primavera';
    if ((mes === 6 && dia >= 21) || mes === 7 || mes === 8 || (mes === 9 && dia <= 22)) return 'estiu';
    if ((mes === 9 && dia >= 23) || mes === 10 || mes === 11 || (mes === 12 && dia <= 20)) return 'tardor';
    return 'hivern';
}

function obtenirDataFormatada() {
    const avui = new Date();
    try {
        return avui.toLocaleDateString('ca-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        // Fallback si 'ca-ES' no està disponible
        return avui.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function obtenirHoraFormatada() {
    return new Date().toLocaleTimeString('ca-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function inicialitzarContextTemporal() {
    actualitzarContextTemporal();
    // Actualitzar cada segon per mostrar segons en temps real
    setInterval(actualitzarContextTemporal, 1000);
}

function actualitzarContextTemporal() {
    const dataText = obtenirDataFormatada();
    const horaText = obtenirHoraFormatada();
    const clauEstacio = obtenirEstacioPerMes();
    const estacio = ESTACIONS_MAPA[clauEstacio];

    // Obtenir nom de l'estació actual de la BD
    const estacioBD = obtenirEstacioActual();
    const nomEstacio = estacioBD?.nombre_ca || estacio.nom;

    // Actualitzar tots els widgets
    ['disclaimer', 'formulari', 'resultat'].forEach(ctx => {
        const elData    = document.getElementById(`context-data-${ctx}`);
        const elHora    = document.getElementById(`context-hora-${ctx}`);
        const elNom     = document.getElementById(`context-estacio-nom-${ctx}`);
        const elIcona   = document.getElementById(`context-estacio-icona-${ctx}`);
        const elEstacio = document.getElementById(`context-estacio-${ctx}`);

        if (elData)  elData.textContent = dataText;
        if (elHora)  elHora.textContent = horaText;
        if (elNom)   elNom.textContent  = nomEstacio;

        if (elIcona) {
            elIcona.setAttribute('data-lucide', estacio.icona);
        }

        if (elEstacio) {
            // Netejar classes d'estació anteriors
            elEstacio.className = 'context-estacio';
            elEstacio.classList.add(`context-estacio--${estacio.classe}`);
        }
    });

    // Reinicialitzar icones Lucide per les noves icones d'estació
    if (window.lucide) lucide.createIcons();
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function mostrarToast(missatge, tipus = 'info', durada = 3500) {
    const contenidor = document.getElementById('toast-container');
    if (!contenidor) return;

    const icones = {
        exit:  'check-circle',
        error: 'alert-triangle',
        info:  'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipus} animate__animated animate__slideInRight animate__faster`;
    toast.innerHTML = `
        <i data-lucide="${icones[tipus] || 'info'}" class="toast-icona"></i>
        <span class="toast-missatge">${missatge}</span>
    `;

    contenidor.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    // Auto-tancar amb animació
    setTimeout(() => {
        toast.classList.remove('animate__slideInRight');
        toast.classList.add('animate__slideOutRight');
        setTimeout(() => toast.remove(), 400);
    }, durada);
}

// ============================================
// EXPORTAR GLOBALS
// ============================================
window.app = {
    mostrarPantalla,
    obtenirEstacioActual,
    mostrarToast,
    dadesApp
};


// LÒGICA AREA (a): DISCLAIMER I SLIDESHOW
document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start-app');
    const chkAccept = document.getElementById('accept-disclaimer');
    const areaDisclaimer = document.getElementById('area-disclaimer');
    
    // 1. Validació del botó d'inici
    if (chkAccept && btnStart) {
        chkAccept.addEventListener('change', () => {
            btnStart.disabled = !chkAccept.checked;
        });
        
        btnStart.addEventListener('click', () => {
            // Transició a la següent fase (Càrrega de dades)
            areaDisclaimer.style.display = 'none';
            // Aquí cridarem a la funció de càrrega que ja existeixi a app.js
            if (typeof carregarDadesInicials === 'function') {
                carregarDadesInicials();
            } else if (typeof carregarDades === 'function') {
                carregarDades();
            }
        });
    }

    // 2. Control de l'animació del slideshow
    let currentSlide = 0;
    const slides = document.querySelectorAll('.intro-slideshow .slide');
    
    if (slides.length > 0) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 4000); // Canvi cada 4 segons
    }
});
