// Данные о продуктах (локальные, пока сервер не вернул)
const products = [
    {
        id: 1,
        name: "Антигравитацин",
        category: "energy",
        price: 2500,
        description: "Повышает энергетический уровень в условиях невесомости",
        image: "imeges/Антигравитацин.png"
    },
    {
        id: 2,
        name: "Радиозащитный гель",
        category: "immunity",
        price: 3200,
        description: "Защищает от космической радиации, повышает иммунитет",
        image: "imeges/Радиозащитный гель.png"
    },
    {
        id: 3,
        name: "Генная адаптация Марс",
        category: "adaptation",
        price: 8500,
        description: "Подготовка организма к жизни в условиях Марса",
        image: "imeges/Генная адаптация Марс.png"
    },
    {
        id: 4,
        name: "Костный регенератор",
        category: "recovery",
        price: 5400,
        description: "Предотвращает потерю костной массы в космосе",
        image: "imeges/Костный регенератор.png"
    },
    {
        id: 5,
        name: "Нейростабилизатор",
        category: "energy",
        price: 4100,
        description: "Улучшает когнитивные функции в длительных полетах",
        image: "imeges/Нейростабилизатор.png"
    },
    {
        id: 6,
        name: "Иммуномодулятор Венера",
        category: "immunity",
        price: 6900,
        description: "Адаптирует иммунную систему к атмосфере Венеры",
        image: "imeges/Иммуномодулятор Венера.jpg"
    },
    {
        id: 7,
        name: "Крио-восстановитель",
        category: "recovery",
        price: 7800,
        description: "Ускоряет восстановление после криогенного сна",
        image: "imeges/Крио-восстановитель.jpg"
    },
    {
        id: 8,
        name: "Гиперпространственный адаптоген",
        category: "adaptation",
        price: 9200,
        description: "Подготовка к прыжкам в гиперпространстве",
        image: "imeges/Гиперпространственный адаптоген.jpg"
    }
];

// Глобальные переменные
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentFilter = 'all';
let currentUser = JSON.parse(localStorage.getItem('cosmicUser')) || null;
let allProducts = [...products]; // Для админ-панели

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Инициализация приложения
function initApp() {
    renderProducts();
    updateCartCount();
    setupEventListeners();
    loadSession();
    checkServerConnection();
}

// Проверка соединения с сервером
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            console.log('✅ Сервер подключен');
        }
    } catch (error) {
        console.warn('⚠️ Сервер не отвечает, используется локальный режим');
    }
}

// Загрузка сессии пользователя
function loadSession() {
    if (currentUser) {
        updateUIForUser();
    }
}

// Установка обработчиков событий
function setupEventListeners() {
    // Фильтрация продуктов
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
            renderProducts();
        });
    });
    
    // Кнопка исследования продуктов
    document.getElementById('explore-products').addEventListener('click', function() {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Модальные окна
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => openModal('register-modal'));
    document.getElementById('checkout-btn').addEventListener('click', () => openOrderModal());
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Закрытие модальных окон при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Формы
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('order-form').addEventListener('submit', handleOrder);
    document.getElementById('topup-form')?.addEventListener('submit', handleTopup);
    document.getElementById('edit-profile-form')?.addEventListener('submit', handleEditProfile);
    
    // Кнопка редактирования профиля
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => openEditProfileModal());
    
    // Кнопка истории заказов (добавьте в HTML)
    if (document.getElementById('history-btn')) {
        document.getElementById('history-btn').addEventListener('click', showOrderHistory);
    }
    
    // Админ-кнопки
    document.getElementById('admin-panel-btn')?.addEventListener('click', openAdminPanel);
    document.getElementById('manage-products-btn')?.addEventListener('click', openManageProducts);
    
    // Установка обработчиков для пользователя
    setupUserEventListeners();
}

function setupUserEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // Кнопка профиля
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', showProfile);
    }
}

// Отображение продуктов
function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    const filteredProducts = currentFilter === 'all' 
        ? products 
        : products.filter(product => product.category === currentFilter);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <span class="product-category">${getCategoryName(product.category)}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">${product.price} ₽</div>
                    <button class="add-to-cart" data-id="${product.id}">В корзину</button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
    
    // Добавление обработчиков для кнопок "В корзину"
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            addToCart(productId);
        });
    });
}

