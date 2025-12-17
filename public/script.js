// Космическая аптека - клиентский код

// Данные о продуктах
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
let authToken = localStorage.getItem('cosmicToken') || null;

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
}

// Загрузка сессии пользователя
function loadSession() {
    if (currentUser && authToken) {
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
    
    // Добавляем новые обработчики для профиля
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
    
    // Кнопка истории заказов
    const historyBtn = document.getElementById('history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', showOrderHistory);
    }
    
    // Кнопка пополнения баланса
    const topupBtn = document.getElementById('topup-btn');
    if (topupBtn) {
        topupBtn.addEventListener('click', showTopUpForm);
    }
    
    // Админ-кнопки
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', showAdminPanel);
    }
    
    const manageProductsBtn = document.getElementById('manage-products-btn');
    if (manageProductsBtn) {
        manageProductsBtn.addEventListener('click', showProductManager);
    }
}

// Отображение продуктов (остается без изменений)
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
    document.getElementById(modalId).style.display = 'flex';
}

// Открытие модального окна заказа - ИСПРАВЛЕННАЯ ВЕРСИЯ
function openOrderModal() {
    console.log('🛒 Открываю окно заказа...');
    
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
    
    // Заполняем форму с проверкой
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
        
        // ОСОБОЕ ВНИМАНИЕ: если адреса нет, оставляем поле пустым и просим заполнить
        if (addressInput) {
            addressInput.value = currentUser.address || '';
            if (!currentUser.address) {
                addressInput.placeholder = 'Введите адрес доставки (обязательно)';
                addressInput.classList.add('required-field');
            }
        }
        
        // Убираем предыдущие ошибки
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }, 100);
    
    openModal('order-modal');
}
// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('https://cosmic-pharmacy.onrender.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const result = await response.json();
            saveUserSession(result.user, result.token);
            showNotification(`Вход выполнен для ${result.user.name}`, 'success');
            document.getElementById('login-modal').style.display = 'none';
            e.target.reset();
        } else {
            throw new Error('Неверный email или пароль');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка при входе. Проверьте данные.', 'error');
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
        const response = await fetch('https://cosmic-pharmacy.onrender.com/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, address })
        });
        
        if (response.ok) {
            const result = await response.json();
            saveUserSession(result.user, result.token);
            showNotification(`Регистрация успешна для ${name}`, 'success');
            document.getElementById('register-modal').style.display = 'none';
            e.target.reset();
        } else {
            throw new Error('Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка при регистрации. Возможно email уже используется.', 'error');
    }
}

// Сохранение сессии пользователя
function saveUserSession(user, token) {
    currentUser = user;
    authToken = token;
    localStorage.setItem('cosmicUser', JSON.stringify(user));
    localStorage.setItem('cosmicToken', token);
    updateUIForUser();
}

// Обновление интерфейса для пользователя
function updateUIForUser() {
    document.getElementById('guest-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
    document.getElementById('user-name').textContent = currentUser.name.split(' ')[0];
    document.getElementById('user-balance').textContent = `${currentUser.balance || 0} ₽`;
    
    // Показываем админ-кнопки если пользователь админ
    if (currentUser.role === 'admin') {
        document.getElementById('admin-buttons').style.display = 'flex';
    }
}

// Выход пользователя
function logoutUser() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('cosmicUser');
    localStorage.removeItem('cosmicToken');
    
    document.getElementById('guest-buttons').style.display = 'flex';
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('admin-buttons').style.display = 'none';
    
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

// Показать историю заказов
async function showOrderHistory() {
    try {
        const response = await fetch('/api/user/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const orders = await response.json();
            // Отображение истории заказов в модальном окне
            openModal('history-modal');
            const historyContainer = document.getElementById('history-list');
            historyContainer.innerHTML = '';
            
            if (orders.length === 0) {
                historyContainer.innerHTML = '<p>У вас пока нет заказов</p>';
                return;
            }
            
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = 'history-item';
                orderElement.innerHTML = `
                    <h4>Заказ #${order.id} от ${new Date(order.created_at).toLocaleDateString()}</h4>
                    <p>Сумма: ${order.total} ₽</p>
                    <p>Статус: ${order.status}</p>
                `;
                historyContainer.appendChild(orderElement);
            });
        }
    } catch (error) {
        showNotification('Ошибка при загрузке истории заказов', 'error');
    }
}

// Обработка заказа - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ИСПРАВЛЕННЫЙ КОД в handleOrder():
async function handleOrder(e) {
    e.preventDefault();
    
    console.log('🛒 Начинаем оформление заказа...');
    
    if (!currentUser) {
        showNotification('Для оформления заказа необходимо войти в систему', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Корзина пуста! Добавьте товары', 'error');
        return;
    }
    
    // ПОЛУЧАЕМ ДАННЫЕ ИЗ ФОРМЫ
    const name = document.getElementById('name')?.value || currentUser.name;
    const email = document.getElementById('email')?.value || currentUser.email;
    const addressInput = document.getElementById('address');
    const address = addressInput?.value || currentUser.address || '';
    const comments = document.getElementById('comments')?.value || '';
    
    console.log('📋 Данные формы:', { name, email, address, comments });
    console.log('📦 Корзина:', cart);
    
    // ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ
    if (!name || !email || !address) {
        console.error('❌ Не заполнены обязательные поля:', { name, email, address });
        showNotification('Заполните все обязательные поля: имя, email и адрес!', 'error');
        
        // Подсветим пустые поля
        if (!name) document.getElementById('name')?.classList.add('error');
        if (!email) document.getElementById('email')?.classList.add('error');
        if (!address) document.getElementById('address')?.classList.add('error');
        
        return;
    }
    
    // Рассчитываем итоговую сумму
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 500;
    const total = subtotal + shipping;
    
    console.log('💰 Сумма заказа:', { subtotal, shipping, total });
    
    // ПРАВИЛЬНАЯ структура данных для сервера
    const orderData = {
        customer: {
            name: name,
            email: email,
            address: address,  // ✅ Теперь точно строка, не null
            comments: comments
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total,
        userId: currentUser.id
    };
    
    console.log('📤 Отправляемые данные на сервер:', orderData);
    
    try {
        console.log('🚀 Отправляю запрос на /api/orders...');
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        console.log('📥 Статус ответа:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Текст ошибки:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            } catch (e) {
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }
        }
        
        const result = await response.json();
        console.log('✅ Успешный ответ сервера:', result);
        
        showNotification(`Заказ №${result.orderNumber || result.orderId} успешно оформлен!`, 'success');
        
        // Очистка корзины
        cart = [];
        localStorage.removeItem('cart');
        updateCart();
        
        // Закрытие модального окна
        document.getElementById('order-modal').style.display = 'none';
        
    } catch (error) {
        console.error('❌ Ошибка при оформлении заказа:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
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

// Админ-функции
async function showAdminPanel() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            openModal('admin-modal');
            
            document.getElementById('total-users').textContent = stats.users;
            document.getElementById('total-orders').textContent = stats.orders;
            document.getElementById('total-revenue').textContent = `${stats.revenue || 0} ₽`;
        }
    } catch (error) {
        showNotification('Ошибка при загрузке статистики', 'error');
    }
}

function showTopUpForm() {
    openModal('topup-modal');
}

async function showProductManager() {
    // Реализация управления товарами
    openModal('products-modal');
}
