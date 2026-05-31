<?php
class Auth {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function generateLogin($fullname) {
        $cleanName = preg_replace('/[^a-zA-Zа-яА-ЯёЁ]/u', '', $fullname);
        $cleanName = substr($cleanName, 0, 15);
        if (strlen($cleanName) < 3) {
            $cleanName = 'user';
        }
        $randomNum = rand(100, 999);
        return strtolower($cleanName) . $randomNum;
    }
    
    public function generatePassword($length = 10) {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        return substr(str_shuffle($chars), 0, $length);
    }
    
    public function register($applicationId, $fullname) {
        $login = $this->generateLogin($fullname);
        $password = $this->generatePassword();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $this->pdo->prepare("
            INSERT INTO users (login, password_hash, application_id)
            VALUES (:login, :password_hash, :application_id)
        ");
        $stmt->execute([
            ':login' => $login,
            ':password_hash' => $passwordHash,
            ':application_id' => $applicationId
        ]);
        
        $userId = $this->pdo->lastInsertId();
        
        $stmt = $this->pdo->prepare("UPDATE applications SET user_id = :user_id WHERE id = :id");
        $stmt->execute([':user_id' => $userId, ':id' => $applicationId]);
        
        // Автоматически авторизуем пользователя
        $_SESSION['user_id'] = $userId;
        $_SESSION['application_id'] = $applicationId;
        $_SESSION['user_login'] = $login;
        
        return ['login' => $login, 'password' => $password];
    }
    
    public function login($login, $password) {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.login, u.password_hash, u.application_id,
                   a.id as app_id, a.fullname, a.email, a.phone, a.organization, a.message
            FROM users u
            JOIN applications a ON u.application_id = a.id
            WHERE u.login = :login
        ");
        $stmt->execute([':login' => $login]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['application_id'] = $user['application_id'];
            $_SESSION['user_login'] = $user['login'];
            
            error_log("User logged in: " . $user['login'] . ", session_id: " . session_id());
            
            return [
                'id' => $user['application_id'],
                'fullname' => $user['fullname'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'organization' => $user['organization'],
                'message' => $user['message'],
                'login' => $user['login']
            ];
        }
        return false;
    }
    
    public function isAuthenticated() {
        $result = isset($_SESSION['user_id']) && isset($_SESSION['application_id']);
        error_log("isAuthenticated: " . ($result ? 'true' : 'false') . ", session_id: " . session_id());
        return $result;
    }
    
    public function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }
        
        $stmt = $this->pdo->prepare("
            SELECT a.*, u.login
            FROM applications a
            JOIN users u ON a.id = u.application_id
            WHERE a.id = :id
        ");
        $stmt->execute([':id' => $_SESSION['application_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        error_log("getCurrentUser: " . json_encode($user));
        return $user;
    }
    
    public function logout() {
        $_SESSION = array();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        error_log("User logged out, session destroyed");
        return true;
    }
}
?>