// Получение названия категории
function getCategoryName(category) {
    const categories = {
        'immunity': 'Иммунитет',
        'energy': 'Энергия',
        'adaptation': 'Адаптация',
        'recovery': 'Восстановление'
    };
    return categories[category] || category;
}

// Добавление товара в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${product.name} добавлен в корзину!`, 'success');
}

// Обновление корзины
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    updateCartSummary();
}

// Обновление счетчика товаров в корзине
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

// Отображение товаров в корзине
function renderCartItems() {
    const container = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Ваша корзина пуста. Отправляйтесь за космическими покупками!</p>';
        return;
    }
    
    container.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price} ₽</p>
                </div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total">${item.price * item.quantity} ₽</div>
                <button class="remove-item" data-id="${item.id}">Удалить</button>
            </div>
        `;
        container.appendChild(cartItem);
    });
    
    // Добавление обработчиков для управления количеством
    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            updateQuantity(productId, -1);
        });
    });
    
    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            updateQuantity(productId, 1);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            removeFromCart(productId);
        });
    });
}

// Обновление количества товара
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }
    
    updateCart();
}

// Удаление товара из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showNotification('Товар удален из корзины', 'info');
}

// Обновление итоговой суммы
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 500;
    const total = subtotal + shipping;
    
    document.getElementById('subtotal').textContent = subtotal;
    document.getElementById('shipping').textContent = shipping;
    document.getElementById('total').textContent = total;
}

// Открытие модального окна
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Открытие модального окна заказа
function openOrderModal() {
    if (cart.length === 0) {
        showNotification('Добавьте товары в корзину перед оформлением заказа', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Для оформления заказа необходимо войти в систему', 'error');
        openModal('login-modal');
        return;
    }
    
    // Показываем товары
    const orderDetails = document.getElementById('order-details');
    if (orderDetails) {
        orderDetails.innerHTML = '';
        
        cart.forEach(item => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <p><strong>${item.name}</strong> x ${item.quantity} = ${item.price * item.quantity} ₽</p>
            `;
            orderDetails.appendChild(orderItem);
        });
    }
    
    // Рассчитываем сумму
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 500;
    const total = subtotal + shipping;
    
    const orderTotalElement = document.getElementById('order-total');
    if (orderTotalElement) {
        orderTotalElement.textContent = total;
    }
    
    // Заполняем форму
    setTimeout(() => {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const addressInput = document.getElementById('address');
        
        if (nameInput && currentUser.name) {
            nameInput.value = currentUser.name;
        }
        
        if (emailInput && currentUser.email) {
            emailInput.value = currentUser.email;
        }
        
        if (addressInput) {
            addressInput.value = currentUser.address || '';
        }
    }, 100);
    
    openModal('order-modal');
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        // Локальная демо-авторизация (если сервер не работает)
        if (!navigator.onLine || email.includes('test')) {
            // Демо-пользователи
            if (email === 'admin@cosmic.pharmacy' && password === 'admin123') {
                const demoAdmin = {
                    id: 1,
                    email: email,
                    name: 'Главный Администратор',
                    address: 'Орбитальная станция "Мир-2", Сектор 5',
                    role: 'admin',
                    balance: 100000.00
                };
                saveUserSession(demoAdmin);
                showNotification(`Вход выполнен для администратора`, 'success');
                document.getElementById('login-modal').style.display = 'none';
                e.target.reset();
                return;
            } else if (email === 'test@test.com' && password === '123') {
                const demoUser = {
                    id: 2,
                    email: email,
                    name: 'Тестовый Пользователь',
                    address: 'Марс, база Альфа',
                    role: 'user',
                    balance: 5000.00
                };
                saveUserSession(demoUser);
                showNotification(`Вход выполнен для ${demoUser.name}`, 'success');
                document.getElementById('login-modal').style.display = 'none';
                e.target.reset();
                return;
            }
        }
        
        // Реальный запрос к серверу
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const result = await response.json();
            saveUserSession(result.user);
            showNotification(`Вход выполнен для ${result.user.name}`, 'success');
            document.getElementById('login-modal').style.display = 'none';
            e.target.reset();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Неверный email или пароль');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(error.message || 'Ошибка при входе. Проверьте данные.', 'error');
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const address = document.getElementById('register-address').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, address })
        });
        
        if (response.ok) {
            const result = await response.json();
            saveUserSession(result.user);
            showNotification(`Регистрация успешна для ${name}`, 'success');
            document.getElementById('register-modal').style.display = 'none';
            e.target.reset();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(error.message || 'Ошибка при регистрации. Возможно email уже используется.', 'error');
    }
}

