/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Gestió del Formulari - formulari.js
 * ============================================
 */

'use strict';

// ============================================
// INICIALITZACIÓ
// ============================================

function inicialitzarFormulari() {
    console.log('📝 Inicialitzant formulari...');

    try {
        carregarCondicions();
        carregarActivitat();
        inicialitzarValidacions();
        inicialitzarHabits();
        inicialitzarPresssioArterial();

        const formulari = document.getElementById('formulari-dades');
        if (formulari) {
            formulari.addEventListener('submit', processarFormulari);
        }

        const btnNetejar = document.getElementById('btn-netejar');
        if (btnNetejar) {
            btnNetejar.addEventListener('click', netejarFormulari);
        }

        console.log('✅ Formulari inicialitzat correctament');

    } catch (error) {
        console.error('❌ Error inicialitzant formulari:', error);
    }
}

// ============================================
// CÀRREGA DINÀMICA DES DE SUPABASE
// ============================================

function carregarCondicions() {
    const contenidor = document.getElementById('contenidor-condicions');
    if (!contenidor) return;

    const condicions = window.app?.dadesApp?.condicionsSalut || [];

    if (condicions.length === 0) {
        contenidor.innerHTML = '<div style="color:var(--color-gris);font-size:var(--mida-petita);">No hi ha condicions disponibles</div>';
        return;
    }

    contenidor.innerHTML = '';

    condicions.forEach(condicio => {
        const item = document.createElement('div');
        item.className   = 'condicio-item';
        item.dataset.id  = condicio.id;

        const checkbox = document.createElement('input');
        checkbox.type          = 'checkbox';
        checkbox.id            = `condicio-${condicio.id}`;
        checkbox.name          = 'condicions';
        checkbox.value         = condicio.id;
        checkbox.dataset.codi  = condicio.codigo;

        const label = document.createElement('label');
        label.htmlFor   = `condicio-${condicio.id}`;
        label.className = 'condicio-label';
        label.textContent = condicio.nombre_ca;

        item.appendChild(checkbox);
        item.appendChild(label);
        contenidor.appendChild(item);

        checkbox.addEventListener('change', () => {
            item.classList.toggle('seleccionat', checkbox.checked);
        });

        item.addEventListener('click', (e) => {
            if (e.target !== checkbox && e.target !== label) {
                checkbox.checked = !checkbox.checked;
                item.classList.toggle('seleccionat', checkbox.checked);
            }
        });
    });

    console.log(`✅ ${condicions.length} condicions carregades`);
}

