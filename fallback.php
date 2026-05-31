<?php
session_start();
require_once 'backend/Database.php';
require_once 'backend/Validator.php';
require_once 'backend/Auth.php';
require_once 'backend/Application.php';

$db = Database::getInstance();
$pdo = $db->getConnection();
$auth = new Auth($pdo);
$app = new Application($pdo);

$message = '';
$errors = [];
$formData = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['fullname'])) {
    $formData = [
        'fullname' => $_POST['fullname'] ?? '',
        'email' => $_POST['email'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'organization' => $_POST['organization'] ?? '',
        'message' => $_POST['message'] ?? '',
        'privacy_policy' => isset($_POST['privacyPolicy'])
    ];
    
    if (isset($_SESSION['user_id']) && isset($_POST['update'])) {
        $result = $app->update($_SESSION['application_id'], $formData, $auth);
        if ($result['success']) {
            $message = 'success_update';
        } else if (isset($result['errors'])) {
            $errors = $result['errors'];
        }
    } else {
        $result = $app->create($formData, $auth);
        if ($result['success']) {
            $message = 'success_created';
            $_SESSION['temp_login'] = $result['login'];
            $_SESSION['temp_password'] = $result['password'];
        } else if (isset($result['errors'])) {
            $errors = $result['errors'];
        }
    }
}

$userData = $auth->getCurrentUser();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Обратная связь | Birds 3</title>
    <style>
        body { font-family: Arial, sans-serif; background: #000; color: #fff; padding: 2rem; }
        .container { max-width: 600px; margin: 0 auto; background: #111; padding: 2rem; border-radius: 1rem; border: 2px solid #BB0A30; }
        h1 { color: #BB0A30; text-align: center; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.25rem; font-weight: bold; }
        input, textarea { width: 100%; padding: 0.75rem; background: #222; border: 1px solid #444; color: #fff; border-radius: 0.5rem; }
        button { background: #BB0A30; color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; width: 100%; }
        .alert { padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; }
        .success { background: rgba(0,255,0,0.2); border: 1px solid #0f0; color: #0f0; }
        .error { background: rgba(255,0,0,0.2); border: 1px solid #f00; color: #f66; }
        .auth-info { text-align: center; margin-bottom: 1rem; padding: 1rem; background: #222; border-radius: 0.5rem; }
        .back-link { display: block; text-align: center; margin-top: 1rem; color: #BB0A30; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Обратная связь</h1>
        
        <?php if ($message === 'success_created'): ?>
            <div class="alert success">
                ✅ Регистрация успешна!<br>
                <strong>Логин:</strong> <?php echo htmlspecialchars($_SESSION['temp_login']); ?><br>
                <strong>Пароль:</strong> <?php echo htmlspecialchars($_SESSION['temp_password']); ?>
            </div>
            <?php unset($_SESSION['temp_login'], $_SESSION['temp_password']); ?>
        <?php elseif ($message === 'success_update'): ?>
            <div class="alert success">✅ Данные успешно обновлены!</div>
        <?php endif; ?>
        
        <?php if ($userData): ?>
            <div class="auth-info">
                👤 Вы авторизованы как: <strong><?php echo htmlspecialchars($userData['login']); ?></strong>
                <a href="fallback.php?logout=1" style="color: #BB0A30; margin-left: 1rem;">Выйти</a>
            </div>
        <?php else: ?>
            <div class="auth-info">
                <a href="login.html" style="color: #BB0A30;">🔐 Войти для редактирования</a>
            </div>
        <?php endif; ?>
        
        <form method="POST">
            <?php if ($userData): ?>
                <input type="hidden" name="update" value="1">
            <?php endif; ?>
            
            <div class="form-group">
                <label>ФИО *</label>
                <input type="text" name="fullname" value="<?php echo htmlspecialchars($userData['fullname'] ?? $_POST['fullname'] ?? ''); ?>" required>
            </div>
            
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" value="<?php echo htmlspecialchars($userData['email'] ?? $_POST['email'] ?? ''); ?>" required>
            </div>
            
            <div class="form-group">
                <label>Телефон</label>
                <input type="tel" name="phone" value="<?php echo htmlspecialchars($userData['phone'] ?? $_POST['phone'] ?? ''); ?>">
            </div>
            
            <div class="form-group">
                <label>Организация</label>
                <input type="text" name="organization" value="<?php echo htmlspecialchars($userData['organization'] ?? $_POST['organization'] ?? ''); ?>">
            </div>
            
            <div class="form-group">
                <label>Сообщение *</label>
                <textarea name="message" rows="5" required><?php echo htmlspecialchars($userData['message'] ?? $_POST['message'] ?? ''); ?></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="privacyPolicy" <?php echo (($userData['privacy_agreed'] ?? $_POST['privacyPolicy'] ?? false) ? 'checked' : ''); ?> required>
                    Я согласен с политикой обработки персональных данных
                </label>
            </div>
            
            <button type="submit"><?php echo $userData ? 'Обновить' : 'Отправить'; ?></button>
        </form>
        
        <a href="index.html" class="back-link">← Вернуться на главную</a>
    </div>
</body>
</html>