<?php
/**
 * Middleware d'autenticació amb API Key
 *
 * Compatible amb Nginx + PHP-FPM (getallheaders() només existeix a Apache).
 */

// API Key vàlida
define('API_KEY', 'IYHb6wN3G6Pzf4MH8IDr58e4e4dQrcg8xTDoazZK52717e61');

/**
 * Obtenir capçaleres HTTP de forma segura (Apache o Nginx/PHP-FPM)
 * @return array
 */
function obtenirCapcaleresPeticio() {
    // Apache / alguns SAPI
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        return is_array($headers) ? $headers : [];
    }

    // Nginx + PHP-FPM: reconstruir des de $_SERVER
    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (strpos($name, 'HTTP_') === 0) {
            // HTTP_X_API_KEY → X-Api-Key (normalitzem després amb cerca flexible)
            $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
            $headers[$key] = $value;
        }
    }
    return $headers;
}

/**
 * Cercar una capçalera ignorant majúscules/minúscules
 * @param array $headers
 * @param string $nomBuscat Ex: X-API-Key
 * @return string|null
 */
function obtenirValorCapcalera(array $headers, $nomBuscat) {
    foreach ($headers as $nom => $valor) {
        if (strcasecmp($nom, $nomBuscat) === 0) {
            return $valor;
        }
    }
    return null;
}

/**
 * Verificar API Key
 * @return bool True si l'API Key és vàlida
 */
function verifyApiKey() {
    $headers = obtenirCapcaleresPeticio();
    $apiKey = obtenirValorCapcalera($headers, 'X-API-Key');

    // Fallback directe (Nginx/PHP-FPM)
    if (!$apiKey && isset($_SERVER['HTTP_X_API_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'];
    }

    if (!$apiKey || $apiKey !== API_KEY) {
        http_response_code(401);
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => 'API Key missing or invalid'
        ]);
        exit;
    }

    return true;
}

/**
 * Aplicar autenticació (cridar a l'inici de cada endpoint)
 */
function requireAuth() {
    verifyApiKey();
}
