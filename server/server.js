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
    console.log('База данных SQLite подключена');
    initializeDatabase();
  }
});

// Инициализация таблиц
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'new',
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
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
  `);
  
  console.log('Таблицы базы данных готовы');
}

// API для оформления заказа
app.post('/api/orders', (req, res) => {
  const { customer, items, total } = req.body;
  
  if (!customer || !items || items.length === 0) {
    return res.status(400).json({ error: 'Неполные данные заказа' });
  }
  
  // Сохраняем заказ в базу данных
  db.run(
    `INSERT INTO orders (customer_name, customer_email, customer_address, total, comments) 
     VALUES (?, ?, ?, ?, ?)`,
    [customer.name, customer.email, customer.address, total, customer.comments || ''],
    function(err) {
      if (err) {
        console.error('Ошибка при сохранении заказа:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      
      const orderId = this.lastID;
      const stmt = db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)'
      );
      
      items.forEach(item => {
        stmt.run(orderId, item.id, item.name, item.quantity, item.price);
      });
      
      stmt.finalize();
      
      res.json({
        success: true,
        message: 'Заказ успешно оформлен!',
        orderId: orderId,
        orderNumber: `COSMIC-${orderId.toString().padStart(6, '0')}`
      });
    }
  );
});

// API для получения заказов (для проверки)
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Сервер космической аптеки работает!',
    endpoints: ['POST /api/orders', 'GET /api/orders', 'GET /api/test']
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`=======================================`);
  console.log(`🚀 Сервер космической аптеки запущен!`);
  console.log(`📍 Локально: http://localhost:${PORT}`);
  console.log(`📍 В сети: http://ВАШ_IP:${PORT} (см. инструкцию ниже)`);
  console.log(`=======================================`);
});
// Инициализация таблиц базы данных
function initializeDatabase() {
  // Таблица товаров
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT
    )
  `);
  
// Таблица пользователей
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
`);
  
  // Таблица заказов
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
  `);
  
  // Таблица товаров в заказах
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
  `);
  
  console.log('Таблицы базы данных готовы');
  
  // Создаём администратора по умолчанию
  db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', (err, row) => {
    if (row && row.count === 0) {
      db.run(
        'INSERT INTO users (email, password, name, role, balance) VALUES (?, ?, ?, ?, ?)',
        ['admin@cosmic.pharmacy', 'admin123', 'Главный Администратор', 'admin', 100000],
        (err) => {
          if (!err) console.log('✅ Создан администратор по умолчанию');
        }
      );
    }
  });
}
// ==================== ПОЛНАЯ СИСТЕМА ПОЛЬЗОВАТЕЛЕЙ ====================

// Регистрация (рабочая версия)
app.post('/api/register', (req, res) => {
  const { email, password, name, address } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Заполните email, пароль и имя' });
  }
  
  // Проверяем, есть ли уже такой email
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('❌ Ошибка БД при регистрации:', err.message);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    
    // Создаём пользователя
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
          },
          token: `user-${this.lastID}-${Date.now()}`
        });
      }
    );
  });
});

// Вход (рабочая версия)
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
      
      // Проверяем пароль (в открытом виде - для простоты)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Неверный пароль' });
      }
      
      console.log('✅ Успешный вход:', email);
      
      // Убираем пароль из ответа
      delete user.password;
      
      res.json({
        success: true,
        user: user,
        token: `auth-${user.id}-${Date.now()}`
      });
    }
  );
});
// Оформление заказа (с проверкой пользователя)
app.post('/api/orders', (req, res) => {
  const { customer, items, total, userId } = req.body;
  
  if (!customer || !items || items.length === 0) {
    return res.status(400).json({ error: 'Неполные данные заказа' });
  }
  
  // Сохраняем заказ с привязкой к пользователю
  db.run(
    `INSERT INTO orders (user_id, customer_name, customer_email, customer_address, total, comments) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId || null, customer.name, customer.email, customer.address, total, customer.comments || ''],
    function(err) {
      if (err) {
        console.error('Ошибка при сохранении заказа:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      
      const orderId = this.lastID;
      const stmt = db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)'
      );
      
      items.forEach(item => {
        stmt.run(orderId, item.id, item.name, item.quantity, item.price);
      });
      
      stmt.finalize();
      
      // Если есть userId, вычитаем сумму из баланса
      if (userId) {
        db.run(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [total, userId],
          (err) => {
            if (err) console.error('Ошибка обновления баланса:', err.message);
            
            // Получаем обновлённый баланс
            db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
              res.json({
                success: true,
                message: 'Заказ успешно оформлен!',
                orderId: orderId,
                orderNumber: `COSMIC-${orderId}`,
                newBalance: row ? row.balance : 0
              });
            });
          }
        );
      } else {
        res.json({
          success: true,
          message: 'Заказ успешно оформлен!',
          orderId: orderId,
          orderNumber: `COSMIC-${orderId}`
        });
      }
    }
  );
});
// История заказов пользователя
app.get('/api/user/orders', (req, res) => {
  // В реальном проекте здесь должна быть проверка токена
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
