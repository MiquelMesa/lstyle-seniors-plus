/**
 * Configuració de l'API REST - MariaDB (VPS)
 * Backend: https://michaelprojects.org/lstyle-seniors-plus/api/endpoints/
 *
 * IMPORTANT: Els fitxers PHP estan a Backend/ (config, middleware, endpoints).
 * Al servidor: /var/www/michaelprojects/lstyle-seniors-plus/api/
 */

const API_CONFIG = {
    // URL base de l'API (carpeta endpoints al VPS)
    BASE_URL: 'https://michaelprojects.org/lstyle-seniors-plus/Backend/endpoints',
    
    // API Key per autenticació (coincideix amb middleware/auth.php)
    API_KEY: 'IYHb6wN3G6Pzf4MH8IDr58e4e4dQrcg8xTDoazZK52717e61',
    
    // Endpoints disponibles
    ENDPOINTS: {
        ESTACIONES: '/estaciones.php',
        CONDICIONES: '/condiciones.php',
        ACTIVIDAD: '/actividad.php',
        CATEGORIAS: '/categorias.php',
        ALIMENTOS: '/alimentos.php',
        CONSEJOS: '/consejos.php',
        TELEFONOS: '/telefonos.php',
        RANGOS_IMC: '/rangos-imc.php',
        FORMULAS: '/formulas.php',
        CONFIG: '/config.php'
    },
    
    // Opcions globals de fetch
    TIMEOUT: 15000, // 15 segons
    
    // Headers per defecte
    getHeaders() {
        return {
            'X-API-Key': this.API_KEY,
            'Content-Type': 'application/json'
        };
    },
    
    // Construir URL completa
    getUrl(endpoint) {
        return `${this.BASE_URL}${endpoint}`;
    }
};

// Fer disponible globalment
window.API_CONFIG = API_CONFIG;
