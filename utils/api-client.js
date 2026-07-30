/**
 * Client API per comunicació amb el backend MariaDB
 * Gestiona peticions GET/POST amb autenticació, control d'errors
 * i caché local de 30 dies (configurable via config_app.dias_actualizacion)
 */

class ApiClient {

    // ============================================
    // CONFIGURACIÓ DE LA CACHÉ
    // ============================================

    /** Clau localStorage per al paquet de dades de l'API */
    static CACHE_KEY = 'lstyle_api_cache_v1';

    /** Versió de l'estructura de caché (incrementar si canvia el format) */
    static CACHE_VERSION = '1.0';

    /** Dies de validesa per defecte si l'API no retorna config */
    static CACHE_DIES_DEFECTE = 30;

    // ============================================
    // CACHÉ — LECTURA / ESCRITURA
    // ============================================

    /**
     * Llegeix la caché del localStorage.
     * @param {boolean} permetreCaducada - Si true, retorna dades encara que hagin caducat
     * @returns {Object|null}
     */
    static llegirCache(permetreCaducada = false) {
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            if (!raw) return null;

            const cache = JSON.parse(raw);

            if (cache.version !== this.CACHE_VERSION) {
                console.warn('[Cache] Versió incompatible, s\'ignora la caché');
                return null;
            }

            if (!permetreCaducada && cache.expiresAt) {
                if (Date.now() > new Date(cache.expiresAt).getTime()) {
                    console.log('[Cache] Caché caducada');
                    return null;
                }
            }

            return cache;
        } catch (err) {
            console.warn('[Cache] Error llegint caché:', err);
            return null;
        }
    }

    /**
     * Desa el paquet de dades a localStorage amb data de caducitat.
     * @param {Object} dades - Resultat de carregarDadesInicials
     * @param {number} dies - Dies de validesa (de config_app)
     */
    static desarCache(dades, dies) {
        const diesValidesa = dies || this.CACHE_DIES_DEFECTE;
        const ara = new Date();
        const caducitat = new Date(ara.getTime() + diesValidesa * 24 * 60 * 60 * 1000);

        const cache = {
            version: this.CACHE_VERSION,
            timestamp: ara.toISOString(),
            expiresAt: caducitat.toISOString(),
            diasActualizacion: diesValidesa,
            data: dades
        };

        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
            console.log(`[Cache] Dades desades (${diesValidesa} dies de validesa, caduca: ${caducitat.toLocaleDateString('ca-ES')})`);
        } catch (err) {
            // Quota excedida o mode privat — l'app funciona sense persistència
            console.warn('[Cache] No s\'han pogut desar les dades:', err);
        }
    }

    /**
     * Esborra la caché (útil per depuració o forçar recàrrega).
     */
    static esborrarCache() {
        localStorage.removeItem(this.CACHE_KEY);
        console.log('[Cache] Caché esborrada');
    }

    /**
     * Retorna informació de l'estat de la caché (per depuració).
     * @returns {Object|null}
     */
    static obtenirInfoCache() {
        const cache = this.llegirCache(true);
        if (!cache) return null;

        const caducada = Date.now() > new Date(cache.expiresAt).getTime();

        return {
            version: cache.version,
            desada: cache.timestamp,
            caduca: cache.expiresAt,
            caducada,
            diesValidesa: cache.diasActualizacion,
            aliments: cache.data?.aliments?.length || 0,
            condicions: cache.data?.condicions?.length || 0
        };
    }

    // ============================================
    // PETICIONS HTTP
    // ============================================

    /**
     * Petició GET a un endpoint (sense caché individual — usa carregarDadesInicials).
     * @param {string} endpoint - Nom de l'endpoint (ex: ESTACIONES)
     * @param {object} params - Paràmetres query opcionals
     * @param {object} opcions - { bypassCache: false }
     * @returns {Promise<any>}
     */
    static async get(endpoint, params = {}, opcions = {}) {
        try {
            const url = new URL(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS[endpoint]));
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    url.searchParams.append(key, params[key]);
                }
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: API_CONFIG.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`[API Error] GET ${endpoint}:`, error);

            if (error.name === 'AbortError') {
                throw new Error('Temps d\'espera esgotat. Comprova la connexió.');
            }

            throw new Error(`Error carregant dades: ${error.message}`);
        }
    }

    /**
     * Petició POST a un endpoint
     * @param {string} endpoint - Nom de l'endpoint
     * @param {object} body - Dades a enviar
     * @returns {Promise<any>}
     */
    static async post(endpoint, body = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

            const response = await fetch(
                API_CONFIG.getUrl(API_CONFIG.ENDPOINTS[endpoint]),
                {
                    method: 'POST',
                    headers: API_CONFIG.getHeaders(),
                    body: JSON.stringify(body),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`[API Error] POST ${endpoint}:`, error);

            if (error.name === 'AbortError') {
                throw new Error('Temps d\'espera esgotat. Comprova la connexió.');
            }

            throw new Error(`Error enviant dades: ${error.message}`);
        }
    }

    // ============================================
    // CÀRREGA DE DADES (AMB CACHÉ 30 DIES)
    // ============================================

    /**
     * Descarrega totes les dades de l'API sense usar caché.
     * @returns {Promise<object>}
     */
    static async descarregarDadesAPI() {
        const [
            estacions,
            condicions,
            activitats,
            categories,
            aliments,
            consells,
            telefonos,
            rangosImc,
            formules,
            config
        ] = await Promise.all([
            this.get('ESTACIONES'),
            this.get('CONDICIONES'),
            this.get('ACTIVIDAD'),
            this.get('CATEGORIAS'),
            this.get('ALIMENTOS'),
            this.get('CONSEJOS'),
            this.get('TELEFONOS'),
            this.get('RANGOS_IMC'),
            this.get('FORMULAS'),
            this.get('CONFIG')
        ]);

        return {
            estacions,
            condicions,
            activitats,
            categories,
            aliments,
            consells,
            telefonos,
            rangosImc,
            formules,
            config
        };
    }

    /**
     * Carrega totes les dades necessàries per l'aplicació.
     * Usa caché local si és vàlida (< dias_actualizacion dies).
     * Si l'API falla, usa caché caducada com a reserva.
     *
     * @param {object} opcions - { forcarRecarrega: false }
     * @returns {Promise<object>}
     */
    static async carregarDadesInicials(opcions = {}) {
        const forcar = opcions.forcarRecarrega === true;

        // 1. Intentar servir des de caché vàlida
        if (!forcar) {
            const cache = this.llegirCache(false);
            if (cache?.data) {
                console.log('[Cache] Dades carregades des de caché local');
                return cache.data;
            }
        }

        // 2. Descarregar de l'API
        try {
            console.log('[API] Descarregant dades de l\'API...');
            const dades = await this.descarregarDadesAPI();

            const dies = dades.config?.dias_actualizacion || this.CACHE_DIES_DEFECTE;
            this.desarCache(dades, dies);

            console.log('[API] Dades descarregades i desades a caché');
            return dades;

        } catch (error) {
            console.error('[API Error] Carregant dades inicials:', error);

            // 3. Reserva: caché caducada si l'API no respon
            const cacheCaducada = this.llegirCache(true);
            if (cacheCaducada?.data) {
                console.warn('[Cache] API no disponible — usant caché caducada com a reserva');
                return cacheCaducada.data;
            }

            throw error;
        }
    }

    /**
     * Comprova la connexió amb l'API.
     * Retorna true si l'API respon O si hi ha caché local utilitzable.
     * @returns {Promise<boolean>}
     */
    static async comprovarConnexio() {
        try {
            await this.get('CONFIG');
            return true;
        } catch (error) {
            console.error('[API Error] Connexió fallida:', error);

            const cache = this.llegirCache(true);
            if (cache?.data) {
                console.log('[Cache] Sense connexió API, però hi ha caché local disponible');
                return true;
            }

            return false;
        }
    }
}

// Fer disponible globalment
window.ApiClient = ApiClient;
