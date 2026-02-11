/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Gestió del Formulari d'Entrada de Dades
 * ============================================
 */

/**
 * Inicialitza el formulari d'entrada de dades
 */
function inicialitzarFormulari() {
    console.log('📝 Inicialitzant formulari...');
    
    try {
        // 1. Carregar condicions de salut dinàmicament
        carregarCondicionsFormulari();
        
        // 2. Carregar nivells d'activitat física
        carregarActivitatFisica();
        
        // 3. Inicialitzar validacions en temps real
        inicialitzarValidacions();
        
        // 4. Event submit del formulari
        const formulari = document.getElementById('formulari-dades');
        if (formulari) {
            formulari.addEventListener('submit', processarFormulari);
        }
        
        // 5. Event botó netejar
        const btnNetejar = document.getElementById('btn-netejar');
        if (btnNetejar) {
            btnNetejar.addEventListener('click', netejarFormulari);
        }
        
        console.log('✅ Formulari inicialitzat correctament');
        
    } catch (error) {
        console.error('❌ Error inicialitzant formulari:', error);
    }
}

/**
 * Carrega les condicions de salut des de Supabase i crea els checkboxes
 */
function carregarCondicionsFormulari() {
    const contenidor = document.getElementById('contenidor-condicions');
    
    if (!contenidor) {
        console.error('❌ Contenidor condicions no trobat');
        return;
    }
    
    if (!window.app || !window.app.dadesApp.condicionsSalut) {
        console.error('❌ Dades de condicions no disponibles');
        return;
    }
    
    const condicions = window.app.dadesApp.condicionsSalut;
    
    if (condicions.length === 0) {
        contenidor.innerHTML = '<p class="text-center">No hi ha condicions disponibles</p>';
        return;
    }
    
    // Netejar contenidor
    contenidor.innerHTML = '';
    
    // Crear checkbox per cada condició
    condicions.forEach(condicio => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `condicio-${condicio.id}`;
        checkbox.name = 'condicions';
        checkbox.value = condicio.id;
        checkbox.dataset.codi = condicio.codigo;
        
        const label = document.createElement('label');
        label.htmlFor = `condicio-${condicio.id}`;
        label.className = 'checkbox-label';
        label.textContent = condicio.nombre_ca;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        contenidor.appendChild(checkboxItem);
        
        // Event canvi
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkboxItem.style.borderColor = 'var(--color-primari)';
            } else {
                checkboxItem.style.borderColor = 'transparent';
            }
        });
    });
    
    console.log(`✅ ${condicions.length} condicions de salut carregades`);
}

/**
 * Carrega els nivells d'activitat física des de Supabase
 */
function carregarActivitatFisica() {
    const contenidor = document.getElementById('contenidor-activitat');
    
    if (!contenidor) {
        console.error('❌ Contenidor activitat no trobat');
        return;
    }
    
    if (!window.app || !window.app.dadesApp.factorsActivitat) {
        console.error('❌ Dades d\'activitat no disponibles');
        return;
    }
    
    const activitats = window.app.dadesApp.factorsActivitat;
    
    if (activitats.length === 0) {
        contenidor.innerHTML = '<p>No hi ha nivells d\'activitat disponibles</p>';
        return;
    }
    
    // Netejar contenidor
    contenidor.innerHTML = '';
    
    // Crear radio per cada nivell d'activitat
    activitats.forEach((activitat, index) => {
        const radioLabel = document.createElement('label');
        radioLabel.className = 'radio-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `activitat-${activitat.id}`;
        radio.name = 'activitat';
        radio.value = activitat.nivel;
        radio.required = true;
        radio.dataset.factor = activitat.factor_tmb;
        
        // Marcar el primer com a seleccionat per defecte
        if (index === 0) {
            radio.checked = true;
        }
        
        const span = document.createElement('span');
        
        const textContainer = document.createElement('div');
        const textNom = document.createElement('strong');
        textNom.textContent = activitat.nombre_ca;
        
        const textDesc = document.createElement('div');
        textDesc.className = 'radio-descripcio';
        textDesc.textContent = activitat.descripcion_ca;
        
        textContainer.appendChild(textNom);
        textContainer.appendChild(textDesc);
        
        span.appendChild(textContainer);
        
        radioLabel.appendChild(radio);
        radioLabel.appendChild(span);
        contenidor.appendChild(radioLabel);
    });
    
    console.log(`✅ ${activitats.length} nivells d'activitat carregats`);
}

