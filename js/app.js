/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Script Principal de l'Aplicació
 * ============================================
 */

// Variables globals
// let supabase; Aixo no fa falta

let dadesApp = {
    estacions: [],
    categoriesAliments: [],
    aliments: [],
    condicionsSalut: [],
    consells: [],
    telefonos: [],
    rangosIMC: [],
    formules: [],
    factorsActivitat: [],
    config: null
};

/**
 * Inicialització de l'aplicació
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciant LSTYLE-SENIORS-PLUS...');
    
    try {
        // 1. Validar configuració Supabase
        if (!validarConfigSupabase()) {
            mostrarError('Configuració de Supabase incompleta. Revisa config/supabase-config.js');
            return;
        }
        
        // 2. Inicialitzar client Supabase
        inicialitzarSupabase();
        
        // 3. Carregar dades des de Supabase
        await carregarDadesInicials();
        
        
        
        // 4. Inicialitzar events de la pantalla disclaimer
        inicialitzarDisclaimer();
        
        // 5. Inicialitzar botó pantalla completa
        inicialitzarPantallaCompleta();
        
        // 6. Amagar pantalla de càrrega i mostrar disclaimer
        setTimeout(() => {
            ocultarPantallaCarrega();
            mostrarPantalla('pantalla-disclaimer');
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error durant la inicialització:', error);
        mostrarError('Error al carregar l\'aplicació. Si us plau, refresca la pàgina.');
    }
});

/**
 * Inicialitza el client de Supabase
 */
function inicialitzarSupabase() {
    try {
            window.supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            SUPABASE_CONFIG.options
        );
        console.log('✅ Client Supabase inicialitzat');
    } catch (error) {
        console.error('❌ Error inicialitzant Supabase:', error);
        throw error;
    }
}

/**
 * Carrega totes les dades inicials des de Supabase
 */
async function carregarDadesInicials() {
    console.log('📦 Carregant dades des de Supabase...');
    
    try {
        // Carregar dades en paral·lel per optimitzar temps
        const [
            estacions,
            categories,
            aliments,
            condicions,
            consells,
            telefonos,
            rangos,
            formules,
            factors,
            config
        ] = await Promise.all([
            supabase.from('estaciones').select('*').order('id'),
            supabase.from('categorias_alimentos').select('*').order('orden'),
            supabase.from('alimentos').select('*'),
            supabase.from('condiciones_salud').select('*').order('orden'),
            supabase.from('consejos_condiciones').select('*'),
            supabase.from('telefonos_emergencia').select('*').order('orden'),
            supabase.from('rangos_imc_seniors').select('*'),
            supabase.from('formulas_calculos').select('*'),
            supabase.from('factores_actividad').select('*'),
            supabase.from('config_app').select('*').eq('id', 1).single()
        ]);
        
        // Guardar dades globals
        dadesApp.estacions = estacions.data || [];
        dadesApp.categoriesAliments = categories.data || [];
        dadesApp.aliments = aliments.data || [];
        dadesApp.condicionsSalut = condicions.data || [];
        dadesApp.consells = consells.data || [];
        dadesApp.telefonos = telefonos.data || [];
        dadesApp.rangosIMC = rangos.data || [];
        dadesApp.formules = formules.data || [];
        dadesApp.factorsActivitat = factors.data || [];
        dadesApp.config = config.data;
        
        console.log('✅ Dades carregades correctament:', {
            estacions: dadesApp.estacions.length,
            aliments: dadesApp.aliments.length,
            condicions: dadesApp.condicionsSalut.length,
            consells: dadesApp.consells.length
        });
        
        // Comprovar si cal actualitzar dades (45 dies)
        comprovarActualitzacioDades();
        
    } catch (error) {
        console.error('❌ Error carregant dades:', error);
        throw new Error('No s\'han pogut carregar les dades de l\'aplicació');
    }
}

/**
 * Comprova si cal actualitzar les dades (cada 45 dies)
 */
function comprovarActualitzacioDades() {
    if (!dadesApp.config || !dadesApp.config.ultima_actualizacion) {
        console.warn('⚠️ No hi ha data d\'última actualització');
        return;
    }
    
    const ultimaActualitzacio = new Date(dadesApp.config.ultima_actualizacion);
    const avui = new Date();
    const diesTranscorreguts = Math.floor((avui - ultimaActualitzacio) / (1000 * 60 * 60 * 24));
    const diesActualitzacio = dadesApp.config.dias_actualizacion || 45;
    
    console.log(`📅 Última actualització: fa ${diesTranscorreguts} dies`);
    
    if (diesTranscorreguts >= diesActualitzacio) {
        console.log('⚠️ Les dades necessiten actualització (>45 dies)');
        // Aquí podries mostrar un missatge a l'usuari
        // o intentar actualitzar automàticament
    }
}

/**
 * Inicialitza els events de la pantalla disclaimer
 */
