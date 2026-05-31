// API endpoints
const API_BASE = window.location.origin + '/birds/api';
let currentUser = null;
const FORM_STORAGE_KEY = 'birds_feedback_form_data';

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
    } else {
        restoreFormData();
    }
}

// Заполнение формы данными пользователя
function fillFormWithUserData(user) {
    document.getElementById('fullName').value = user.fullname || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('organization').value = user.organization || '';
    document.getElementById('messageText').value = user.message || '';
}

// Сохранение в localStorage
function saveFormDataToLocal() {
    const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        organization: document.getElementById('organization').value,
        message: document.getElementById('messageText').value,
        privacyPolicy: document.getElementById('privacyPolicy').checked
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
}

// Восстановление из localStorage
function restoreFormData() {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('fullName').value = data.fullName || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('organization').value = data.organization || '';
        document.getElementById('messageText').value = data.message || '';
        document.getElementById('privacyPolicy').checked = data.privacyPolicy || false;
    }
}

// Очистка формы
function clearFormData() {
    localStorage.removeItem(FORM_STORAGE_KEY);
    document.getElementById('feedbackForm').reset();
}

// Получение данных формы
function getFormData() {
    return {
        fullname: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        organization: document.getElementById('organization').value.trim(),
        message: document.getElementById('messageText').value.trim(),
        privacy_policy: document.getElementById('privacyPolicy').checked
    };
}

// Показ сообщения
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    if (type === 'success') setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}

// Валидация
function validateForm(formData) {
    const errors = [];
    if (!formData.fullname) errors.push('Введите ФИО');
    if (!formData.email || !formData.email.includes('@')) errors.push('Введите корректный email');
    if (!formData.message) errors.push('Введите сообщение');
    if (!formData.privacy_policy) errors.push('Необходимо согласие с политикой обработки данных');
    return errors;
}

// Отправка через API
async function submitViaAPI(formData, isUpdate = false) {
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
            } else {
                showMessage('✅ Данные успешно отправлены!', 'success');
            }
            clearFormData();
            await checkAuth();
            return true;
        } else if (data.errors) {
            const errorMessages = Object.values(data.errors).map(e => e.message);
            showMessage(errorMessages.join('\n'), 'error');
            return false;
        } else if (data.error === 'Unauthorized') {
            showMessage('Необходимо авторизоваться', 'warning');
            showLoginForm();
            return false;
        }
        return false;
    } catch (error) {
        showMessage('Ошибка сети: ' + error.message, 'error');
        return false;
    }
}

// Показ логина/пароля
function showCredentials(login, password) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #111; padding: 2rem; border-radius: 1rem; z-index: 1001;
        border: 2px solid #BB0A30; max-width: 400px; width: 90%;
    `;
    modal.innerHTML = `
        <h3 style="color: #BB0A30;">✅ Регистрация успешна!</h3>
        <p><strong>Логин:</strong> <code>${login}</code></p>
        <p><strong>Пароль:</strong> <code>${password}</code></p>
        <hr>
        <p style="font-size: 0.85rem;">Сохраните эти данные для входа!</p>
        <button id="closeModalBtn" style="background: #BB0A30; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer;">Закрыть</button>
    `;
    document.body.appendChild(modal);
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.7); z-index: 1000;`;
    document.body.appendChild(overlay);
    document.getElementById('closeModalBtn').onclick = () => { modal.remove(); overlay.remove(); };
}

// Авторизация
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
}

// Обновление кнопок авторизации
function updateAuthButtons() {
    let container = document.getElementById('authButtonsContainer');
    const footer = document.querySelector('footer .container > div:first-child');
    
    if (!container && footer) {
        container = document.createElement('div');
        container.id = 'authButtonsContainer';
        container.style.marginTop = '20px';
        container.style.display = 'flex';
        container.style.gap = '1rem';
        container.style.justifyContent = 'center';
        footer.appendChild(container);
    }
    
    if (container) {
        if (currentUser) {
            container.innerHTML = `
                <span style="color: #BB0A30; font-weight: bold;">👤 ${currentUser.login || currentUser.fullname}</span>
                <button id="logoutBtn" style="background: #64748b; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; color: white; cursor: pointer;">🚪 Выйти</button>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
        } else {
            container.innerHTML = `<button id="showLoginBtn" style="background: #BB0A30; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; color: white; cursor: pointer;">🔐 Войти</button>`;
            document.getElementById('showLoginBtn')?.addEventListener('click', showLoginForm);
        }
    }
}

// Форма входа
function showLoginForm() {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #111; padding: 2rem; border-radius: 1rem; z-index: 1001; border: 2px solid #BB0A30; max-width: 350px; width: 90%;`;
    modal.innerHTML = `
        <h3 style="color: #BB0A30; text-align: center;">🔐 Вход</h3>
        <input type="text" id="loginInput" placeholder="Логин" style="width: 100%; padding: 0.75rem; margin: 0.5rem 0; background: #222; border: 1px solid #444; color: white; border-radius: 0.5rem;">
        <input type="password" id="passwordInput" placeholder="Пароль" style="width: 100%; padding: 0.75rem; margin: 0.5rem 0; background: #222; border: 1px solid #444; color: white; border-radius: 0.5rem;">
        <button id="loginBtn" style="width: 100%; padding: 0.75rem; background: #BB0A30; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Войти</button>
        <button id="closeLoginBtn" style="width: 100%; margin-top: 0.5rem; padding: 0.75rem; background: #444; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Отмена</button>
    `;
    document.body.appendChild(modal);
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.7); z-index: 1000;`;
    document.body.appendChild(overlay);
    
    const close = () => { modal.remove(); overlay.remove(); };
    document.getElementById('closeLoginBtn').onclick = close;
    overlay.onclick = close;
    document.getElementById('loginBtn').onclick = async () => {
        const success = await doLogin(document.getElementById('loginInput').value, document.getElementById('passwordInput').value);
        if (success) close();
    };
}

// Обработчик формы
function initFormHandler() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = getFormData();
        const errors = validateForm(formData);
        if (errors.length > 0) {
            showMessage(errors.join('\n'), 'error');
            return;
        }
        const isUpdate = currentUser !== null;
        await submitViaAPI(formData, isUpdate);
    });
    
    form.addEventListener('input', () => { if (!currentUser) saveFormDataToLocal(); });
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

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => { e.target.value = formatPhoneNumber(e.target.value); });
    }
    
    await checkAuth();
    initFormHandler();
    
    // Слайдер для мобильного меню
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }
    
    // Форма бета-теста (оставляем без изменений)
    const betaForm = document.getElementById('betatestForm');
    if (betaForm) {
        betaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = document.getElementById('formStatus');
            if (status) {
                status.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
                status.style.color = '#00ff00';
            }
            betaForm.reset();
        });
    }
    
    // Открытие модальной формы
    document.querySelectorAll('.open-form').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('overlay').style.display = 'block';
            document.body.style.overflow = 'hidden';
            restoreFormData();
        });
    });
    
    // Закрытие формы
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});