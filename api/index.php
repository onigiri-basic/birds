<?php
// В самом начале файла api/index.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once dirname(__DIR__) . '/backend/Database.php';
require_once dirname(__DIR__) . '/backend/Validator.php';
require_once dirname(__DIR__) . '/backend/Auth.php';
require_once dirname(__DIR__) . '/backend/Application.php';

// Настройка сессий
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');
session_name('BIRDS_SESSION');
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Извлекаем путь после /birds/api/
if (preg_match('#/birds/api/(.*)#', $request_uri, $matches)) {
    $path = '/' . $matches[1];
} elseif (preg_match('#/api/(.*)#', $request_uri, $matches)) {
    $path = '/' . $matches[1];
} else {
    $path = $_SERVER['PATH_INFO'] ?? '';
}

$path = rtrim($path, '/');
$segments = explode('/', ltrim($path, '/'));

// Логирование для отладки
error_log("API Request: method=$method, path=$path, session_id=" . session_id());

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    $auth = new Auth($pdo);
    $app = new Application($pdo);
    
    // GET /api/auth/check
    if ($method === 'GET' && $segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'check') {
        $user = $auth->getCurrentUser();
        error_log("Auth check: user=" . ($user ? json_encode($user) : 'null'));
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => true, 'user' => null]);
        }
        exit;
    }
    
    // POST /api/auth/login
    if ($method === 'POST' && $segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'login') {
        $input = json_decode(file_get_contents('php://input'), true);
        $login = $input['login'] ?? '';
        $password = $input['password'] ?? '';
        
        error_log("Login attempt: login=$login");
        
        $user = $auth->login($login, $password);
        if ($user) {
            error_log("Login success: " . json_encode($user));
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            error_log("Login failed for: $login");
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        }
        exit;
    }
    
    // POST /api/auth/logout
    if ($method === 'POST' && $segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'logout') {
        $auth->logout();
        echo json_encode(['success' => true]);
        exit;
    }
    
    // POST /api/applications
    if ($method === 'POST' && $segments[0] === 'applications' && !isset($segments[1])) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;
        
        // Убедимся что все поля есть
        if (!isset($input['languages'])) $input['languages'] = [];
        if (!isset($input['gender'])) $input['gender'] = 'unspecified';
        if (!isset($input['birthdate'])) $input['birthdate'] = '';
        
        $result = $app->create($input, $auth);
        echo json_encode($result);
        exit;
    }
    
    // PUT /api/applications/{id}
    if ($method === 'PUT' && $segments[0] === 'applications' && isset($segments[1])) {
        if (!$auth->isAuthenticated()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }
        
        $id = (int)$segments[1];
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;
        
        $result = $app->update($id, $input, $auth);
        echo json_encode($result);
        exit;
    }
    
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
    
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