/**
 * Inicialitza les validacions en temps real
 */
function inicialitzarValidacions() {
    // Validació Nom
    const inputNom = document.getElementById('nom');
    if (inputNom) {
        inputNom.addEventListener('blur', () => validarNom());
        inputNom.addEventListener('input', () => netejarError('nom'));
    }
    
    // Validació Edat
    const inputEdat = document.getElementById('edat');
    if (inputEdat) {
        inputEdat.addEventListener('blur', () => validarEdat());
        inputEdat.addEventListener('input', () => netejarError('edat'));
    }
    
    // Validació Alçada
    const inputAlcadaMin = document.getElementById('alcada-min');
    const inputAlcadaMax = document.getElementById('alcada-max');
    if (inputAlcadaMin) {
        inputAlcadaMin.addEventListener('blur', () => validarAlcada());
        inputAlcadaMin.addEventListener('input', () => netejarError('alcada'));
    }
    if (inputAlcadaMax) {
        inputAlcadaMax.addEventListener('blur', () => validarAlcada());
        inputAlcadaMax.addEventListener('input', () => netejarError('alcada'));
    }
    
    // Validació Pes
    const inputPesMin = document.getElementById('pes-min');
    const inputPesMax = document.getElementById('pes-max');
    if (inputPesMin) {
        inputPesMin.addEventListener('blur', () => validarPes());
        inputPesMin.addEventListener('input', () => netejarError('pes'));
    }
    if (inputPesMax) {
        inputPesMax.addEventListener('blur', () => validarPes());
        inputPesMax.addEventListener('input', () => netejarError('pes'));
    }
    
    // Validació Sexe
    const selectSexe = document.getElementById('sexe');
    if (selectSexe) {
        selectSexe.addEventListener('change', () => {
            validarSexe();
            netejarError('sexe');
        });
    }
}

/**
 * Validació del nom
 */
function validarNom() {
    const input = document.getElementById('nom');
    const valor = input.value.trim();
    
    if (!valor || valor.length === 0) {
        mostrarError('nom', 'El nom és obligatori');
        return false;
    }
    
    if (valor.length < 2) {
        mostrarError('nom', 'El nom ha de tenir almenys 2 caràcters');
        return false;
    }
    
    if (valor.length > 100) {
        mostrarError('nom', 'El nom és massa llarg (màxim 100 caràcters)');
        return false;
    }
    
    // Validació exitosa
    input.classList.remove('error');
    input.classList.add('exit');
    netejarError('nom');
    return true;
}

/**
 * Validació de l'edat
 */
function validarEdat() {
    const input = document.getElementById('edat');
    const valor = parseInt(input.value);
    
    if (!valor || isNaN(valor)) {
        mostrarError('edat', 'L\'edat és obligatòria');
        return false;
    }
    
    if (valor < 60) {
        mostrarError('edat', 'Aquesta aplicació és per a persones de 60 anys o més');
        return false;
    }
    
    if (valor > 120) {
        mostrarError('edat', 'Si us plau, introdueix una edat vàlida');
        return false;
    }
    
    // Validació exitosa
    input.classList.remove('error');
    input.classList.add('exit');
    netejarError('edat');
    return true;
}

/**
 * Validació de l'alçada
 */
