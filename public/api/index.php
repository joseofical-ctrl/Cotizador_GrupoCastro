<?php
/**
 * ==============================================================================
 * API BACKEND PUENTE - GRUPO CASTRO
 * Compatible con Hetzner Webhosting (Apache + PHP 7.4 / 8.x + MySQL/MariaDB)
 * ==============================================================================
 */

// Desactivar salida de errores HTML para garantizar respuestas JSON puras
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Cabeceras CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Responder inmediatamente a peticiones OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cargar configuración de base de datos
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'El archivo config.php no existe en el servidor',
        'configuracion_requerida' => true
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configFile;

// Conexión PDO con MySQL / MariaDB
try {
    $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error de conexión a la base de datos MySQL: ' . $e->getMessage(),
        'configuracion_requerida' => true
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ==============================================================================
// FUNCIONES AUXILIARES: JWT (HMAC-SHA256)
// ==============================================================================
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generarJWT($payload, $secret) {
    $header = base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $body = base64UrlEncode(json_encode($payload));
    $signature = base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));
    return "$header.$body.$signature";
}

function validarJWT($token, $secret) {
    if (!$token) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($header, $body, $signature) = $parts;
    $expected = base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));
    if (!hash_equals($expected, $signature)) return false;
    $payload = json_decode(base64UrlDecode($body), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }
    return $payload;
}

function obtenerTokenDeCabeceras() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $reqHeaders = apache_request_headers();
        if (isset($reqHeaders['Authorization'])) {
            $headers = trim($reqHeaders['Authorization']);
        } elseif (isset($reqHeaders['authorization'])) {
            $headers = trim($reqHeaders['authorization']);
        }
    }
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
        return $matches[1];
    }
    if (isset($_GET['token'])) {
        return trim($_GET['token']);
    }
    return null;
}

// Obtener datos del cuerpo JSON
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// ==============================================================================
// RUTAS Y ACCIONES DE LA API
// ==============================================================================

