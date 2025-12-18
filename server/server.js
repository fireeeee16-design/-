// Космическая аптека - полный сервер с улучшенной БД
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// База данных с лучшей обработкой ошибок
const db = new sqlite3.Database('./cosmic_pharmacy.db', (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
  } else {
    console.log('✅ База данных подключена');
    db.run('PRAGMA foreign_keys = ON'); // Включаем внешние ключи
    initializeDatabase();
  }
});

// ==================== УЛУЧШЕННАЯ СТРУКТУРА БАЗЫ ДАННЫХ ====================

async function initializeDatabase() {
  try {
    // 1. Таблица пользователей
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        role TEXT DEFAULT 'user',
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, 'users');
    
    // 2. Таблица категорий товаров
    await runQuery(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'fa-box'
      )
    `, 'categories');
    
    // 3. Таблица товаров
    await runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        image_url TEXT,
        stock INTEGER DEFAULT 100,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `, 'products');
    
    // 4. Таблица заказов
    await runQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        shipping DECIMAL(10, 2) DEFAULT 500.00,
        total DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'new',
        payment_status TEXT DEFAULT 'pending',
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, 'orders');
    
    // 5. Таблица товаров в заказах
    await runQuery(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `, 'order_items');
    
    // 6. Таблица транзакций (для списаний/пополнений)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'purchase', 'topup', 'refund'
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        order_id INTEGER,
        previous_balance DECIMAL(10, 2),
        new_balance DECIMAL(10, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `, 'transactions');
    
    // Заполняем начальные данные
    await seedInitialData();
    
    console.log('🎯 Все таблицы созданы успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
  }
}

// Вспомогательная функция для выполнения запросов
function runQuery(sql, tableName) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ Ошибка создания таблицы ${tableName}:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Таблица ${tableName} готова`);
        resolve();
      }
    });
  });
}

// Заполнение начальных данных
async function seedInitialData() {
  // Категории
  const categories = [
    ['Иммунитет', 'Препараты для защиты иммунной системы', 'fa-shield-alt'],
    ['Энергия', 'Средства для повышения энергетического уровня', 'fa-bolt'],
    ['Адаптация', 'Препараты для адаптации к космическим условиям', 'fa-user-astronaut'],
    ['Восстановление', 'Средства для восстановления организма', 'fa-heartbeat']
  ];
  
  for (const [name, description, icon] of categories) {
    db.run(
      'INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description, icon]
    );
  }
  
  // Заполняем товары
  await seedProducts();
  
  // Администратор
  db.get('SELECT COUNT(*) as count FROM users WHERE email = "admin@cosmic.pharmacy"', (err, row) => {
    if (row && row.count === 0) {
      db.run(
        'INSERT INTO users (email, password, name, address, role, balance) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin@cosmic.pharmacy', 'admin123', 'Главный Администратор', 'Орбитальная станция "Мир-2", Сектор 5', 'admin', 100000.00],
        (err) => {
          if (!err) console.log('✅ Администратор создан с балансом 100,000.00 ₽');
        }
      );
    }
  });
  
  // Тестовый пользователь
  db.get('SELECT COUNT(*) as count FROM users WHERE email = "test@test.com"', (err, row) => {
    if (row && row.count === 0) {
      db.run(
        'INSERT INTO users (email, password, name, address, balance) VALUES (?, ?, ?, ?, ?)',
        ['test@test.com', '123', 'Тестовый Пользователь', 'Марс, база Альфа', 5000.00],
        (err) => {
          if (!err) console.log('✅ Тестовый пользователь создан с балансом 5,000.00 ₽');
        }
      );
    }
  });
}

// Заполнение товаров
async function seedProducts() {
  const products = [
    // id, name, category_id, price, description, image_url, stock
    ['Антигравитацин', 2, 2500, 'Повышает энергетический уровень в условиях невесомости', 'imeges/Антигравитацин.png', 100],
    ['Радиозащитный гель', 1, 3200, 'Защищает от космической радиации, повышает иммунитет', 'imeges/Радиозащитный гель.png', 50],
    ['Генная адаптация Марс', 3, 8500, 'Подготовка организма к жизни в условиях Марса', 'imeges/Генная адаптация Марс.png', 30],
    ['Костный регенератор', 4, 5400, 'Предотвращает потерю костной массы в космосе', 'imeges/Костный регенератор.png', 45],
    ['Нейростабилизатор', 2, 4100, 'Улучшает когнитивные функции в длительных полетах', 'imeges/Нейростабилизатор.png', 60],
    ['Иммуномодулятор Венера', 1, 6900, 'Адаптирует иммунную систему к атмосфере Венеры', 'imeges/Иммуномодулятор Венера.jpg', 25],
    ['Крио-восстановитель', 4, 7800, 'Ускоряет восстановление после криогенного сна', 'imeges/Крио-восстановитель.jpg', 40],
    ['Гиперпространственный адаптоген', 3, 9200, 'Подготовка к прыжкам в гиперпространстве', 'imeges/Гиперпространственный адаптоген.jpg', 20]
  ];
  
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (row && row.count === 0) {
      console.log('🛒 Добавляю товары в базу данных...');
      
      const stmt = db.prepare(`
        INSERT INTO products (name, category_id, price, description, image_url, stock) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      products.forEach(product => {
        stmt.run(product, (err) => {
          if (err) console.error('Ошибка добавления товара:', err.message);
        });
      });
      
      stmt.finalize(() => {
        console.log(`✅ Добавлено ${products.length} товаров`);
      });
    }
  });
}