function validarAlcada() {
    const inputMin = document.getElementById('alcada-min');
    const inputMax = document.getElementById('alcada-max');
    
    const valorMin = parseFloat(inputMin.value);
    const valorMax = inputMax.value ? parseFloat(inputMax.value) : null;
    
    if (!valorMin || isNaN(valorMin)) {
        mostrarError('alcada', 'L\'alçada és obligatòria');
        inputMin.classList.add('error');
        return false;
    }
    
    if (valorMin < 100 || valorMin > 250) {
        mostrarError('alcada', 'L\'alçada ha d\'estar entre 100 i 250 cm');
        inputMin.classList.add('error');
        return false;
    }
    
    if (valorMax !== null) {
        if (valorMax < valorMin) {
            mostrarError('alcada', 'L\'alçada màxima ha de ser superior a la mínima');
            inputMax.classList.add('error');
            return false;
        }
        
        if (valorMax - valorMin > 10) {
            mostrarError('alcada', 'El rang d\'alçada sembla massa ampli (màxim 10 cm de diferència)');
            inputMax.classList.add('error');
            return false;
        }
    }
    
    // Validació exitosa
    inputMin.classList.remove('error');
    inputMin.classList.add('exit');
    if (inputMax.value) {
        inputMax.classList.remove('error');
        inputMax.classList.add('exit');
    }
    netejarError('alcada');
    return true;
}

/**
 * Validació del pes
 */
function validarPes() {
    const inputMin = document.getElementById('pes-min');
    const inputMax = document.getElementById('pes-max');
    
    const valorMin = parseFloat(inputMin.value);
    const valorMax = inputMax.value ? parseFloat(inputMax.value) : null;
    
    if (!valorMin || isNaN(valorMin)) {
        mostrarError('pes', 'El pes és obligatori');
        inputMin.classList.add('error');
        return false;
    }
    
    if (valorMin < 30 || valorMin > 300) {
        mostrarError('pes', 'El pes ha d\'estar entre 30 i 300 kg');
        inputMin.classList.add('error');
        return false;
    }
    
    if (valorMax !== null) {
        if (valorMax < valorMin) {
            mostrarError('pes', 'El pes màxim ha de ser superior al mínim');
            inputMax.classList.add('error');
            return false;
        }
        
        if (valorMax - valorMin > 5) {
            mostrarError('pes', 'El rang de pes sembla massa ampli (màxim 5 kg de diferència)');
            inputMax.classList.add('error');
            return false;
        }
    }
    
    // Validació exitosa
    inputMin.classList.remove('error');
    inputMin.classList.add('exit');
    if (inputMax.value) {
        inputMax.classList.remove('error');
        inputMax.classList.add('exit');
    }
    netejarError('pes');
    return true;
}

/**
 * Validació del sexe
 */
function validarSexe() {
    const select = document.getElementById('sexe');
    
    if (!select.value) {
        mostrarError('sexe', 'El sexe és obligatori');
        select.classList.add('error');
        return false;
    }
    
    select.classList.remove('error');
    select.classList.add('exit');
    netejarError('sexe');
    return true;
}

/**
 * Mostra un missatge d'error
 */
function mostrarError(camp, missatge) {
    const errorDiv = document.getElementById(`error-${camp}`);
    if (errorDiv) {
        errorDiv.textContent = missatge;
        errorDiv.classList.add('actiu');
    }
    
    const input = document.getElementById(camp) || 
                  document.getElementById(`${camp}-min`) ||
                  document.querySelector(`[name="${camp}"]`);
    if (input) {
        input.classList.add('error');
        input.classList.remove('exit');
    }
}

/**
 * Neteja un missatge d'error
 */
function netejarError(camp) {
    const errorDiv = document.getElementById(`error-${camp}`);
    if (errorDiv) {
        errorDiv.classList.remove('actiu');
    }
}

/**
 * Processa el formulari quan es fa submit
 */
function processarFormulari(event) {
    event.preventDefault();
    
    console.log('📋 Processant formulari...');
    
    // Validar tots els camps obligatoris
    const validNom = validarNom();
    const validEdat = validarEdat();
    const validSexe = validarSexe();
    const validAlcada = validarAlcada();
    const validPes = validarPes();
    
    if (!validNom || !validEdat || !validSexe || !validAlcada || !validPes) {
        console.error('❌ Formulari amb errors');
        alert('Si us plau, revisa els camps marcats en vermell');
        
        // Scroll al primer error
        const primerError = document.querySelector('.input-formulari.error');
        if (primerError) {
            primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            primerError.focus();
        }
        
        return;
    }
    
    // Recollir totes les dades del formulari
    const dades = recollidaDadesFormulari();
    
    console.log('✅ Dades del formulari:', dades);
    
    // Guardar dades a la sessió
    sessionStorage.setItem('dadesUsuari', JSON.stringify(dades));
    
    // Passar a la pantalla de resultats
    window.app.ocultarPantalla('pantalla-entrada-dades');
    window.app.mostrarPantalla('pantalla-resultats');
}

