<?php
/**
 * Endpoint: Consells per condicions de salut
 * GET /api/lstyle/consejos.php
 * Paràmetre opcional: ?condicion_id=X
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
    $query = "SELECT * FROM consejos_condiciones WHERE 1=1";
    $params = [];

    // Filtrar per condició
    if (isset($_GET['condicion_id']) && is_numeric($_GET['condicion_id'])) {
        $query .= " AND condicion_id = ?";
        $params[] = (int)$_GET['condicion_id'];
    }

    $results = executeQuery($query, $params);

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
