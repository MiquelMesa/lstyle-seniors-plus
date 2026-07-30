<?php
/**
 * Middleware de Rate Limiting
 * Limita peticions per IP per prevenir abusos
 */

// Configuració
define('RATE_LIMIT_REQUESTS', 100); // Màxim peticions
define('RATE_LIMIT_WINDOW', 60);    // Finestra de temps (segons)

/**
 * Comprovar límit de peticions
 */
function checkRateLimit() {
    $ip = getClientIP();
    $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip) . '.json';

    // Llegir dades del cache
    $data = [];
    if (file_exists($cacheFile)) {
        $content = file_get_contents($cacheFile);
        $data = json_decode($content, true);
    }

    $now = time();
    $windowStart = $now - RATE_LIMIT_WINDOW;

    // Netejar peticions antigues
    if (isset($data['requests'])) {
        $data['requests'] = array_filter($data['requests'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
    } else {
        $data['requests'] = [];
    }

    // Comprovar límit
    if (count($data['requests']) >= RATE_LIMIT_REQUESTS) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Too Many Requests',
            'message' => 'Rate limit exceeded. Try again later.'
        ]);
        exit;
    }

    // Afegir petició actual
    $data['requests'][] = $now;

    // Guardar al cache
    file_put_contents($cacheFile, json_encode($data));
}

/**
 * Obtenir IP del client
 */
function getClientIP() {
    if (isset($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP']; // Cloudflare
    }
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    return $_SERVER['REMOTE_ADDR'];
}