// Сохранение сессии пользователя
function saveUserSession(user) {
    currentUser = user;
    localStorage.setItem('cosmicUser', JSON.stringify(user));
    updateUIForUser();
}

// Обновление интерфейса для пользователя
function updateUIForUser() {
    document.getElementById('guest-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
    document.getElementById('user-name').textContent = currentUser.name.split(' ')[0];
    document.getElementById('user-balance').textContent = `${parseFloat(currentUser.balance || 0).toFixed(2)} ₽`;
    
    // Создаем кнопку пополнения баланса, если её нет
    createTopupButton();
    
    // Показываем админ-кнопки если пользователь админ
    if (currentUser.role === 'admin') {
        document.getElementById('admin-buttons').style.display = 'flex';
    }
}

// Создание кнопки пополнения баланса
function createTopupButton() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;
    
    // Проверяем, есть ли уже кнопка
    if (document.getElementById('topup-btn')) return;
    
    // Создаем кнопку
    const topupBtn = document.createElement('button');
    topupBtn.id = 'topup-btn';
    topupBtn.className = 'topup-btn';
    topupBtn.innerHTML = '<i class="fas fa-coins"></i> Пополнить';
    
    // Находим кнопку выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        // Вставляем перед кнопкой выхода
        userMenu.insertBefore(topupBtn, logoutBtn);
        
        // Добавляем обработчик
        topupBtn.addEventListener('click', openTopupModal);
    }
}

// Выход пользователя
function logoutUser() {
    currentUser = null;
    localStorage.removeItem('cosmicUser');
    
    document.getElementById('guest-buttons').style.display = 'flex';
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('admin-buttons').style.display = 'none';
    
    // Очищаем корзину при выходе
    cart = [];
    updateCart();
    
    showNotification('Вы вышли из системы', 'info');
}

// Показать профиль
function showProfile() {
    openModal('profile-modal');
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-address').textContent = currentUser.address || 'Не указан';
    document.getElementById('profile-balance').textContent = `${currentUser.balance || 0} ₽`;
    document.getElementById('profile-role').textContent = currentUser.role === 'admin' ? 'Администратор' : 'Пользователь';
}

// Открыть редактирование профиля
function openEditProfileModal() {
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-email').value = currentUser.email;
    document.getElementById('edit-address').value = currentUser.address || '';
    document.getElementById('edit-password').value = '';
    
    openModal('edit-profile-modal');
}

// Редактирование профиля
async function handleEditProfile(e) {
    e.preventDefault();
    
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const address = document.getElementById('edit-address').value;
    const password = document.getElementById('edit-password').value;
    
    // Локальное обновление (демо)
    currentUser.name = name;
    currentUser.email = email;
    currentUser.address = address;
    
    localStorage.setItem('cosmicUser', JSON.stringify(currentUser));
    
    showNotification('Профиль обновлен', 'success');
    document.getElementById('edit-profile-modal').style.display = 'none';
    updateUIForUser();
}

// Показать историю заказов
async function showOrderHistory() {
    if (!currentUser) return;
    
    openModal('history-modal');
    const historyContainer = document.getElementById('history-list');
    historyContainer.innerHTML = '<p>История заказов (демо-режим)</p>';
    
    // Демо-заказы
    const demoOrders = [
        { id: 1, order_number: 'ORD-123', total: 3200, status: 'Доставлен', date: '2024-01-15' },
        { id: 2, order_number: 'ORD-124', total: 8500, status: 'В обработке', date: '2024-01-10' }
    ];
    
    demoOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'history-item';
        orderElement.innerHTML = `
            <h4>Заказ #${order.order_number}</h4>
            <p>Дата: ${order.date}</p>
            <p>Сумма: ${order.total} ₽</p>
            <p>Статус: ${order.status}</p>
        `;
        historyContainer.appendChild(orderElement);
    });
}