// 1. ENDPOINT DE ESTADO / PING
if ($action === 'ping' || $action === '') {
    echo json_encode([
        'ok' => true,
        'servicio' => 'API Cotizador Grupo Castro',
        'servidor' => 'Hetzner Webhosting',
        'estado' => 'activo',
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. ENDPOINT LOGIN (POST ?action=login)
if ($action === 'login') {
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Debe ingresar usuario y contraseña'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, username, password_hash, nombre FROM usuarios WHERE username = :u LIMIT 1");
        $stmt->execute([':u' => $username]);
        $user = $stmt->fetch();

        $valido = false;
        if ($user) {
            if (password_verify($password, $user['password_hash'])) {
                $valido = true;
            } elseif ($password === $user['password_hash']) {
                // Compatibilidad con contraseñas en texto plano creadas directamente en phpMyAdmin
                $valido = true;
            }
        }

        if (!$valido) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Usuario o contraseña incorrectos'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $tokenPayload = [
            'sub'      => $user['id'],
            'username' => $user['username'],
            'nombre'   => $user['nombre'],
            'iat'      => time(),
            'exp'      => time() + (86400 * 30) // Vigencia de 30 días
        ];

        $token = generarJWT($tokenPayload, $config['jwt_secret']);

        echo json_encode([
            'ok'      => true,
            'token'   => $token,
            'usuario' => [
                'id'       => (int)$user['id'],
                'username' => $user['username'],
                'nombre'   => $user['nombre']
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al validar usuario: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// --- TODAS LAS RUTAS SIGUIENTES REQUIEREN TOKEN VÁLIDO ---
$token = obtenerTokenDeCabeceras();
$tokenData = validarJWT($token, $config['jwt_secret']);

if (!$tokenData) {
    http_response_code(401);
    echo json_encode([
        'ok' => false,
        'error' => 'Sesión no válida o expirada. Por favor inicie sesión nuevamente.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. ENDPOINT LISTAR (GET ?action=listar)
if ($action === 'listar') {
    try {
        $stmt = $pdo->query("SELECT id, cliente_nombre, cliente_telefono, cliente_direccion, items_json, subtotal, descuento, total, fecha FROM cotizaciones ORDER BY id DESC LIMIT 100");
        $filas = $stmt->fetchAll();

        $cotizaciones = [];
        foreach ($filas as $fila) {
            $items = json_decode($fila['items_json'], true);
            if (!is_array($items)) {
                $items = [];
            }

            $cotizaciones[] = [
                'id' => is_numeric($fila['id']) ? (float)$fila['id'] : $fila['id'],
                'cliente' => [
                    'nombre'    => $fila['cliente_nombre'],
                    'telefono'  => $fila['cliente_telefono'] ?? '',
                    'direccion' => $fila['cliente_direccion'] ?? ''
                ],
                'items'     => $items,
                'subtotal'  => (string)$fila['subtotal'],
                'descuento' => (float)($fila['descuento'] ?? 0),
                'total'     => (string)$fila['total'],
                'fecha'     => (string)$fila['fecha']
            ];
        }

        echo json_encode([
            'ok' => true,
            'cotizaciones' => $cotizaciones
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al obtener cotizaciones: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 4. ENDPOINT GUARDAR (POST ?action=guardar)
if ($action === 'guardar') {
    $id = isset($input['id']) ? $input['id'] : null;
    $cliente = is_array($input['cliente'] ?? null) ? $input['cliente'] : [];
    $nombre = trim($cliente['nombre'] ?? '');
    $telefono = trim($cliente['telefono'] ?? '');
    $direccion = trim($cliente['direccion'] ?? '');
    $items = is_array($input['items'] ?? null) ? $input['items'] : [];
    $subtotal = trim((string)($input['subtotal'] ?? '0.00'));
    $descuento = floatval($input['descuento'] ?? 0);
    $total = trim((string)($input['total'] ?? '0.00'));
    $fecha = trim((string)($input['fecha'] ?? date('d/m/Y, H:i:s')));

    if (!$id || $nombre === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'El ID y el Nombre del cliente son obligatorios'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);

    try {
        $sql = "INSERT INTO cotizaciones 
                (id, cliente_nombre, cliente_telefono, cliente_direccion, items_json, subtotal, descuento, total, fecha)
                VALUES (:id, :nom, :tel, :dir, :items, :sub, :desc, :tot, :fec)
                ON DUPLICATE KEY UPDATE
                  cliente_nombre    = VALUES(cliente_nombre),
                  cliente_telefono  = VALUES(cliente_telefono),
                  cliente_direccion = VALUES(cliente_direccion),
                  items_json        = VALUES(items_json),
                  subtotal          = VALUES(subtotal),
                  descuento         = VALUES(descuento),
                  total             = VALUES(total),
                  fecha             = VALUES(fecha)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'    => $id,
            ':nom'   => $nombre,
            ':tel'   => $telefono,
            ':dir'   => $direccion,
            ':items' => $itemsJson,
            ':sub'   => $subtotal,
            ':desc'  => $descuento,
            ':tot'   => $total,
            ':fec'   => $fecha
        ]);

        echo json_encode([
            'ok' => true,
            'id' => $id,
            'mensaje' => 'Cotización guardada exitosamente en la base de datos'
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al guardar cotización: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 5. ENDPOINT ELIMINAR (POST ?action=eliminar)
if ($action === 'eliminar') {
    try {
        if (!empty($input['todos'])) {
            $pdo->exec("DELETE FROM cotizaciones");
            echo json_encode(['ok' => true, 'mensaje' => 'Todas las cotizaciones han sido eliminadas'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $id = $input['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'ID no proporcionado para eliminar'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM cotizaciones WHERE id = :id");
        $stmt->execute([':id' => $id]);

        echo json_encode(['ok' => true, 'mensaje' => 'Cotización eliminada exitosamente'], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al eliminar: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Acción no reconocida
http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'Acción no encontrada'], JSON_UNESCAPED_UNICODE);
