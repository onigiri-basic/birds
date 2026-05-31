// API endpoints
const API_BASE = window.location.origin + '/birds/api';
let currentUser = null;

// Проверка авторизации
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/check`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        currentUser = data.success ? data.user : null;
        updateUIBasedOnAuth();
        return currentUser;
    } catch (error) {
        console.error('Auth check error:', error);
        currentUser = null;
        updateUIBasedOnAuth();
        return null;
    }
}

// Обновление UI
function updateUIBasedOnAuth() {
    updateAuthButtons();
    if (currentUser) {
        fillFormWithUserData(currentUser);
    }
}

// Заполнение формы данными пользователя
function fillFormWithUserData(user) {
    document.getElementById('fullname').value = user.fullname || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('organization').value = user.organization || '';
    document.getElementById('message').value = user.message || '';
}

// Получение данных формы
function getFormData() {
    return {
        fullname: document.getElementById('fullname').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        organization: document.getElementById('organization').value.trim(),
        message: document.getElementById('message').value.trim(),
        privacy_policy: document.getElementById('privacy').checked
    };
}

// Валидация
function validateForm(formData) {
    const errors = {};
    if (!formData.fullname) errors.fullname = 'Введите ФИО';
    if (!formData.email || !formData.email.includes('@')) errors.email = 'Введите корректный email';
    if (!formData.message) errors.message = 'Введите комментарий';
    if (!formData.privacy_policy) errors.privacy = 'Необходимо согласие';
    return errors;
}

// Показ сообщения
function showMessage(text, type) {
    const msgDiv = document.getElementById('formMessage');
    msgDiv.textContent = text;
    msgDiv.className = `message ${type}`;
    msgDiv.classList.remove('hidden');
    setTimeout(() => msgDiv.classList.add('hidden'), 5000);
}

// Показ ошибок валидации
function showValidationErrors(errors) {
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('error'));
    
    for (const [field, message] of Object.entries(errors)) {
        const errorEl = document.getElementById(`${field}Error`);
        const inputEl = document.getElementById(field);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        if (inputEl) inputEl.classList.add('error');
    }
}

// Очистка ошибок
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('error'));
}

// Показ логина и пароляfunction showCredentials(login, password) {
    const modal = document.createElement('div');
    modal.className = 'credentials-modal';
    modal.innerHTML = `
        <h3>✅ Регистрация успешна!</h3>
        <p><strong>Логин:</strong></p>
        <code>${escapeHtml(login)}</code>
        <p><strong>Пароль:</strong></p>
        <code>${escapeHtml(password)}</code>
        <hr>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Сохраните эти данные для входа!</p>
        <button id="closeCredsModal">Закрыть</button>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'overlay-modal';
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    const close = () => {
        modal.remove();
        overlay.remove();
    };
    
    document.getElementById('closeCredsModal').onclick = close;
    overlay.onclick = close;
}

// Отправка формы
async function submitForm() {
    const formData = getFormData();
    const errors = validateForm(formData);
    
    if (Object.keys(errors).length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    clearErrors();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoading = document.getElementById('submitLoading');
    
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');
    
    const isUpdate = currentUser !== null;
    let url = `${API_BASE}/applications`;
    let method = 'POST';
    
    if (isUpdate && currentUser && currentUser.id) {
        method = 'PUT';
        url = `${API_BASE}/applications/${currentUser.id}`;
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.login && data.password) {
                showCredentials(data.login, data.password);
                document.getElementById('betaForm').reset();
            } else if (isUpdate) {
                showMessage('✅ Данные успешно обновлены!', 'success');
            }
            await checkAuth();
        } else if (data.errors) {
            showValidationErrors(data.errors);
            showMessage('Пожалуйста, исправьте ошибки', 'error');
        } else if (data.error === 'Unauthorized') {
            showMessage('Необходимо авторизоваться', 'warning');
            showLoginForm();
        } else {
            showMessage('Ошибка: ' + (data.error || 'Неизвестная ошибка'), 'error');
        }
    } catch (error) {
        showMessage('Ошибка сети: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
    }
}

