/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Mòdul de Seguretat
 * ============================================
 * 
 * Implementa:
 * - Xifratge AES-256-GCM per a dades sensibles
 * - Validació d'inputs
 * - Sanitització de dades
 * - Content Security Policy
 */

const Seguretat = 
{
    
    /**
     * Genera una clau de xifratge a partir d'una contrasenya
     * @param {string} password - Contrasenya base
     * @returns {Promise<CryptoKey>} Clau de xifratge
     */

    async generarClau(password) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('lstyle-seniors-plus-2024'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },
    
    /**
     * Xifra dades usant AES-256-GCM
     * @param {string} dades - Dades a xifrar
     * @param {string} password - Contrasenya de xifratge
     * @returns {Promise<string>} Dades xifrades en Base64
     */

    async xifrar(dades, password = 'lstyle-default-key-2024') {
        try {
            const encoder = new TextEncoder();
            const clau = await this.generarClau(password);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const xifrat = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                clau,
                encoder.encode(dades)
            );
            
            // Combinar IV + dades xifrades

            const combinat = new Uint8Array(iv.length + xifrat.byteLength);
            combinat.set(iv, 0);
            combinat.set(new Uint8Array(xifrat), iv.length);
            
            // Convertir a Base64

            return btoa(String.fromCharCode.apply(null, combinat));
        } catch (error) {
            console.error('Error al xifrar:', error);
            throw new Error('Error en el xifratge de dades');
        }
    },
    
    /**
     * Desxifra dades xifrades amb AES-256-GCM
     * @param {string} dadesXifrades - Dades xifrades en Base64
     * @param {string} password - Contrasenya de desxifratge
     * @returns {Promise<string>} Dades desxifrades
     */

    async desxifrar(dadesXifrades, password = 'lstyle-default-key-2024') {
        try {
            const decoder = new TextDecoder();
            const clau = await this.generarClau(password);
            
            // Convertir de Base64

            const combinat = new Uint8Array(
                atob(dadesXifrades).split('').map(c => c.charCodeAt(0))
            );
            
            // Separar IV i dades xifrades

            const iv = combinat.slice(0, 12);
            const xifrat = combinat.slice(12);
            
            const desxifrat = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                clau,
                xifrat
            );
            
            return decoder.decode(desxifrat);
        } catch (error) {
            console.error('Error al desxifrar:', error);
            throw new Error('Error en el desxifratge de dades');
        }
    },
    
    /**
     * Valida que un input sigui un número positiu
     * @param {any} valor - Valor a validar
     * @param {number} min - Valor mínim permès
     * @param {number} max - Valor màxim permès
     * @returns {boolean} true si és vàlid
     */

    validarNumeroPositiu(valor, min = 0, max = Infinity) {
        const num = parseFloat(valor);
        return !isNaN(num) && num >= min && num <= max;
    },
    
    /**
     * Sanititza un string per prevenir XSS
     * @param {string} str - String a sanititzar
     * @returns {string} String sanititzat
     */

    sanititzarString(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    /**
     * Valida format d'email
     * @param {string} email - Email a validar
     * @returns {boolean} true si és vàlid
     */

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    /**
     * Prevé injecció SQL en strings
     * @param {string} str - String a netejar
     * @returns {string} String net
     */

    prevenirSQLInjection(str) {
        if (typeof str !== 'string') return str;
        
        // Com que Supabase usa queries parametritzades, però afegim validació extra

        const perillosos = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE'];
        let net = str;
        
        perillosos.forEach(patro => {
            net = net.replace(new RegExp(patro, 'gi'), '');
        });
        
        return net.trim();
    },
    
    /**
     * Valida que les dades de l'usuari siguin segures abans de desar
     * @param {Object} dadesUsuari - Dades de l'usuari
     * @returns {Object} Objecte amb {valid: boolean, errors: array}
     */
    
    validarDadesUsuari(dadesUsuari) {
        const errors = [];
        
        // Validar nom (obligatori, màx 100 caràcters)
    
        if (!dadesUsuari.nom || dadesUsuari.nom.trim().length === 0) {
            errors.push('El nom és obligatori');
        } else if (dadesUsuari.nom.length > 100) {
            errors.push('El nom és massa llarg (màx 100 caràcters)');
        }
        
        // Validar edat (obligatori, entre 60 i 120)
    
        if (!this.validarNumeroPositiu(dadesUsuari.edat, 60, 120)) {
            errors.push('L\'edat ha d\'estar entre 60 i 120 anys');
        }
        
        // Validar alçada (obligatori, entre 100 i 250 cm)
    
        if (!this.validarNumeroPositiu(dadesUsuari.alcada, 100, 250)) {
            errors.push('L\'alçada ha d\'estar entre 100 i 250 cm');
        }
        
        // Validar pes (obligatori, entre 30 i 300 kg)
    
        if (!this.validarNumeroPositiu(dadesUsuari.pes, 30, 300)) {
            errors.push('El pes ha d\'estar entre 30 i 300 kg');
        }
        
        // Validar perímetre cintura (opcional, entre 40 i 200 cm)
    
        if (dadesUsuari.perimetreCintura && 
            !this.validarNumeroPositiu(dadesUsuari.perimetreCintura, 40, 200)) {
            errors.push('El perímetre de cintura ha d\'estar entre 40 i 200 cm');
        }
        
        // Validar pressió arterial
    
        if (dadesUsuari.pressioMax && 
            !this.validarNumeroPositiu(dadesUsuari.pressioMax, 60, 250)) {
            errors.push('La pressió màxima ha d\'estar entre 60 i 250 mmHg');
        }
        
        if (dadesUsuari.pressioMin && 
            !this.validarNumeroPositiu(dadesUsuari.pressioMin, 40, 150)) {
            errors.push('La pressió mínima ha d\'estar entre 40 i 150 mmHg');
        }
        
        if (dadesUsuari.frequenciaCardiaca && 
            !this.validarNumeroPositiu(dadesUsuari.frequenciaCardiaca, 40, 200)) {
            errors.push('La freqüència cardíaca ha d\'estar entre 40 i 200 ppm');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Implementa Content Security Policy via meta tag
     */
    
    aplicarCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.supabase.co",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co https://api.groq.com https://cdn.jsdelivr.net",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');
        
        document.head.appendChild(meta);
    }

};

// Aplicar CSP al carregar

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Seguretat.aplicarCSP());
} else {
    Seguretat.aplicarCSP();
}

// Exportar si uses mòduls
// export default Seguretat;