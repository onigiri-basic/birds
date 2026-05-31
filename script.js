// API endpoints
const API_BASE = window.location.origin + '/birds/api';
let currentUser = null;

// Проверка авторизации
async function checkAuth() {
    try {
        console.log('Checking auth...');
        const response = await fetch(`${API_BASE}/auth/check`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        console.log('Auth response:', data);
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

// Обновление UI после авторизации
function updateUIBasedOnAuth() {
    console.log('Updating UI, currentUser:', currentUser);
    const headerAuth = document.getElementById('authSection');
    const footerAuth = document.getElementById('footerAuth');
    
    if (currentUser) {
        // Показываем информацию о пользователе и кнопку выхода
        const userDisplay = currentUser.login || currentUser.fullname;
        const authHtml = `
            <span class="user-info">👤 ${escapeHtml(userDisplay)}</span>
            <button class="auth-btn" id="logoutBtnHeader">🚪 Выйти</button>
        `;
        const footerHtml = `
            <span class="user-info">👤 ${escapeHtml(userDisplay)}</span>
            <button class="auth-btn" id="logoutBtnFooter">🚪 Выйти</button>
        `;
        
        if (headerAuth) headerAuth.innerHTML = authHtml;
        if (footerAuth) footerAuth.innerHTML = footerHtml;
        
        // Добавляем обработчики выхода
        document.getElementById('logoutBtnHeader')?.addEventListener('click', doLogout);
        document.getElementById('logoutBtnFooter')?.addEventListener('click', doLogout);
        
        // Заполняем форму данными пользователя
        fillFormWithUserData(currentUser);
    } else {
        // Показываем кнопку входа
        const authHtml = `<button class="auth-btn" id="loginBtnHeader">🔐 Войти</button>`;
        const footerHtml = `<button class="auth-btn" id="loginBtnFooter">🔐 Войти</button>`;
        
        if (headerAuth) headerAuth.innerHTML = authHtml;
        if (footerAuth) footerAuth.innerHTML = footerHtml;
        
        // Добавляем обработчики входа
        document.getElementById('loginBtnHeader')?.addEventListener('click', showLoginForm);
        document.getElementById('loginBtnFooter')?.addEventListener('click', showLoginForm);
    }
}

// Заполнение формы данными пользователя
function fillFormWithUserData(user) {
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const organizationInput = document.getElementById('organization');
    const messageInput = document.getElementById('message');
    
    if (fullnameInput) fullnameInput.value = user.fullname || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (organizationInput) organizationInput.value = user.organization || '';
    if (messageInput) messageInput.value = user.message || '';
}

// Получение данных формы
function getFormData() {
    return {
        fullname: document.getElementById('fullname')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        organization: document.getElementById('organization')?.value.trim() || '',
        message: document.getElementById('message')?.value.trim() || '',
        privacy_policy: document.getElementById('privacy')?.checked || false
    };
}

// Валидация формы
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
    if (!msgDiv) return;
    msgDiv.textContent = text;
    msgDiv.className = `message ${type}`;
    msgDiv.classList.remove('hidden');
    setTimeout(() => msgDiv.classList.add('hidden'), 5000);
}

// Показ ошибок валидации
function showValidationErrors(errors) {
    // Скрываем все ошибки
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('error'));
    
    // Показываем ошибки
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

// Показ логина и пароля после регистрации
function showCredentials(login, password) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal-window';
    modal.innerHTML = `
        <h3>✅ Регистрация успешна!</h3>
        <p><strong>Ваш логин:</strong></p>
        <code>${escapeHtml(login)}</code>
        <p><strong>Ваш пароль:</strong></p>
        <code>${escapeHtml(password)}</code>
        <hr style="margin: 15px 0; border-color: #333;">
        <p style="font-size: 0.85rem; margin-bottom: 10px;">Сохраните эти данные для входа в систему!</p>
        <button id="closeModalBtn">Закрыть</button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    const close = () => {
        modal.remove();
        overlay.remove();
    };
    
    document.getElementById('closeModalBtn').onclick = close;
    overlay.onclick = close;
}

// Отправка формы
async function submitForm(event) {
    event.preventDefault();
    
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
    
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.classList.add('hidden');
    if (submitLoading) submitLoading.classList.remove('hidden');
    
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
        console.log('Submit response:', data);
        
        if (data.success) {
            if (data.login && data.password) {
                // Новая регистрация - показываем логин и пароль
                showCredentials(data.login, data.password);
                document.getElementById('betaForm').reset();
            } else if (isUpdate) {
                showMessage('✅ Данные успешно обновлены!', 'success');
            }
            // Обновляем статус авторизации
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
        console.error('Submit error:', error);
        showMessage('Ошибка сети: ' + error.message, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.classList.remove('hidden');
        if (submitLoading) submitLoading.classList.add('hidden');
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
        console.log('Login response:', data);
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
        console.error('Login error:', error);
        showMessage('Ошибка сети', 'error');
        return false;
    }
}

// Выход из системы
async function doLogout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        currentUser = null;
        updateUIBasedOnAuth();
        showMessage('Вы вышли из системы', 'success');
        document.getElementById('betaForm')?.reset();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Показ формы входа
function showLoginForm() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal-window';
    modal.innerHTML = `
        <h3>🔐 Вход в систему</h3>
        <div id="loginErrorMsg" style="color: #f66; margin-bottom: 10px; display: none;"></div>
        <input type="text" id="loginInput" placeholder="Логин">
        <input type="password" id="passwordInput" placeholder="Пароль">
        <button id="loginSubmitBtn">Войти</button>
        <button id="closeLoginBtn" class="secondary">Отмена</button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    const close = () => {
        modal.remove();
        overlay.remove();
    };
    
    document.getElementById('closeLoginBtn').onclick = close;
    overlay.onclick = close;
    
    document.getElementById('loginSubmitBtn').onclick = async () => {
        const login = document.getElementById('loginInput').value.trim();
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing...');
    
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
        form.addEventListener('submit', submitForm);
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
    
    // Tooltip для карточек (предотвращаем переход)
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
    
    // Проверка авторизации
    await checkAuth();
    
    console.log('Initialization complete');
});
