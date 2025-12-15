// Космическая аптека - полный сервер
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// База данных
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
  } else {
    console.log('✅ База данных SQLite подключена');
    initializeDatabase();
  }
});

// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================
function initializeDatabase() {
  // 1. Таблица пользователей (СНАЧАЛА!)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      role TEXT DEFAULT 'user',
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    console.log('✅ Таблица users готова');
    
    // Создаём администратора по умолчанию
    db.get('SELECT COUNT(*) as count FROM users WHERE email = "admin@cosmic.pharmacy"', (err, row) => {
      if (row && row.count === 0) {
        db.run(
          'INSERT INTO users (email, password, name, role, balance) VALUES (?, ?, ?, ?, ?)',
          ['admin@cosmic.pharmacy', 'admin123', 'Главный Администратор', 'admin', 100000],
          (err) => {
            if (!err) console.log('✅ Создан администратор: admin@cosmic.pharmacy / admin123');
          }
        );
      }
    });
    
    // Создаём тестового пользователя
    db.get('SELECT COUNT(*) as count FROM users WHERE email = "test@test.com"', (err, row) => {
      if (row && row.count === 0) {
        db.run(
          'INSERT INTO users (email, password, name, address, balance) VALUES (?, ?, ?, ?, ?)',
          ['test@test.com', '123', 'Тестовый Пользователь', 'Марс, база Альфа', 5000],
          (err) => {
            if (!err) console.log('✅ Создан тестовый пользователь: test@test.com / 123');
          }
        );
      }
    });
  });
  
  // 2. Таблица товаров
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT
    )
  `, () => {
    console.log('✅ Таблица products готова');
  });
  
  // 3. Таблица заказов
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'new',
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, () => {
    console.log('✅ Таблица orders готова');
  });
  
  // 4. Таблица товаров в заказах
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id)
    )
  `, () => {
    console.log('✅ Таблица order_items готова');
    console.log('✅ Все таблицы базы данных созданы!');
  });
}

// ==================== API ДЛЯ РЕГИСТРАЦИИ И ВХОДА ====================

// Регистрация
app.post('/api/register', (req, res) => {
  const { email, password, name, address } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Заполните email, пароль и имя' });
  }
  
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('❌ Ошибка БД при регистрации:', err.message);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    
    db.run(
      'INSERT INTO users (email, password, name, address) VALUES (?, ?, ?, ?)',
      [email, password, name, address || ''],
      function(err) {
        if (err) {
          console.error('❌ Ошибка создания пользователя:', err.message);
          return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        console.log('✅ Новый пользователь:', email);
        
        res.json({
          success: true,
          user: {
            id: this.lastID,
            email: email,
            name: name,
            address: address || '',
            role: 'user',
            balance: 0
          }
        });
      }
    );
  });
});

// Вход
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните email и пароль' });
  }
  
  db.get(
    `SELECT id, email, password, name, address, role, balance 
     FROM users WHERE email = ?`,
    [email],
    (err, user) => {
      if (err) {
        console.error('❌ Ошибка БД при входе:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Пользователь не найден' });
      }
      
      // Проверяем пароль
      if (user.password !== password) {
        return res.status(401).json({ error: 'Неверный пароль' });
      }
      
      console.log('✅ Успешный вход:', email);
      
      // Убираем пароль из ответа
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        user: userWithoutPassword
      });
    }
  );
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ API ====================

// ВРЕМЕННЫЙ УПРОЩЁННЫЙ ОБРАБОТЧИК ЗАКАЗОВ
app.post('/api/orders', (req, res) => {
  console.log('📦 Получен запрос на заказ в:', new Date().toISOString());
  
  // Логируем ВСЕ данные запроса
  console.log('📋 Тело запроса:', JSON.stringify(req.body, null, 2));
  
  // Проверяем наличие обязательных данных
  if (!req.body.customer) {
    console.error('❌ Нет данных customer');
    return res.status(400).json({
      success: false,
      error: 'Отсутствуют данные покупателя',
      received: req.body
    });
  }
  
  if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
    console.error('❌ Нет данных items или пустой массив');
    return res.status(400).json({
      success: false,
      error: 'Нет товаров в заказе',
      items: req.body.items
    });
  }
  
  // ВРЕМЕННО: просто возвращаем успешный ответ без сохранения в БД
  const testOrderId = Date.now();
  
  console.log('✅ Заказ принят (тестовый режим):', {
    customerName: req.body.customer.name,
    itemsCount: req.body.items.length,
    total: req.body.total || 'не указано'
  });
  
  res.json({
    success: true,
    message: 'Заказ успешно оформлен! (тестовый режим)',
    orderId: testOrderId,
    orderNumber: `COSMIC-TEST-${testOrderId}`,
    debug: {
      timestamp: new Date().toISOString(),
      customer: req.body.customer,
      itemsCount: req.body.items.length,
      total: req.body.total,
      userId: req.body.userId || null
    }
  });
});
// Получение всех заказов
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Заказы пользователя
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
        console.error('Ошибка при получении заказов:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      res.json(rows);
    }
  );
});

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Сервер космической аптеки работает!',
    endpoints: [
      'POST /api/register',
      'POST /api/login', 
      'POST /api/orders',
      'GET /api/orders',
      'GET /api/user/orders',
      'GET /api/test'
    ]
  });
});
// Добавьте этот маршрут ПЕРЕД app.listen() в server.js
app.get('/api/debug/tables', (req, res) => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    [],
    (err, tables) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Получаем структуру каждой таблицы
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
// Запуск сервера
app.listen(PORT, () => {
  console.log(`=======================================`);
  console.log(`🚀 Сервер космической аптеки запущен!`);
  console.log(`📍 Порт: ${PORT}`);
  console.log(`📋 Доступные API:`);
  console.log(`   POST /api/register - регистрация`);
  console.log(`   POST /api/login - вход`);
  console.log(`   POST /api/orders - оформление заказа`);
  console.log(`   GET  /api/test - проверка работы`);
  console.log(`=======================================`);
});