// ==================== КРИТИЧЕСКИЕ API ДЛЯ КЛИЕНТА ====================

// 1. Регистрация пользователя
app.post('/api/register', (req, res) => {
  const { email, password, name, address } = req.body;
  
  console.log('📝 Регистрация нового пользователя:', email);
  
  if (!email || !password || !name) {
    return res.status(400).json({ 
      success: false,
      error: 'Заполните email, пароль и имя' 
    });
  }
  
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('❌ Ошибка БД при регистрации:', err.message);
      return res.status(500).json({ 
        success: false,
        error: 'Ошибка сервера' 
      });
    }
    
    if (row) {
      return res.status(400).json({ 
        success: false,
        error: 'Email уже используется' 
      });
    }
    
    db.run(
      'INSERT INTO users (email, password, name, address, balance) VALUES (?, ?, ?, ?, ?)',
      [email, password, name, address || '', 0],
      function(err) {
        if (err) {
          console.error('❌ Ошибка создания пользователя:', err.message);
          return res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера' 
          });
        }
        
        console.log('✅ Новый пользователь создан:', email, 'ID:', this.lastID);
        
        db.get('SELECT id, email, name, address, role, balance FROM users WHERE id = ?', [this.lastID], (err, user) => {
          if (err) {
            return res.status(500).json({ 
              success: false,
              error: 'Ошибка получения пользователя' 
            });
          }
          
          res.json({
            success: true,
            user: user
          });
        });
      }
    );
  });
});

// 2. Вход пользователя
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Попытка входа:', email);
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'Заполните email и пароль' 
    });
  }
  
  db.get(
    `SELECT id, email, password, name, address, role, balance 
     FROM users WHERE email = ?`,
    [email],
    (err, user) => {
      if (err) {
        console.error('❌ Ошибка БД при входе:', err.message);
        return res.status(500).json({ 
          success: false,
          error: 'Ошибка сервера' 
        });
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Пользователь не найден' 
        });
      }
      
      // Проверяем пароль
      if (user.password !== password) {
        return res.status(401).json({ 
          success: false,
          error: 'Неверный пароль' 
        });
      }
      
      console.log('✅ Успешный вход для пользователя:', email);
      
      // Убираем пароль из ответа
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        user: userWithoutPassword
      });
    }
  );
});

