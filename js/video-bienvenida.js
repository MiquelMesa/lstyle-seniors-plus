/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Modul de Video de Benvinguda
 * ============================================
 *
 * Aquest modul gestiona el video animat amb
 * transicions entre escenes. Cada escena dura
 * 4 segons i es mostra amb un fade suau.
 *
 * Caracteristiques:
 * - Auto-play al carregar
 * - Transicions automatiqes entre escenes
 * - Controls: Repetir, Seguir, Skip
 * - Indicadors de progres clicables
 * - Pausa al interactuar
 *
 * PATRO: IIFE per no contaminar l'ambit global
 */

'use strict';

const videoBienvenida = (() => {

 // ============================================
 // CONFIGURACIO
 // ============================================

 /** Durada de cada escena en milisegons */
 const DURADA_ESCENA = 4000; // 4 segons

 /** Nombre total d'escenes */
 const NUM_ESCENES = 5;

 // ============================================
 // ESTAT PRIVAT
 // ============================================

 /** Index de l'escena actual (0-4) */
 let escenaActual = 0;

 /** ID del timeout per canviar d'escena */
 let timeoutCanvi = null;

 /** Indica si el video esta en pausa */
 let pausat = false;

 /** Indica si el video ha finalitzat */
 let finalitzat = false;

 /** Timestamp de l'inici de l'escena actual */
 let iniciEscena = Date.now();

 // ============================================
 // REFERENCIES DOM
 // ============================================

 /** Obtenir totes les escenes */
 const obtenirEscenes = () => document.querySelectorAll('.escena-video');

 /** Obtenir tots els indicadors */
 const obtenirIndicadors = () => document.querySelectorAll('.indicador');

 /** Obtenir la pantalla de video */
 const obtenirPantalla = () => document.getElementById('pantalla-video');

 // ============================================
 // FUNCIONS PRINCIPALS
 // ============================================

 /**
 * Inicialitza el video de benvinguda.
 * Cridat des de app.js quan es carrega l'app.
 */
 function inicialitzar() {
 console.log('🎬 Inicialitzant video de benvinguda...');

 // Registrar esdeveniments dels controls
 registrarEsdeveniments();

 // Comencar la primera escena
 mostrarEscena(0);

 // Programar el canvi automatic
 programarSeguentEscena();

 console.log('✅ Video de benvinguda actiu');
 }

 /**
 * Mostra una escena especifica i amaga les altres.
 * @param {number} index - Index de l'escena (0-4)
 */
 function mostrarEscena(index) {
 const escenes = obtenirEscenes();
 const indicadors = obtenirIndicadors();

 // Validar index
 if (index < 0 || index >= NUM_ESCENES) {
 console.warn('Index d\'escena invalid:', index);
 return;
 }

 // Actualitzar escena actual
 escenaActual = index;
 iniciEscena = Date.now();

 // Amagar totes les escenes
 escenes.forEach((escena, i) => {
 escena.classList.remove('escena-activa');
 // Reset de l'animacio per forzar re-animacio
 escena.style.animation = 'none';
 escena.offsetHeight; // Trigger reflow
 if (i === index) {
 escena.style.animation = '';
 }
 });

 // Mostrar l'escena seleccionada
 setTimeout(() => {
 escenes[index].classList.add('escena-activa');
 }, 50);

 // Actualitzar indicadors
 indicadors.forEach((ind, i) => {
 ind.classList.toggle('indicador-actiu', i === index);
 });

 console.log(`🎬 Escena ${index + 1}/${NUM_ESCENES}`);
 }

 /**
 * Programa el canvi automatic a la seguent escena.
 */
 function programarSeguentEscena() {
 // Netejar timeout anterior si existeix
 if (timeoutCanvi) {
 clearTimeout(timeoutCanvi);
 }

 // Si esta pausat o finalitzat, no programar
 if (pausat || finalitzat) {
 return;
 }

 // Programar el canvi
 timeoutCanvi = setTimeout(() => {
 if (pausat || finalitzat) {
 return;
 }

 const seguent = escenaActual + 1;

 if (seguent < NUM_ESCENES) {
 // Hi ha mes escenes
 mostrarEscena(seguent);
 programarSeguentEscena();
 } else {
 // Video finalitzat
 finalitzarVideo();
 }
 }, DURADA_ESCENA);
 }

 /**
 * Finalitza el video (mostra controls destacats).
 */
 function finalitzarVideo() {
 finalitzat = true;
 console.log('🎬 Video finalitzat');

 // Destacar el boto "Seguir" amb un efecte visual
 const btnSeguir = document.getElementById('btn-seguir-app');
 if (btnSeguir) {
 btnSeguir.classList.add('btn-destacat');
 setTimeout(() => {
 btnSeguir.classList.remove('btn-destacat');
 }, 2000);
 }
 }

 /**
 * Repeteix el video des de l'inici.
 */
 function repetirVideo() {
 console.log('🔄 Reproduint video de nou...');

 // Reset d'estat
 finalitzat = false;
 pausat = false;

 // Mostrar primera escena
 mostrarEscena(0);

 // Programar seguents
 programarSeguentEscena();

 // Notificacio
 if (window.app && window.app.mostrarToast) {
 window.app.mostrarToast('Video reiniciat', 'info', 2000);
 }
 }

 /**
 * Pausa el video (per interaccio de l'usuari).
 */
 function pausar() {
 if (pausat) return;

 pausat = true;
 if (timeoutCanvi) {
 clearTimeout(timeoutCanvi);
 timeoutCanvi = null;
 }

 console.log('⏸️ Video pausat');
 }

 /**
 * Repren el video despres de pausa.
 */
 function reprendre() {
 if (!pausat) return;

 pausat = false;

 // Calcular el temps restant de l'escena actual
 const tempsTranscorregut = Date.now() - iniciEscena;
 const tempsRestant = Math.max(0, DURADA_ESCENA - tempsTranscorregut);

 // Programar el canvi amb el temps restant
 timeoutCanvi = setTimeout(() => {
 if (pausat || finalitzat) return;

 const seguent = escenaActual + 1;
 if (seguent < NUM_ESCENES) {
 mostrarEscena(seguent);
 programarSeguentEscena();
 } else {
 finalitzarVideo();
 }
 }, tempsRestant);

 console.log('▶️ Video reprès');
 }

 /**
 * Salta a una escena especifica (clic en indicador).
 * @param {number} index - Index de l'escena desti
 */
 function saltarAEscena(index) {
 if (index === escenaActual) return;

 // Pausar i mostrar nova escena
 pausar();
 mostrarEscena(index);

 // Si no es l'ultima, reprendre
 if (index < NUM_ESCENES - 1) {
 finalitzat = false;
 reprendre();
 } else {
 finalitzarVideo();
 }
 }

 /**
 * Amaga la pantalla de video i mostra la seguent.
 */
 function seguirAmbAplicacio() {
 console.log('➡️ Continuant amb l\'aplicacio...');

 // Pausar el video
 pausar();

 // Amagar pantalla de video amb animacio
 const pantalla = obtenirPantalla();
 if (pantalla) {
 pantalla.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
 pantalla.style.opacity = '0';
 pantalla.style.transform = 'scale(1.05)';

 setTimeout(() => {
 pantalla.classList.add('ocult');
 pantalla.style.display = 'none';

 // Mostrar pantalla de disclaimer
 if (window.app && window.app.mostrarPantalla) {
 window.app.mostrarPantalla('pantalla-disclaimer');
 }
 }, 600);
 }
 }

 // ============================================
 // REGISTRE D'ESDEVENIMENTS
 // ============================================

 function registrarEsdeveniments() {
 // Boto Repetir
 const btnRepetir = document.getElementById('btn-repetir-video');
 if (btnRepetir) {
 btnRepetir.addEventListener('click', (e) => {
 e.preventDefault();
 repetirVideo();
 });
 }

 // Boto Seguir
 const btnSeguir = document.getElementById('btn-seguir-app');
 if (btnSeguir) {
 btnSeguir.addEventListener('click', (e) => {
 e.preventDefault();
 seguirAmbAplicacio();
 });
 }

 // Boto Skip
 const btnSkip = document.getElementById('btn-skip-video');
 if (btnSkip) {
 btnSkip.addEventListener('click', (e) => {
 e.preventDefault();
 seguirAmbAplicacio();
 });
 }

 // Indicadors clicables
 const indicadors = obtenirIndicadors();
 indicadors.forEach((ind, index) => {
 ind.addEventListener('click', () => {
 saltarAEscena(index);
 });

 // Accessibility
 ind.setAttribute('role', 'button');
 ind.setAttribute('aria-label', `Escena ${index + 1}`);
 ind.setAttribute('tabindex', '0');

 // Teclat
 ind.addEventListener('keydown', (e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 saltarAEscena(index);
 }
 });
 });

 // Pausar al moure el ratoli sobre els controls
 const controls = document.querySelector('.video-controls');
 if (controls) {
 controls.addEventListener('mouseenter', pausar);
 controls.addEventListener('mouseleave', reprendre);
 }

 // Pausar al tocar en mobil
 const contenidor = document.querySelector('.video-contenidor');
 if (contenidor) {
 contenidor.addEventListener('touchstart', () => {
 if (pausat) {
 reprendre();
 } else {
 pausar();
 }
 });
 }
 }

 // ============================================
 // API PUBLICA
 // ============================================

 return {
 inicialitzar,
 repetirVideo,
 seguirAmbAplicacio,
 pausar,
 reprendre
 };

})();

// Fer disponible globalment
window.videoBienvenida = videoBienvenida;

// Inicialitzar quan el DOM estigui llest
document.addEventListener('DOMContentLoaded', () => {
 // Comprovar si existeix la pantalla de video
 if (document.getElementById('pantalla-video')) {
 videoBienvenida.inicialitzar();
 }
});