function carregarActivitat() {
    const contenidor = document.getElementById('contenidor-activitat');
    if (!contenidor) return;

    const activitats = window.app?.dadesApp?.factorsActivitat || [];

    if (activitats.length === 0) {
        contenidor.innerHTML = '<div style="color:var(--color-gris);font-size:var(--mida-petita);">No hi ha nivells disponibles</div>';
        return;
    }

    contenidor.innerHTML = '';

    activitats.forEach((activitat, index) => {
        const item = document.createElement('div');
        item.className     = 'activitat-item';
        item.dataset.nivel = activitat.nivel;

        const radio = document.createElement('input');
        radio.type          = 'radio';
        radio.id            = `activitat-${activitat.id}`;
        radio.name          = 'activitat';
        radio.value         = activitat.nivel;
        radio.required      = true;
        radio.dataset.factor = activitat.factor_tmb;

        if (index === 0) {
            radio.checked = true;
            item.classList.add('seleccionat');
        }

        const text = document.createElement('div');
        text.className = 'activitat-text';

        const nom = document.createElement('span');
        nom.className   = 'activitat-nom';
        nom.textContent = activitat.nombre_ca;

        const desc = document.createElement('span');
        desc.className   = 'activitat-desc';
        desc.textContent = activitat.descripcion_ca;

        text.appendChild(nom);
        text.appendChild(desc);
        item.appendChild(radio);
        item.appendChild(text);
        contenidor.appendChild(item);

        radio.addEventListener('change', () => {
            document.querySelectorAll('.activitat-item').forEach(el => {
                el.classList.remove('seleccionat');
            });
            item.classList.add('seleccionat');
            netejarError('activitat');
        });

        item.addEventListener('click', (e) => {
            if (e.target !== radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        });
    });

    console.log(`✅ ${activitats.length} nivells d'activitat carregats`);
}

// ============================================
// HÀBITS DE VIDA
// ============================================

function inicialitzarHabits() {
    document.querySelectorAll('input[name="fumador"]').forEach(radio => {
        radio.addEventListener('change', () => {
            actualitzarEstilHabit('fumador', radio.value);
        });
    });

    document.querySelectorAll('input[name="vegetaria"]').forEach(radio => {
        radio.addEventListener('change', () => {
            actualitzarEstilHabit('vegetaria', radio.value);
        });
    });
}

function actualitzarEstilHabit(nom, valor) {
    document.querySelectorAll(`input[name="${nom}"]`).forEach(radio => {
        const opcio = radio.closest('.habit-opcio');
        if (opcio) opcio.classList.toggle('seleccionat', radio.value === valor);
    });
}

// ============================================
// PRESSIÓ ARTERIAL
// ============================================

function inicialitzarPresssioArterial() {
    const camps = [
        { id: 'pressio-max', barra: 'barra-pressio-max', tipus: 'sistolica' },
        { id: 'pressio-min', barra: 'barra-pressio-min', tipus: 'diastolica' },
        { id: 'frequencia',  barra: 'barra-frequencia',  tipus: 'frequencia' }
    ];

    camps.forEach(({ id, barra, tipus }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                actualitzarBarraPressio(input.value, barra, tipus);
            });
        }
    });
}

function actualitzarBarraPressio(valor, idBarra, tipus) {
    const barra = document.getElementById(idBarra);
    if (!barra) return;

    const num = parseInt(valor);
    if (isNaN(num) || num === 0) {
        barra.className = 'pressio-barra';
        return;
    }

    let estat = 'normal';

    if (tipus === 'sistolica') {
        if      (num < 120) estat = 'normal';
        else if (num < 140) estat = 'baixa';
        else                estat = 'alta';
    } else if (tipus === 'diastolica') {
        if      (num < 80)  estat = 'normal';
        else if (num < 90)  estat = 'baixa';
        else                estat = 'alta';
    } else if (tipus === 'frequencia') {
        if      (num >= 60 && num <= 100) estat = 'normal';
        else if (num > 100)               estat = 'alta';
        else                              estat = 'baixa';
    }

    barra.className = `pressio-barra ${estat}`;
}

// ============================================
// VALIDACIONS EN TEMPS REAL
// ============================================

function inicialitzarValidacions() {
    afegirValidacio('nom',        () => validarNom());
    afegirValidacio('edat',       () => validarEdat());
    afegirValidacio('alcada-min', () => validarAlcada());
    afegirValidacio('alcada-max', () => validarAlcada());
    afegirValidacio('pes-min',    () => validarPes());
    afegirValidacio('pes-max',    () => validarPes());

    const selectSexe = document.getElementById('sexe');
    if (selectSexe) {
        selectSexe.addEventListener('change', () => validarSexe());
    }
}

function afegirValidacio(id, fn) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('blur',  fn);
    input.addEventListener('input', () => {
        const camp = id.includes('-') ? id.split('-')[0] : id;
        netejarError(camp);
        input.classList.remove('error');
    });
}

function validarNom() {
    const input = document.getElementById('nom');
    const valor = input.value.trim();

    if (!valor)            return mostrarError('nom', 'El nom és obligatori'),          marcarError(input), false;
    if (valor.length < 2)  return mostrarError('nom', 'Mínim 2 caràcters'),             marcarError(input), false;
    if (valor.length > 100) return mostrarError('nom', 'Màxim 100 caràcters'),          marcarError(input), false;

    marcarExit(input);
    netejarError('nom');
    return true;
}

