<?php
/**
 * Endpoint: Telèfons d'emergència
 * GET /api/lstyle/telefonos.php
 */

require_once '../config/database.php';
require_once '../middleware/cors.php';
require_once '../middleware/auth.php';
require_once '../middleware/rate-limit.php';

enableCORS();
requireAuth();
checkRateLimit();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $query = "SELECT * FROM telefonos_emergencia ORDER BY orden";
    $results = executeQuery($query);

    if ($results === false) {
        throw new Exception('Database query failed');
    }

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage()
    ]);
}
