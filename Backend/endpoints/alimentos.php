<?php
/**
 * Endpoint: Aliments
 * GET /api/lstyle/alimentos.php
 * Paràmetres opcionals: ?categoria_id=X&estacion_id=Y
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
    $query = "SELECT * FROM alimentos WHERE 1=1";
    $params = [];

    // Filtrar per categoria
    if (isset($_GET['categoria_id']) && is_numeric($_GET['categoria_id'])) {
        $query .= " AND categoria_id = ?";
        $params[] = (int)$_GET['categoria_id'];
    }

    // Filtrar per estació (columna estacion_id INT a MariaDB)
    // IMPORTANT: l'esquema NO té JSON "estaciones_disponibles"; cada aliment
    // està lligat a UNA estació mitjançant la clau forana estacion_id.
    if (isset($_GET['estacion_id']) && is_numeric($_GET['estacion_id'])) {
        $query .= " AND estacion_id = ?";
        $params[] = (int)$_GET['estacion_id'];
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