function validarEdat() {
    const input = document.getElementById('edat');
    const valor = parseInt(input.value);

    if (!input.value || isNaN(valor)) return mostrarError('edat', 'L\'edat és obligatòria'),                    marcarError(input), false;
    if (valor < 60)                   return mostrarError('edat', 'Aquesta app és per a persones de 60+ anys'), marcarError(input), false;
    if (valor > 120)                  return mostrarError('edat', 'Introdueix una edat vàlida'),                 marcarError(input), false;

    marcarExit(input);
    netejarError('edat');
    return true;
}

function validarSexe() {
    const select = document.getElementById('sexe');

    if (!select.value) return mostrarError('sexe', 'El sexe és obligatori'), marcarError(select), false;

    marcarExit(select);
    netejarError('sexe');
    return true;
}

function validarAlcada() {
    const inputMin = document.getElementById('alcada-min');
    const inputMax = document.getElementById('alcada-max');
    const min      = parseFloat(inputMin.value);
    const max      = inputMax.value ? parseFloat(inputMax.value) : null;

    if (!inputMin.value || isNaN(min))        return mostrarError('alcada', 'L\'alçada és obligatòria'),              marcarError(inputMin), false;
    if (min < 100 || min > 250)               return mostrarError('alcada', 'Alçada entre 100 i 250 cm'),             marcarError(inputMin), false;
    if (max !== null && !isNaN(max)) {
        if (max < min)                        return mostrarError('alcada', 'El màxim ha de ser major que el mínim'),  marcarError(inputMax), false;
        if (max - min > 10)                   return mostrarError('alcada', 'Rang màxim 10 cm'),                       marcarError(inputMax), false;
    }

    marcarExit(inputMin);
    if (inputMax.value) marcarExit(inputMax);
    netejarError('alcada');
    return true;
}

function validarPes() {
    const inputMin = document.getElementById('pes-min');
    const inputMax = document.getElementById('pes-max');
    const min      = parseFloat(inputMin.value);
    const max      = inputMax.value ? parseFloat(inputMax.value) : null;

    if (!inputMin.value || isNaN(min))        return mostrarError('pes', 'El pes és obligatori'),                    marcarError(inputMin), false;
    if (min < 30 || min > 300)                return mostrarError('pes', 'Pes entre 30 i 300 kg'),                   marcarError(inputMin), false;
    if (max !== null && !isNaN(max)) {
        if (max < min)                        return mostrarError('pes', 'El màxim ha de ser major que el mínim'),   marcarError(inputMax), false;
        if (max - min > 10)                   return mostrarError('pes', 'Rang màxim 10 kg'),                        marcarError(inputMax), false;
    }

    marcarExit(inputMin);
    if (inputMax.value) marcarExit(inputMax);
    netejarError('pes');
    return true;
}

// Helpers
function marcarError(input) {
    input.classList.add('error');
    input.classList.remove('exit');
}

function marcarExit(input) {
    input.classList.remove('error');
    input.classList.add('exit');
}

function mostrarError(camp, missatge) {
    const el = document.getElementById(`error-${camp}`);
    if (el) {
        el.textContent = missatge;
        el.classList.add('actiu');
    }
}

function netejarError(camp) {
    const el = document.getElementById(`error-${camp}`);
    if (el) el.classList.remove('actiu');
}

// ============================================
// PROCESSAMENT DEL FORMULARI
// ============================================

function processarFormulari(event) {
    event.preventDefault();
    console.log('📋 Processant formulari...');

    const valid = validarNom()    &&
                  validarEdat()   &&
                  validarSexe()   &&
                  validarAlcada() &&
                  validarPes();

    if (!valid) {
        const primerError = document.querySelector('.input-formulari.error, .select-formulari.error');
        if (primerError) {
            primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            primerError.focus();
        }
        return;
    }

    const dades = recollidaDades();
    console.log('✅ Dades recollides:', dades);

    try {
        sessionStorage.setItem('dadesUsuari', JSON.stringify(dades));
    } catch (e) {
        console.warn('⚠️ Error guardant a sessionStorage:', e);
    }

    window.app.mostrarPantalla('pantalla-resultats');
}

