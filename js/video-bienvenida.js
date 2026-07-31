/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Mòdul de control de la Pantalla 1 (Vídeo)
 * ============================================
 * Gestiona el vídeo de benvinguda amb transicions fluïdes.
 *
 * Mètode: IIFE (funció autoexecutada)
 */

'use strict';

const videoBienvenida = (() => {

    const DURADA_ESCENA = 4000; // 4 segons per escena
    const NUM_ESCENES = 5;

    let escenaActual = 0;
    let timeoutCanvi = null;
    let pausat = false;
    let finalitzat = false;

    const obtenirEscenes = () => document.querySelectorAll('.escena-video');
    const obtenirIndicadors = () => document.querySelectorAll('.indicador');
    const obtenirPantalla = () => document.getElementById('pantalla-video');

    function inicialitzar() {
        console.log('🎬 Inicialitzant vídeo de benvinguda (Pantalla 1)...');
        registrarEsdeveniments();
        mostrarEscena(0);
        programarSeguentEscena();
    }

    function mostrarEscena(index) {
        const escenes = obtenirEscenes();
        const indicadors = obtenirIndicadors();

        if (index < 0 || index >= NUM_ESCENES) return;

        escenaActual = index;

        escenes.forEach((escena, i) => {
            escena.classList.remove('escena-activa');
            if (i === index) {
                setTimeout(() => escena.classList.add('escena-activa'), 50);
            }
        });

        indicadors.forEach((ind, i) => {
            ind.classList.toggle('indicador-actiu', i === index);
        });
    }

    function programarSeguentEscena() {
        if (timeoutCanvi) clearTimeout(timeoutCanvi);
        if (pausat || finalitzat) return;

        timeoutCanvi = setTimeout(() => {
            if (pausat || finalitzat) return;

            const seguent = escenaActual + 1;
            if (seguent < NUM_ESCENES) {
                mostrarEscena(seguent);
                programarSeguentEscena();
            } else {
                finalitzarVideo();
            }
        }, DURADA_ESCENA);
    }

    function finalitzarVideo() {
        finalitzat = true;
        console.log('🎬 Vídeo de benvinguda completat');
    }

    function repetirVideo() {
        console.log('🔄 Reiniciant vídeo...');
        finalitzat = false;
        pausat = false;
        mostrarEscena(0);
        programarSeguentEscena();

        if (window.app && window.app.mostrarToast) {
            window.app.mostrarToast('Vídeo reiniciat', 'info', 2000);
        }
    }

    function saltarAEscena(index) {
        if (index === escenaActual) return;
        mostrarEscena(index);
        finalitzat = false;
        programarSeguentEscena();
    }

    function seguirAmbAplicacio() {
        console.log('➡️ Avançant cap al disclaimer (Pantalla 2)...');
        if (timeoutCanvi) clearTimeout(timeoutCanvi);
        finalitzat = true;

        const pantalla = obtenirPantalla();
        if (pantalla) {
            pantalla.style.transition = 'opacity 0.6s ease';
            pantalla.style.opacity = '0';

            setTimeout(() => {
                pantalla.classList.add('ocult');
                pantalla.style.display = 'none';

                // Mostrar la pantalla de disclaimer (Pantalla 2)
                if (window.app && window.app.mostrarPantalla) {
                    window.app.mostrarPantalla('pantalla-disclaimer');
                } else {
                    const disclaimer = document.getElementById('pantalla-disclaimer');
                    if (disclaimer) disclaimer.classList.remove('ocult');
                }
            }, 600);
        }
    }

    function registrarEsdeveniments() {
        const btnRepetir = document.getElementById('btn-repetir-video');
        if (btnRepetir) {
            btnRepetir.addEventListener('click', (e) => {
                e.preventDefault();
                repetirVideo();
            });
        }

        const btnSeguir = document.getElementById('btn-seguir-app');
        if (btnSeguir) {
            btnSeguir.addEventListener('click', (e) => {
                e.preventDefault();
                seguirAmbAplicacio();
            });
        }

        const btnSkip = document.getElementById('btn-skip-video');
        if (btnSkip) {
            btnSkip.addEventListener('click', (e) => {
                e.preventDefault();
                seguirAmbAplicacio();
            });
        }

        const indicadors = obtenirIndicadors();
        indicadors.forEach((ind, index) => {
            ind.addEventListener('click', () => saltarAEscena(index));
        });
    }

    return {
        inicialitzar,
        repetirVideo,
        seguirAmbAplicacio
    };

})();

window.videoBienvenida = videoBienvenida;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pantalla-video')) {
        videoBienvenida.inicialitzar();
    }
});