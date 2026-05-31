<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once dirname(__DIR__) . '/backend/Database.php';
require_once dirname(__DIR__) . '/backend/Validator.php';
require_once dirname(__DIR__) . '/backend/Auth.php';
require_once dirname(__DIR__) . '/backend/Application.php';

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

if (preg_match('#/birds/api/(.*)#', $request_uri, $matches)) {
    $path = '/' . $matches[1];
} elseif (preg_match('#/api/(.*)#', $request_uri, $matches)) {
    $path = '/' . $matches[1];
} else {
    $path = $_SERVER['PATH_INFO'] ?? '';
}

$path = rtrim($path, '/');
$segments = explode('/', ltrim($path, '/'));

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    $auth = new Auth($pdo);
    $app = new Application($pdo);
    
    // GET /api/auth/check
    if ($method === 'GET' && $segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'check') {
        session_start();
        $user = $auth->getCurrentUser();
        echo json_encode(['success' => true, 'user' => $user]);
        exit;
    }
    
    // POST /api/auth/login
    if ($method === 'POST' && $segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'login') {
        session_start();
        $input = json_decode(file_get_contents('php://input'), true);
        $user = $auth->login($input['login'] ?? '', $input['password'] ?? '');
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        }
        exit;
    }
    
    // POST /api/auth/logout
    if ($method === 'POST' && $segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'logout') {
        session_start();
        $auth->logout();
        echo json_encode(['success' => true]);
        exit;
    }
    
    // POST /api/applications
    if ($method === 'POST' && $segments[0] === 'applications' && !isset($segments[1])) {
        session_start();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;
        
        $result = $app->create($input, $auth);
        echo json_encode($result);
        exit;
    }
    
    // PUT /api/applications/{id}
    if ($method === 'PUT' && $segments[0] === 'applications' && isset($segments[1])) {
        session_start();
        if (!$auth->isAuthenticated()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }
        
        $id = (int)$segments[1];
        $input = json_decode(file_get_contents('php://input'), true);
        $result = $app->update($id, $input, $auth);
        echo json_encode($result);
        exit;
    }
    
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>