/**
 * Recull totes les dades del formulari
 */
function recollidaDadesFormulari() {
    // Dades personals
    const nom = document.getElementById('nom').value.trim();
    const sexe = document.getElementById('sexe').value;
    const edat = parseInt(document.getElementById('edat').value);
    
    // Alçada (calcular mitjana si hi ha rang)
    const alcadaMin = parseFloat(document.getElementById('alcada-min').value);
    const alcadaMax = document.getElementById('alcada-max').value ? 
                      parseFloat(document.getElementById('alcada-max').value) : null;
    const alcada = alcadaMax ? (alcadaMin + alcadaMax) / 2 : alcadaMin;
    
    // Pes (calcular mitjana si hi ha rang)
    const pesMin = parseFloat(document.getElementById('pes-min').value);
    const pesMax = document.getElementById('pes-max').value ? 
                   parseFloat(document.getElementById('pes-max').value) : null;
    const pes = pesMax ? (pesMin + pesMax) / 2 : pesMin;
    
    // Perímetre cintura (opcional)
    const cinturaMin = document.getElementById('cintura-min').value ? 
                       parseFloat(document.getElementById('cintura-min').value) : null;
    const cinturaMax = document.getElementById('cintura-max').value ? 
                       parseFloat(document.getElementById('cintura-max').value) : null;
    const cintura = cinturaMin ? (cinturaMax ? (cinturaMin + cinturaMax) / 2 : cinturaMin) : null;
    
    // Pressió arterial (opcional)
    const pressioMax = document.getElementById('pressio-max').value ? 
                       parseInt(document.getElementById('pressio-max').value) : null;
    const pressioMin = document.getElementById('pressio-min').value ? 
                       parseInt(document.getElementById('pressio-min').value) : null;
    const frequencia = document.getElementById('frequencia').value ? 
                       parseInt(document.getElementById('frequencia').value) : null;
    
    // Condicions de salut
    const condicions = Array.from(document.querySelectorAll('input[name="condicions"]:checked'))
                            .map(cb => ({
                                id: parseInt(cb.value),
                                codi: cb.dataset.codi
                            }));
    
    // Activitat física
    const activitatRadio = document.querySelector('input[name="activitat"]:checked');
    const activitat = activitatRadio ? {
        nivel: activitatRadio.value,
        factor: parseFloat(activitatRadio.dataset.factor)
    } : null;
    
    // Hàbits
    const fumador = document.querySelector('input[name="fumador"]:checked').value === 'si';
    const vegetaria = document.querySelector('input[name="vegetaria"]:checked').value === 'si';
    
    return {
        nom,
        sexe,
        edat,
        alcada,
        alcadaMin,
        alcadaMax,
        pes,
        pesMin,
        pesMax,
        cintura,
        cinturaMin,
        cinturaMax,
        pressioMax,
        pressioMin,
        frequencia,
        condicions,
        activitat,
        fumador,
        vegetaria,
        dataEntrada: new Date().toISOString()
    };
}

/**
 * Neteja tot el formulari
 */
function netejarFormulari() {
    if (confirm('Estàs segur que vols netejar tot el formulari?')) {
        const formulari = document.getElementById('formulari-dades');
        if (formulari) {
            formulari.reset();
            
            // Netejar tots els errors
            document.querySelectorAll('.error-formulari').forEach(error => {
                error.classList.remove('actiu');
            });
            
            // Netejar classes d'error i èxit
            document.querySelectorAll('.input-formulari, .select-formulari').forEach(input => {
                input.classList.remove('error', 'exit');
            });
            
            console.log('🧹 Formulari netejat');
        }
    }
}

// Exportar funcions
window.formulari = {
    inicialitzarFormulari,
    processarFormulari,
    netejarFormulari
};