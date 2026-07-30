<?php
/**
 * Configuració de connexió a MariaDB (Hostinger)
 * Base de dades: lstyle_seniors_plus
 */

// Configuració
define('DB_HOST', 'localhost'); // o 'michaelprojects.org' si no funciona localhost
define('DB_NAME', 'lstyle_seniors_plus');
define('DB_USER', 'lstyle_seniors_plus');
define('DB_PASS', 'Lstyle_Seniors_Plus_2026_@');
define('DB_CHARSET', 'utf8mb4');

/**
 * Crear connexió a la base de dades
 * @return PDO|null Connexió PDO o null si hi ha error
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;

    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        return null;
    }
}

/**
 * Executar query SELECT
 * @param string $query Query SQL amb placeholders
 * @param array $params Paràmetres per prepared statement
 * @return array|false Resultats o false si hi ha error
 */
function executeQuery($query, $params = []) {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        return false;
    }

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Query error: " . $e->getMessage());
        return false;
    }
}

/**
 * Executar query INSERT/UPDATE/DELETE
 * @param string $query Query SQL amb placeholders
 * @param array $params Paràmetres per prepared statement
 * @return bool True si ha tingut èxit, false altrament
 */
function executeUpdate($query, $params = []) {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        return false;
    }

    try {
        $stmt = $pdo->prepare($query);
        return $stmt->execute($params);
    } catch (PDOException $e) {
        error_log("Update error: " . $e->getMessage());
        return false;
    }
}
