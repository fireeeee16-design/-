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