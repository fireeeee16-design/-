// Космическая аптека - полный сервер (ИСПРАВЛЕННАЯ ВЕРСИЯ)
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

// База данных (ОДИН РАЗ!)
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
  } else {
    console.log('✅ База данных SQLite подключена');
    initializeDatabase();
    addMissingColumns();
  }
});

// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================
function initializeDatabase() {
  // 1. Таблица пользователей
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
    
    // Администратор
    db.get('SELECT COUNT(*) as count FROM users WHERE email = "admin@cosmic.pharmacy"', (err, row) => {
      if (row && row.count === 0) {
        db.run(
          'INSERT INTO users (email, password, name, address, role, balance) VALUES (?, ?, ?, ?, ?, ?)',
          ['admin@cosmic.pharmacy', 'admin123', 'Главный Администратор', 'Орбитальная станция "Мир-2", Сектор 5', 'admin', 100000],
          (err) => {
            if (!err) console.log('✅ Создан администратор с адресом');
          }
        );
      }
    });
    
    // Тестовый пользователь
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      price REAL NOT NULL
    )
  `, () => {
    console.log('✅ Таблица order_items готова');
    console.log('✅ Все таблицы базы данных созданы!');
  });
}

// Функция добавления недостающих колонок
function addMissingColumns() {
  console.log('🔍 Проверяем структуру таблиц...');
  
  db.all("PRAGMA table_info(orders)", [], (err, columns) => {
    if (err) {
      console.error('❌ Ошибка проверки таблицы orders:', err.message);
      return;
    }
    
    const hasUserId = columns.some(col => col.name === 'user_id');
    console.log('📊 Столбцы таблицы orders:', columns.map(c => c.name));
    console.log('✅ Есть user_id?', hasUserId);
    
    if (!hasUserId) {
      console.log('➕ Добавляю колонку user_id в таблицу orders...');
      db.run('ALTER TABLE orders ADD COLUMN user_id INTEGER', (err) => {
        if (err) {
          console.error('❌ Ошибка добавления user_id:', err.message);
        } else {
          console.log('✅ Колонка user_id добавлена!');
        }
      });
    }
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
      
      if (user.password !== password) {
        return res.status(401).json({ error: 'Неверный пароль' });
      }
      
      console.log('✅ Успешный вход:', email);
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        user: userWithoutPassword
      });
    }
  );
});

// ==================== ОБРАБОТКА ЗАКАЗОВ ====================

// УПРОЩЁННЫЙ обработчик заказов
app.post('/api/orders', (req, res) => {
  console.log('📦 Получен заказ от:', req.body.customer?.name);
  
  const { customer, items, total, userId } = req.body;
  
  if (!customer || !customer.name || !customer.email || !customer.address) {
    return res.status(400).json({ 
      error: 'Заполните имя, email и адрес' 
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Нет товаров в заказе' 
    });
  }
  
  // ВРЕМЕННО без user_id
  db.run(
    `INSERT INTO orders (customer_name, customer_email, customer_address, total, comments) 
     VALUES (?, ?, ?, ?, ?)`,
    [customer.name, customer.email, customer.address, total, customer.comments || ''],
    function(err) {
      if (err) {
        console.error('❌ Ошибка при сохранении заказа:', err.message);
        return res.status(500).json({ 
          error: 'Ошибка базы данных',
          details: err.message 
        });
      }
      
      const orderId = this.lastID;
      console.log('✅ Заказ сохранён! ID:', orderId);
      
      // Сохраняем товары
      const stmt = db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)'
      );
      
      items.forEach(item => {
        stmt.run(orderId, item.id, item.name, item.quantity, item.price);
      });
      
      stmt.finalize();
      console.log('✅ Товары сохранены:', items.length, 'шт.');
      
      res.json({
        success: true,
        message: 'Заказ успешно оформлен!',
        orderId: orderId,
        orderNumber: `COSMIC-${orderId}`,
        customerName: customer.name,
        total: total
      });
    }
  );
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ API ====================

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

// Проверка структуры таблицы orders
app.get('/api/debug/orders-structure', (req, res) => {
  db.all("PRAGMA table_info(orders)", [], (err, columns) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      table: 'orders',
      columns: columns,
      columnNames: columns.map(col => col.name)
    });
  });
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