function inicialitzarDisclaimer() {
    const checkbox = document.getElementById('checkbox-acceptacio');
    const btnContinuar = document.getElementById('btn-continuar-disclaimer');
    
    if (!checkbox || !btnContinuar) {
        console.error('❌ Elements del disclaimer no trobats');
        return;
    }
    
    // Event checkbox
    checkbox.addEventListener('change', (e) => {
        btnContinuar.disabled = !e.target.checked;
    });
    
    // Event botó continuar
    btnContinuar.addEventListener('click', () => {
        ocultarPantalla('pantalla-disclaimer');
        mostrarPantalla('pantalla-entrada-dades');
    });
}

/**
 * Oculta la pantalla de càrrega
 */
function ocultarPantallaCarrega() {
    const pantalla = document.getElementById('pantalla-carrega');
    if (pantalla) {
        pantalla.classList.add('ocultar');
        setTimeout(() => {
            pantalla.style.display = 'none';
        }, 300);
    }
}

/**
 * Mostra una pantalla i oculta les altres
 * @param {string} idPantalla - ID de la pantalla a mostrar
 */
function mostrarPantalla(idPantalla) {
    // Ocultar totes les pantalles
    const pantalles = document.querySelectorAll('.pantalla');
    pantalles.forEach(p => p.classList.add('ocult'));
    
    // Mostrar la pantalla seleccionada
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) {
        pantalla.classList.remove('ocult');
        pantalla.classList.add('apareix');
    } else {
        console.error(`❌ Pantalla "${idPantalla}" no trobada`);
    }
}

/**
 * Oculta una pantalla
 * @param {string} idPantalla - ID de la pantalla a ocultar
 */
function ocultarPantalla(idPantalla) {
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) {
        pantalla.classList.add('ocult');
    }
}

/**
 * Mostra un missatge d'error
 * @param {string} missatge - Missatge d'error
 */
function mostrarError(missatge) {
    alert('❌ ERROR: ' + missatge);
    console.error('ERROR:', missatge);
}

/**
 * Obté l'estació actual segons la data
 * @returns {Object} Objecte amb les dades de l'estació actual
 */
function obtenirEstacioActual() {
    const avui = new Date();
    const mes = avui.getMonth() + 1; // 1-12
    const dia = avui.getDate();
    const dataActual = `${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    
    // Trobar l'estació actual
    for (let estacio of dadesApp.estacions) {
        // Comparar dates (simplificat)
        if (compararDates(dataActual, estacio.fecha_inicio, estacio.fecha_fin)) {
            return estacio;
        }
    }
    
    // Si no es troba, retornar primavera per defecte
    return dadesApp.estacions[0];
}

/**
 * Compara si una data està dins d'un rang
 * @param {string} data - Data en format MM-DD
 * @param {string} inici - Data d'inici en format MM-DD
 * @param {string} fi - Data de fi en format MM-DD
 * @returns {boolean}
 */
function compararDates(data, inici, fi) {
    // Implementació simplificada
    // En producció caldria gestionar millor el canvi d'any
    return data >= inici && data <= fi;
}

// Exportar funcions globals si cal
window.app = {
    mostrarPantalla,
    ocultarPantalla,
    obtenirEstacioActual,
    dadesApp
};

/**
 * Gestió de la pantalla completa
 */
function inicialitzarPantallaCompleta() {
    const btnPantallaCompleta = document.getElementById('btn-pantalla-completa');
    
    if (!btnPantallaCompleta) {
        console.warn('⚠️ Botó pantalla completa no trobat');
        return;
    }
    
    // Event click al botó
    btnPantallaCompleta.addEventListener('click', activarPantallaCompleta);
    
    // Detectar canvis en pantalla completa
    document.addEventListener('fullscreenchange', actualitzarBotoPantallaCompleta);
    document.addEventListener('webkitfullscreenchange', actualitzarBotoPantallaCompleta);
    document.addEventListener('mozfullscreenchange', actualitzarBotoPantallaCompleta);
    document.addEventListener('MSFullscreenChange', actualitzarBotoPantallaCompleta);
}

/**
 * Activa o desactiva la pantalla completa
 */
function activarPantallaCompleta() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        // Entrar en pantalla completa
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        // Sortir de pantalla completa
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

/**
 * Actualitza l'estat del botó segons si estem en pantalla completa
 */
function actualitzarBotoPantallaCompleta() {
    const btnPantallaCompleta = document.getElementById('btn-pantalla-completa');
    
    if (!btnPantallaCompleta) return;
    
    const enPantallaCompleta = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement;
    
    if (enPantallaCompleta) {
        // Canviar icona a "sortir pantalla completa"
        btnPantallaCompleta.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
        `;
        btnPantallaCompleta.title = 'Sortir de pantalla completa (ESC)';
    } else {
        // Icona "entrar pantalla completa"
        btnPantallaCompleta.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
        `;
        btnPantallaCompleta.title = 'Pantalla completa (F11)';
    }
}