// 3. Получение всех товаров
app.get('/api/products', (req, res) => {
  db.all(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.is_active = 1 
    ORDER BY p.id
  `, [], (err, products) => {
    if (err) {
      console.error('❌ Ошибка получения товаров:', err.message);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    
    console.log(`📦 Отправлено ${products.length} товаров`);
    res.json(products);
  });
});

// 4. Получение всех заказов (для отладки)
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 5. Заказы пользователя
app.get('/api/user/orders', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'Не указан ID пользователя' });
  }
  
  db.all(
    `SELECT o.*, 
            GROUP_CONCAT(oi.product_name || ' (x' || oi.quantity || ')') as products
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('❌ Ошибка при получении заказов:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      res.json(rows);
    }
  );
});

// 6. Оформление заказа с проверкой баланса (существующий)
// [Ваш существующий код здесь]

// 7. API для получения баланса пользователя (существующий)
// [Ваш существующий код здесь]

// 8. API для пополнения баланса (существующий)
// [Ваш существующий код здесь]

// 9. История транзакций пользователя (существующий)
// [Ваш существующий код здесь]

// ==================== ТЕСТОВЫЕ И ОТЛАДОЧНЫЕ API ====================

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Сервер космической аптеки работает!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/register - регистрация',
      'POST /api/login - вход',
      'GET  /api/products - все товары',
      'POST /api/orders - оформление заказа с балансом',
      'GET  /api/orders - все заказы',
      'GET  /api/user/orders - заказы пользователя',
      'GET  /api/user/balance/:userId - баланс',
      'POST /api/user/topup - пополнение баланса',
      'GET  /api/user/transactions/:userId - транзакции',
      'GET  /api/test - проверка работы'
    ]
  });
});

// Проверка структуры таблиц
app.get('/api/debug/tables', (req, res) => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    [],
    (err, tables) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const tableInfo = [];
      let processed = 0;
      
      tables.forEach(table => {
        db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
          tableInfo.push({
            table: table.name,
            columns: columns
          });
          
          processed++;
          if (processed === tables.length) {
            res.json(tableInfo);
          }
        });
      });
    }
  );
});

// Проверка пользователей
app.get('/api/debug/users', (req, res) => {
  db.all('SELECT id, email, name, balance FROM users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(users);
  });
});

// Проверка товаров
app.get('/api/debug/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(products);
  });
});

// Проверка подключения
app.get('/api/health', (req, res) => {
  db.get('SELECT 1 as test', (err) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        database: 'disconnected',
        error: err.message 
      });
    }
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      server: 'Космическая аптека API',
      version: '1.0.0'
    });
  });
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Маршрут не найден',
    path: req.path,
    method: req.method 
  });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('🔥 Необработанная ошибка:', err);
  res.status(500).json({ 
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(PORT, () => {
  console.log(`=======================================`);
  console.log(`🚀 Сервер космической аптеки запущен!`);
  console.log(`📍 Порт: ${PORT}`);
  console.log(`📊 База данных: cosmic_pharmacy.db`);
  console.log(`💰 Система баланса: АКТИВНА`);
  console.log(`👥 Пользователи по умолчанию:`);
  console.log(`   admin@cosmic.pharmacy / admin123 (100,000 ₽)`);
  console.log(`   test@test.com / 123 (5,000 ₽)`);
  console.log(`📋 Критические API:`);
  console.log(`   POST /api/register - регистрация ✓`);
  console.log(`   POST /api/login - вход ✓`);
  console.log(`   GET  /api/products - товары ✓`);
  console.log(`   POST /api/orders - оформление заказа ✓`);
  console.log(`   GET  /api/user/balance/:userId - баланс ✓`);
  console.log(`📡 Отладка:`);
  console.log(`   GET  /api/test - проверка работы`);
  console.log(`   GET  /api/health - статус сервера`);
  console.log(`   GET  /api/debug/* - отладка базы`);
  console.log(`=======================================`);
  console.log(`🌐 Доступно по адресу: http://localhost:${PORT}`);
  console.log(`💡 Совет: Используйте эти учетные записи для тестирования`);
  console.log(`=======================================`);
});