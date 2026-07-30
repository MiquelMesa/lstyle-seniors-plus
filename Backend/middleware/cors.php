<?php
/**
 * Middleware CORS per permetre peticions des del frontend
 */

/**
 * Configurar headers CORS
 */
function enableCORS() {
    // Permetre origen específic (canviar si es puja a producció)
    $allowedOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        'https://michaelprojects.org',
        'file://' // Per desenvolupament local
    ];

    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    // Si l'origen està permès o és desenvolupament local
    if (in_array($origin, $allowedOrigins) || strpos($origin, 'file://') === 0 || strpos($origin, 'http://localhost:') === 0) {
        header("Access-Control-Allow-Origin: " . $origin);
        header("Access-Control-Allow-Credentials: true");
    } else if ($origin === '') {
        // Per a peticions sense origen (alguns navegadors)
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
    header("Access-Control-Max-Age: 3600");
    header("Content-Type: application/json; charset=UTF-8");

    // Respondre a preflight OPTIONS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