// Форматирование телефона
function formatPhoneNumber(value) {
    let numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('7') || numbers.startsWith('8')) numbers = '7' + numbers.substring(1);
    numbers = numbers.substring(0, 11);
    if (numbers.length === 0) return '';
    if (numbers.length <= 1) return '+7';
    if (numbers.length <= 4) return `+7 (${numbers.substring(1, 4)}`;
    if (numbers.length <= 7) return `+7 (${numbers.substring(1, 4)}) ${numbers.substring(4, 7)}`;
    if (numbers.length <= 9) return `+7 (${numbers.substring(1, 4)}) ${numbers.substring(4, 7)}-${numbers.substring(7, 9)}`;
    return `+7 (${numbers.substring(1, 4)}) ${numbers.substring(4, 7)}-${numbers.substring(7, 9)}-${numbers.substring(9, 11)}`;
}

// Вход в систему
async function doLogin(login, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ login, password })
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateUIBasedOnAuth();
            showMessage('✅ Успешный вход!', 'success');
            return true;
        } else {
            showMessage('❌ Неверный логин или пароль', 'error');
            return false;
        }
    } catch (error) {
        showMessage('Ошибка сети', 'error');
        return false;
    }
}

// Выход
async function doLogout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    currentUser = null;
    updateUIBasedOnAuth();
    showMessage('Вы вышли из системы', 'success');
    document.getElementById('betaForm').reset();
}

// Обновление кнопок авторизации
function updateAuthButtons() {
    const headerAuth = document.getElementById('headerAuth');
    const footerContainer = document.getElementById('authButtonsContainer');
    
    if (currentUser) {
        const userHtml = `<span class="user-info">👤 ${escapeHtml(currentUser.login || currentUser.fullname)}</span>`;
        const logoutBtn = `<button class="auth-btn" id="logoutBtn">🚪 Выйти</button>`;
        
        if (headerAuth) headerAuth.innerHTML = userHtml + logoutBtn;
        if (footerContainer) footerContainer.innerHTML = userHtml + logoutBtn;
        
        document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
    } else {
        const loginBtn = `<button class="auth-btn" id="showLoginBtn">🔐 Войти</button>`;
        
        if (headerAuth) headerAuth.innerHTML = loginBtn;
        if (footerContainer) footerContainer.innerHTML = loginBtn;
        
        document.getElementById('showLoginBtn')?.addEventListener('click', showLoginForm);
    }
}

// Форма входа
function showLoginForm() {
    const modal = document.createElement('div');
    modal.className = 'credentials-modal';
    modal.innerHTML = `
        <h3>🔐 Вход в систему</h3>
        <div id="loginErrorMsg" style="color: #f66; margin-bottom: 1rem; display: none;"></div>
        <input type="text" id="loginInput" placeholder="Логин" style="width: 100%; padding: 0.75rem; margin: 0.5rem 0; background: #222; border: 1px solid #444; color: white; border-radius: 0.5rem;">
        <input type="password" id="passwordInput" placeholder="Пароль" style="width: 100%; padding: 0.75rem; margin: 0.5rem 0; background: #222; border: 1px solid #444; color: white; border-radius: 0.5rem;">
        <button id="loginBtn" style="width: 100%; padding: 0.75rem; background: #BB0A30; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Войти</button>
        <button id="closeLoginBtn" style="width: 100%; margin-top: 0.5rem; padding: 0.75rem; background: #444; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Отмена</button>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'overlay-modal';
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    const close = () => {
        modal.remove();
        overlay.remove();
    };
    
    document.getElementById('closeLoginBtn').onclick = close;
    overlay.onclick = close;
    
    document.getElementById('loginBtn').onclick = async () => {
        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;
        const errorMsg = document.getElementById('loginErrorMsg');
        
        if (!login || !password) {
            errorMsg.textContent = 'Введите логин и пароль';
            errorMsg.style.display = 'block';
            return;
        }
        
        const success = await doLogin(login, password);
        if (success) close();
    };
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    // Форматирование телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }
    
    // Отправка формы
    const form = document.getElementById('betaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitForm();
        });
    }
    
    // Политика конфиденциальности
    const privacyLink = document.getElementById('privacyLink');
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Политика обработки персональных данных\n\nМы обязуемся защищать ваши персональные данные и использовать их только для обработки вашей заявки на бета-тест.');
        });
    }
    
    // Мобильное меню
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }
    
    // Tooltip для карточек
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
    
    // Проверка авторизации
    await checkAuth();
});