function recollidaDades() {
    const nom  = document.getElementById('nom').value.trim();
    const sexe = document.getElementById('sexe').value;
    const edat = parseInt(document.getElementById('edat').value);

    const alcadaMin = parseFloat(document.getElementById('alcada-min').value) || null;
    const alcadaMax = parseFloat(document.getElementById('alcada-max').value) || null;
    const alcada    = alcadaMin && alcadaMax ? (alcadaMin + alcadaMax) / 2 : alcadaMin;

    const pesMin = parseFloat(document.getElementById('pes-min').value) || null;
    const pesMax = parseFloat(document.getElementById('pes-max').value) || null;
    const pes    = pesMin && pesMax ? (pesMin + pesMax) / 2 : pesMin;

    const cinturaMin = parseFloat(document.getElementById('cintura-min').value) || null;
    const cinturaMax = parseFloat(document.getElementById('cintura-max').value) || null;
    const cintura    = cinturaMin && cinturaMax ? (cinturaMin + cinturaMax) / 2 : cinturaMin;

    const caderaMin = parseFloat(document.getElementById('cadera-min').value) || null;
    const caderaMax = parseFloat(document.getElementById('cadera-max').value) || null;
    const cadera    = caderaMin && caderaMax ? (caderaMin + caderaMax) / 2 : caderaMin;

    // Càlcul ICC automàtic
    const icc = cintura && cadera ? parseFloat((cintura / cadera).toFixed(3)) : null;

    const pressioMax = parseInt(document.getElementById('pressio-max').value) || null;
    const pressioMin = parseInt(document.getElementById('pressio-min').value) || null;
    const frequencia = parseInt(document.getElementById('frequencia').value)  || null;

    const condicions = Array.from(
        document.querySelectorAll('input[name="condicions"]:checked')
    ).map(cb => ({ id: parseInt(cb.value), codi: cb.dataset.codi }));

    const activitatRadio = document.querySelector('input[name="activitat"]:checked');
    const activitat = activitatRadio
        ? { nivel: activitatRadio.value, factor: parseFloat(activitatRadio.dataset.factor) }
        : null;

    const fumador  = document.querySelector('input[name="fumador"]:checked')?.value  === 'si';
    const vegetaria = document.querySelector('input[name="vegetaria"]:checked')?.value === 'si';

    return {
        nom, sexe, edat,
        alcada, alcadaMin, alcadaMax,
        pes,    pesMin,    pesMax,
        cintura, cinturaMin, cinturaMax,
        cadera,  caderaMin,  caderaMax,
        icc,
        pressioMax, pressioMin, frequencia,
        condicions,
        activitat,
        fumador, vegetaria,
        dataEntrada: new Date().toISOString()
    };
}

// ============================================
// NETEJAR FORMULARI
// ============================================

function netejarFormulari() {
    if (!confirm('Estàs segur que vols netejar tot el formulari?')) return;

    const formulari = document.getElementById('formulari-dades');
    if (formulari) formulari.reset();

    document.querySelectorAll('.camp-error').forEach(el => {
        el.classList.remove('actiu');
        el.textContent = '';
    });

    document.querySelectorAll('.input-formulari, .select-formulari').forEach(el => {
        el.classList.remove('error', 'exit');
    });

    document.querySelectorAll('.condicio-item').forEach(el => {
        el.classList.remove('seleccionat');
    });

    document.querySelectorAll('.activitat-item').forEach((el, i) => {
        el.classList.toggle('seleccionat', i === 0);
    });

    actualitzarEstilHabit('fumador',  'no');
    actualitzarEstilHabit('vegetaria', 'no');

    ['barra-pressio-max', 'barra-pressio-min', 'barra-frequencia'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = 'pressio-barra';
    });

    console.log('🧹 Formulari netejat');
}

// ============================================
// EXPORTAR
// ============================================
window.formulari = {
    inicialitzarFormulari,
    processarFormulari,
    netejarFormulari
};