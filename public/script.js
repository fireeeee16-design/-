// Космическая аптека - клиентский код

// Данные о продуктах
const products = [
    {
        id: 1,
        name: "Антигравитацин",
        category: "energy",
        price: 2500,
        description: "Повышает энергетический уровень в условиях невесомости",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1130&q=80"
    },
    {
        id: 2,
        name: "Радиозащитный гель",
        category: "immunity",
        price: 3200,
        description: "Защищает от космической радиации, повышает иммунитет",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    },
    {
        id: 3,
        name: "Генная адаптация Марс",
        category: "adaptation",
        price: 8500,
        description: "Подготовка организма к жизни в условиях Марса",
        image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    },
    {
        id: 4,
        name: "Костный регенератор",
        category: "recovery",
        price: 5400,
        description: "Предотвращает потерю костной массы в космосе",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80"
    },
    {
        id: 5,
        name: "Нейростабилизатор",
        category: "energy",
        price: 4100,
        description: "Улучшает когнитивные функции в длительных полетах",
        image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
    },
    {
        id: 6,
        name: "Иммуномодулятор Венера",
        category: "immunity",
        price: 6900,
        description: "Адаптирует иммунную систему к атмосфере Венеры",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1130&q=80"
    },
    {
        id: 7,
        name: "Крио-восстановитель",
        category: "recovery",
        price: 7800,
        description: "Ускоряет восстановление после криогенного сна",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    },
    {
        id: 8,
        name: "Гиперпространственный адаптоген",
        category: "adaptation",
        price: 9200,
        description: "Подготовка к прыжкам в гиперпространстве",
        image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    }
];

// Глобальные переменные
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentFilter = 'all';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Инициализация приложения
function initApp() {
    renderProducts();
    updateCartCount();
    setupEventListeners();
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
    document.getElementById(modalId).style.display = 'flex';
}

// Открытие модального окна заказа
function openOrderModal() {
    if (cart.length === 0) {
        showNotification('Добавьте товары в корзину перед оформлением заказа', 'error');
        return;
    }
    
    const orderDetails = document.getElementById('order-details');
    orderDetails.innerHTML = '';
    
    cart.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <p>${item.name} x ${item.quantity}: ${item.price * item.quantity} ₽</p>
        `;
        orderDetails.appendChild(orderItem);
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 500;
    const total = subtotal + shipping;
    
    document.getElementById('order-total').textContent = total;
    openModal('order-modal');
}

// Обработка входа
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // В реальном приложении здесь был бы запрос к серверу
    showNotification(`Вход выполнен для ${email}`, 'success');
    document.getElementById('login-modal').style.display = 'none';
    e.target.reset();
}

// Обработка регистрации
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const address = document.getElementById('register-address').value;
    
    // В реальном приложении здесь был бы запрос к серверу
    showNotification(`Регистрация успешна для ${name}`, 'success');
    document.getElementById('register-modal').style.display = 'none';
    e.target.reset();
}

// Обработка заказа
async function handleOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('order-name').value;
    const email = document.getElementById('order-email').value;
    const address = document.getElementById('order-address').value;
    const comments = document.getElementById('order-comments').value;
    
    // Подготовка данных заказа
    const orderData = {
        customer: { name, email, address, comments },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: document.getElementById('order-total').textContent,
        date: new Date().toISOString()
    };
    
    try {
        // Отправка заказа на сервер
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData)
});
        if (response.ok) {
            const result = await response.json();
            showNotification(`Заказ №${result.orderId} успешно оформлен!`, 'success');
            
            // Очистка корзины
            cart = [];
            updateCart();
            
            // Закрытие модального окна и сброс формы
            document.getElementById('order-modal').style.display = 'none';
            e.target.reset();
        } else {
            throw new Error('Ошибка при оформлении заказа');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка при оформлении заказа. Попробуйте еще раз.', 'error');
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