// Обработка заказа
async function handleOrder(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Для оформления заказа необходимо войти в систему', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Корзина пуста! Добавьте товары', 'error');
        return;
    }
    
    // Получаем данные
    const name = document.getElementById('name')?.value || currentUser.name;
    const email = document.getElementById('email')?.value || currentUser.email;
    const address = document.getElementById('address')?.value || currentUser.address || '';
    
    // Проверка
    if (!name || !email || !address) {
        showNotification('Заполните все обязательные поля!', 'error');
        return;
    }
    
    // Рассчитываем сумму
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 500;
    const total = subtotal + shipping;
    
    // Проверка баланса
    if (currentUser.balance < total) {
        const deficit = total - currentUser.balance;
        showNotification(`Недостаточно средств! Нужно еще ${deficit} ₽`, 'error');
        return;
    }
    
    try {
        // Локальная обработка (демо)
        currentUser.balance -= total;
        localStorage.setItem('cosmicUser', JSON.stringify(currentUser));
        
        // Генерируем номер заказа
        const orderNumber = 'ORD-' + Date.now();
        
        // Очищаем корзину
        cart = [];
        localStorage.removeItem('cart');
        updateCart();
        
        // Обновляем UI
        updateUIForUser();
        
        // Показываем успех
        showNotification(`Заказ №${orderNumber} оформлен! Списано ${total} ₽`, 'success');
        document.getElementById('order-modal').style.display = 'none';
        
        // Сбрасываем форму
        const orderForm = document.getElementById('order-form');
        if (orderForm) orderForm.reset();
        
    } catch (error) {
        console.error('❌ Ошибка заказа:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Открытие окна пополнения баланса
function openTopupModal() {
    if (!currentUser) {
        showNotification('Для пополнения баланса необходимо войти в систему', 'error');
        openModal('login-modal');
        return;
    }
    
    // Обновляем текущий баланс
    document.getElementById('current-balance').textContent = `${currentUser.balance || 0} ₽`;
    
    // Открываем модальное окно
    openModal('topup-modal');
    
    // Добавляем обработчики для кнопок быстрого выбора суммы
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('topup-amount').value = this.dataset.amount;
        });
    });
}

// Обработка пополнения баланса
async function handleTopup(e) {
    e.preventDefault();
    
    const amount = parseInt(document.getElementById('topup-amount').value);
    const method = document.getElementById('payment-method').value;
    
    if (!amount || amount < 100) {
        showNotification('Минимальная сумма пополнения: 100 ₽', 'error');
        return;
    }
    
    // Локальное пополнение (демо)
    currentUser.balance += amount;
    localStorage.setItem('cosmicUser', JSON.stringify(currentUser));
    
    // Обновляем интерфейс
    updateUIForUser();
    
    showNotification(`Баланс успешно пополнен на ${amount} ₽`, 'success');
    
    // Закрываем окно
    document.getElementById('topup-modal').style.display = 'none';
    
    // Сбрасываем форму
    document.getElementById('topup-form').reset();
}

// Открытие админ-панели
async function openAdminPanel() {
    if (!currentUser) {
        showNotification('Для доступа необходимо войти в систему', 'error');
        openModal('login-modal');
        return;
    }
    
    if (currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Только для администраторов.', 'error');
        return;
    }
    
    // Открываем модальное окно
    openModal('admin-modal');
    
    // Загружаем данные
    loadAdminStats();
    
    // Настройка вкладок
    setupAdminTabs();
}

// Настройка вкладок админ-панели
function setupAdminTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            tabBtns.forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Скрываем все вкладки
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Показываем выбранную вкладку
            const tabId = this.dataset.tab + '-tab';
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

