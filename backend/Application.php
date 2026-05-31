<?php
class Application {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function create($data, $auth) {
        $errors = [];
        
        $validation = Validator::validateFullname($data['fullname'] ?? '');
        if (!$validation['valid']) $errors['fullname'] = $validation;
        
        $validation = Validator::validatePhone($data['phone'] ?? '');
        if (!$validation['valid']) $errors['phone'] = $validation;
        
        $validation = Validator::validateEmail($data['email'] ?? '');
        if (!$validation['valid']) $errors['email'] = $validation;
        
        $validation = Validator::validateOrganization($data['organization'] ?? '');
        if (!$validation['valid']) $errors['organization'] = $validation;
        
        $validation = Validator::validateMessage($data['message'] ?? '');
        if (!$validation['valid']) $errors['message'] = $validation;
        
        $validation = Validator::validatePrivacy($data['privacy_policy'] ?? false);
        if (!$validation['valid']) $errors['privacy'] = $validation;
        
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }
        
        try {
            $this->pdo->beginTransaction();
            
            $stmt = $this->pdo->prepare("
                INSERT INTO applications (fullname, phone, email, organization, message, privacy_agreed)
                VALUES (:fullname, :phone, :email, :organization, :message, :privacy)
            ");
            
            $stmt->execute([
                ':fullname' => $data['fullname'],
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'],
                ':organization' => $data['organization'] ?? null,
                ':message' => $data['message'],
                ':privacy' => ($data['privacy_policy'] ?? false) ? 1 : 0
            ]);
            
            $applicationId = $this->pdo->lastInsertId();
            
            $credentials = $auth->register($applicationId, $data['fullname']);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'id' => $applicationId,
                'profile_url' => "/birds/api/applications/{$applicationId}",
                'login' => $credentials['login'],
                'password' => $credentials['password']
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log('Database error in create: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function update($id, $data, $auth) {
        $currentUser = $auth->getCurrentUser();
        if (!$currentUser || $currentUser['id'] != $id) {
            return ['success' => false, 'error' => 'Access denied'];
        }
        
        $errors = [];
        
        $validation = Validator::validateFullname($data['fullname'] ?? '');
        if (!$validation['valid']) $errors['fullname'] = $validation;
        
        $validation = Validator::validatePhone($data['phone'] ?? '');
        if (!$validation['valid']) $errors['phone'] = $validation;
        
        $validation = Validator::validateEmail($data['email'] ?? '');
        if (!$validation['valid']) $errors['email'] = $validation;
        
        $validation = Validator::validateOrganization($data['organization'] ?? '');
        if (!$validation['valid']) $errors['organization'] = $validation;
        
        $validation = Validator::validateMessage($data['message'] ?? '');
        if (!$validation['valid']) $errors['message'] = $validation;
        
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }
        
        try {
            $stmt = $this->pdo->prepare("
                UPDATE applications 
                SET fullname = :fullname, phone = :phone, email = :email,
                    organization = :organization, message = :message
                WHERE id = :id
            ");
            
            $stmt->execute([
                ':fullname' => $data['fullname'],
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'],
                ':organization' => $data['organization'] ?? null,
                ':message' => $data['message'],
                ':id' => $id
            ]);
            
            return ['success' => true, 'id' => $id];
            
        } catch (PDOException $e) {
            error_log('Database error in update: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Database error'];
        }
    }
    
    public function get($id) {
        $stmt = $this->pdo->prepare("
            SELECT a.*, u.login
            FROM applications a
            JOIN users u ON a.id = u.application_id
            WHERE a.id = :id
        ");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
