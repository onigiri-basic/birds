<?php
class Validator {
    public static function validateFullname($fullname) {
        if (empty($fullname)) {
            return ['valid' => false, 'message' => 'ФИО обязательно для заполнения.', 'allowed_chars' => 'Допустимые символы: буквы русского и английского алфавита, пробелы и дефисы.'];
        }
        if (strlen($fullname) > 150) {
            return ['valid' => false, 'message' => 'ФИО не должно превышать 150 символов.', 'allowed_chars' => 'Максимальная длина: 150 символов.'];
        }
        if (!preg_match('/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/u', $fullname)) {
            return ['valid' => false, 'message' => 'ФИО содержит недопустимые символы.', 'allowed_chars' => 'Допустимые символы: буквы русского и английского алфавита, пробелы и дефисы.'];
        }
        return ['valid' => true];
    }
    
    public static function validatePhone($phone) {
        if (!empty($phone)) {
            if (strlen($phone) > 50) {
                return ['valid' => false, 'message' => 'Телефон не должен превышать 50 символов.', 'allowed_chars' => 'Максимальная длина: 50 символов.'];
            }
            $cleanPhone = preg_replace('/[^\d+]/', '', $phone);
            if (!preg_match('/^[\+\d]+$/', $cleanPhone)) {
                return ['valid' => false, 'message' => 'Некорректный формат телефона.', 'allowed_chars' => 'Допустимые символы: цифры и знак +'];
            }
            if (!preg_match('/\d/', $phone)) {
                return ['valid' => false, 'message' => 'Телефон должен содержать хотя бы одну цифру.', 'allowed_chars' => 'Допустимые символы: цифры и знак +'];
            }
        }
        return ['valid' => true];
    }
    
    public static function validateEmail($email) {
        if (empty($email)) {
            return ['valid' => false, 'message' => 'E-mail обязателен для заполнения.', 'allowed_chars' => 'Допустимый формат: example@domain.com'];
        }
        if (strlen($email) > 100) {
            return ['valid' => false, 'message' => 'E-mail не должен превышать 100 символов.', 'allowed_chars' => 'Максимальная длина: 100 символов.'];
        }
        if (!preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $email)) {
            return ['valid' => false, 'message' => 'Некорректный формат e-mail.', 'allowed_chars' => 'Допустимые символы: латинские буквы, цифры, точка, дефис, подчеркивание, знак @'];
        }
        return ['valid' => true];
    }
    
    public static function validateOrganization($organization) {
        if (!empty($organization)) {
            if (strlen($organization) > 255) {
                return ['valid' => false, 'message' => 'Название организации не должно превышать 255 символов.', 'allowed_chars' => 'Максимальная длина: 255 символов.'];
            }
            if (!preg_match('/^[a-zA-Zа-яА-ЯёЁ0-9\s\.\,\!\?\-\:\;\"\'\(\)\[\]\{\}\@\#\$\%\^\&\*\+\=\/\\\|<>~`\_]*$/u', $organization)) {
                return ['valid' => false, 'message' => 'Название организации содержит недопустимые символы.', 'allowed_chars' => 'Допустимы буквы, цифры, пробелы и основные знаки препинания'];
            }
        }
        return ['valid' => true];
    }
    
    public static function validateMessage($message) {
        if (empty($message)) {
            return ['valid' => false, 'message' => 'Сообщение обязательно для заполнения.', 'allowed_chars' => 'Пожалуйста, введите текст сообщения.'];
        }
        if (strlen($message) > 5000) {
            return ['valid' => false, 'message' => 'Сообщение не должно превышать 5000 символов.', 'allowed_chars' => 'Максимальная длина: 5000 символов.'];
        }
        return ['valid' => true];
    }
    
    public static function validatePrivacy($privacy) {
        if (!$privacy) {
            return ['valid' => false, 'message' => 'Необходимо согласие с политикой обработки персональных данных.', 'allowed_chars' => 'Поставьте галочку для подтверждения'];
        }
        return ['valid' => true];
    }
}
?>