// Загрузка статистики для админа
function loadAdminStats() {
    // Демо-статистика
    const demoStats = {
        users: 25,
        orders: 48,
        revenue: 256800,
        products: 8
    };
    
    // Обновляем статистику на странице
    document.getElementById('total-users').textContent = demoStats.users;
    document.getElementById('total-orders').textContent = demoStats.orders;
    document.getElementById('total-revenue').textContent = `${demoStats.revenue.toLocaleString()} ₽`;
    document.getElementById('total-products').textContent = demoStats.products;
    
    // Демо-пользователи
    const demoUsers = [
        { id: 1, name: 'Главный Администратор', email: 'admin@cosmic.pharmacy', role: 'admin', balance: 100000.00, created_at: '2024-01-01' },
        { id: 2, name: 'Тестовый Пользователь', email: 'test@test.com', role: 'user', balance: 3200.00, created_at: '2024-01-10' },
        { id: 3, name: 'Иван Космонавтов', email: 'ivan@star.ru', role: 'user', balance: 15000.00, created_at: '2024-01-12' }
    ];
    
    renderUsersTable(demoUsers);
    
    // Демо-заказы
    const demoOrders = [
        { order_number: 'ORD-001', customer_name: 'Иван Космонавтов', customer_email: 'ivan@star.ru', total: 8500, status: 'Доставлен', created_at: '2024-01-15' },
        { order_number: 'ORD-002', customer_name: 'Анна Звездная', customer_email: 'anna@star.ru', total: 3200, status: 'В обработке', created_at: '2024-01-14' }
    ];
    
    renderOrdersTable(demoOrders);
}

// Отображение таблицы пользователей
function renderUsersTable(users) {
    const container = document.getElementById('users-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p class="empty-message">Нет пользователей</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Баланс</th>
                <th>Дата регистрации</th>
            </tr>
        </thead>
        <tbody>
            ${users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge ${user.role}">${user.role === 'admin' ? 'Админ' : 'Пользователь'}</span></td>
                    <td>${parseFloat(user.balance || 0).toFixed(2)} ₽</td>
                    <td>${user.created_at}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
}

// Отображение таблицы заказов
function renderOrdersTable(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="empty-message">Нет заказов</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>№ заказа</th>
                <th>Покупатель</th>
                <th>Email</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
            </tr>
        </thead>
        <tbody>
            ${orders.map(order => `
                <tr>
                    <td>${order.order_number || 'N/A'}</td>
                    <td>${order.customer_name}</td>
                    <td>${order.customer_email}</td>
                    <td>${parseFloat(order.total || 0).toFixed(2)} ₽</td>
                    <td><span class="status-badge ${order.status || 'new'}">${order.status || 'новый'}</span></td>
                    <td>${order.created_at}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
}

// Управление товарами
async function openManageProducts() {
    if (!currentUser) {
        showNotification('Для доступа необходимо войти в систему', 'error');
        openModal('login-modal');
        return;
    }
    
    if (currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Только для администраторов.', 'error');
        return;
    }
    
    // Открываем модальное окно
    openModal('products-modal');
    
    // Загружаем товары
    loadProductsForAdmin();
}

// Загрузка товаров для админ-панели
function loadProductsForAdmin() {
    // Используем локальные товары
    renderProductsAdminTable(allProducts);
}

// Отображение таблицы товаров
function renderProductsAdminTable(products) {
    const container = document.getElementById('admin-products-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="empty-message">Нет товаров</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Изображение</th>
            </tr>
        </thead>
        <tbody>
            ${products.map(product => `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${getCategoryName(product.category)}</td>
                    <td>${parseFloat(product.price || 0).toFixed(2)} ₽</td>
                    <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
// Определение типа устройства
function detectDevice() {
    const width = window.innerWidth;
    
    if (width < 768) {
        document.documentElement.classList.add('is-mobile');
        document.documentElement.classList.remove('is-tablet', 'is-desktop');
    } else if (width < 992) {
        document.documentElement.classList.add('is-tablet');
        document.documentElement.classList.remove('is-mobile', 'is-desktop');
    } else {
        document.documentElement.classList.add('is-desktop');
        document.documentElement.classList.remove('is-mobile', 'is-tablet');
    }
}

// Вызов при загрузке и изменении размера окна
window.addEventListener('load', detectDevice);
window.addEventListener('resize', detectDevice);

// Исправление высоты 100vh на мобильных
function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
setVH();