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

// ==================== API С СПИСАНИЕМ БАЛАНСА ====================

// Оформление заказа с проверкой баланса
app.post('/api/orders', async (req, res) => {
  console.log('📦 Получен заказ от:', req.body.customer?.name);
  
  const { customer, items, total, userId } = req.body;
  
  // Проверка данных
  if (!customer || !customer.name || !customer.email || !customer.address) {
    return res.status(400).json({ 
      success: false,
      error: 'Заполните имя, email и адрес' 
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Нет товаров в заказе' 
    });
  }
  
  if (!total || total <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Некорректная сумма заказа' 
    });
  }
  
  // Если есть userId - проверяем баланс
  if (userId) {
    try {
      const user = await getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Пользователь не найден' 
        });
      }
      
      if (user.balance < total) {
        return res.status(400).json({
          success: false,
          error: 'Недостаточно средств на балансе',
          currentBalance: user.balance,
          required: total,
          deficit: total - user.balance
        });
      }
    } catch (error) {
      console.error('❌ Ошибка проверки баланса:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Ошибка проверки баланса' 
      });
    }
  }
  
  // Начинаем транзакцию
  db.serialize(async () => {
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Создаем заказ
      const orderNumber = `COSMIC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const shipping = 500.00;
      const subtotal = total - shipping;
      
      db.run(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, 
          customer_address, subtotal, shipping, total, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, 
          userId || null, 
          customer.name, 
          customer.email, 
          customer.address, 
          subtotal, 
          shipping, 
          total, 
          customer.comments || ''
        ],
        function(err) {
          if (err) {
            console.error('❌ Ошибка при сохранении заказа:', err.message);
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              error: 'Ошибка создания заказа'
            });
          }
          
          const orderId = this.lastID;
          console.log('✅ Заказ создан! ID:', orderId, 'Номер:', orderNumber);
          
          // 2. Добавляем товары
          const insertItems = db.prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)'
          );
          
          let hasError = false;
          
          items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            insertItems.run(
              orderId, 
              item.id, 
              item.name, 
              item.quantity, 
              item.price, 
              itemTotal,
              (err) => {
                if (err) {
                  console.error('❌ Ошибка сохранения товара:', err.message);
                  hasError = true;
                }
              }
            );
          });
          
          insertItems.finalize();
          
          if (hasError) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              error: 'Ошибка сохранения товаров'
            });
          }
          
          console.log('✅ Товары сохранены:', items.length, 'шт.');
          
          // 3. Если есть userId - списываем средства
          if (userId) {
            db.run(
              'UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [total, userId],
              function(err) {
                if (err) {
                  console.error('❌ Ошибка списания средств:', err.message);
                  db.run('ROLLBACK');
                  return res.status(500).json({
                    success: false,
                    error: 'Ошибка списания средств'
                  });
                }
                
                // 4. Записываем транзакцию
                db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
                  if (err) {
                    console.error('❌ Ошибка получения баланса:', err.message);
                  } else {
                    db.run(
                      `INSERT INTO transactions (
                        user_id, type, amount, description, order_id, 
                        previous_balance, new_balance
                      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      [
                        userId,
                        'purchase',
                        -total,
                        `Покупка: заказ ${orderNumber}`,
                        orderId,
                        user.balance + total, // баланс до списания
                        user.balance         // баланс после списания
                      ],
                      (err) => {
                        if (err) console.error('❌ Ошибка записи транзакции:', err.message);
                        else console.log('✅ Транзакция записана');
                      }
                    );
                  }
                  
                  // 5. Фиксируем транзакцию и возвращаем ответ
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('❌ Ошибка коммита:', err.message);
                      return res.status(500).json({
                        success: false,
                        error: 'Ошибка завершения заказа'
                      });
                    }
                    
                    // Получаем обновлённый баланс
                    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, updatedUser) => {
                      const response = {
                        success: true,
                        message: 'Заказ успешно оформлен! Средства списаны с баланса.',
                        orderId: orderId,
                        orderNumber: orderNumber,
                        itemsCount: items.length,
                        subtotal: subtotal,
                        shipping: shipping,
                        total: total,
                        newBalance: updatedUser ? updatedUser.balance : null
                      };
                      
                      if (userId) {
                        response.balanceUpdate = {
                          oldBalance: user.balance + total,
                          amountSpent: total,
                          newBalance: updatedUser.balance
                        };
                      }
                      
                      console.log('🎉 Заказ завершён!', response);
                      res.json(response);
                    });
                  });
                });
              }
            );
          } else {
            // Без userId - просто фиксируем
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('❌ Ошибка коммита:', err.message);
                return res.status(500).json({
                  success: false,
                  error: 'Ошибка завершения заказа'
                });
              }
              
              res.json({
                success: true,
                message: 'Заказ успешно оформлен!',
                orderId: orderId,
                orderNumber: orderNumber,
                itemsCount: items.length,
                total: total
              });
            });
          }
        }
      );
      
    } catch (error) {
      console.error('❌ Неожиданная ошибка:', error);
      db.run('ROLLBACK');
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  });
});

// Вспомогательная функция для получения пользователя
function getUser(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, name, address, role, balance FROM users WHERE id = ?',
      [userId],
      (err, user) => {
        if (err) reject(err);
        else resolve(user);
      }
    );
  });
}

// API для получения баланса пользователя
app.get('/api/user/balance/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get(
    `SELECT 
      u.id, u.email, u.name, u.balance,
      COUNT(DISTINCT o.id) as total_orders,
      SUM(CASE WHEN t.type = 'purchase' THEN ABS(t.amount) ELSE 0 END) as total_spent
     FROM users u
     LEFT JOIN orders o ON u.id = o.user_id
     LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'purchase'
     WHERE u.id = ?
     GROUP BY u.id`,
    [userId],
    (err, result) => {
      if (err) {
        console.error('❌ Ошибка получения баланса:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      
      if (!result) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      res.json({
        success: true,
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          balance: result.balance,
          stats: {
            totalOrders: result.total_orders || 0,
            totalSpent: result.total_spent || 0
          }
        }
      });
    }
  );
});

// API для пополнения баланса
app.post('/api/user/topup', (req, res) => {
  const { userId, amount, paymentMethod = 'card' } = req.body;
  
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Укажите userId и сумму пополнения'
    });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Получаем текущий баланс
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        db.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      const oldBalance = user.balance;
      const newBalance = oldBalance + parseFloat(amount);
      
      // Обновляем баланс
      db.run(
        'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, userId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({
              success: false,
              error: 'Ошибка обновления баланса'
            });
          }
          
          // Записываем транзакцию
          db.run(
            `INSERT INTO transactions (
              user_id, type, amount, description, 
              previous_balance, new_balance
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId,
              'topup',
              amount,
              `Пополнение баланса (${paymentMethod})`,
              oldBalance,
              newBalance
            ],
            (err) => {
              if (err) {
                console.error('❌ Ошибка записи транзакции:', err.message);
              }
              
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('❌ Ошибка коммита:', err.message);
                  return res.status(500).json({
                    success: false,
                    error: 'Ошибка завершения операции'
                  });
                }
                
                res.json({
                  success: true,
                  message: `Баланс успешно пополнен на ${amount} ₽`,
                  balance: {
                    old: oldBalance,
                    added: amount,
                    new: newBalance
                  },
                  transactionId: this.lastID
                });
              });
            }
          );
        }
      );
    });
  });
});

// История транзакций пользователя
app.get('/api/user/transactions/:userId', (req, res) => {
  const userId = req.params.userId;
  const limit = req.query.limit || 10;
  
  db.all(
    `SELECT 
      t.*,
      o.order_number
     FROM transactions t
     LEFT JOIN orders o ON t.order_id = o.id
     WHERE t.user_id = ?
     ORDER BY t.created_at DESC
     LIMIT ?`,
    [userId, limit],
    (err, transactions) => {
      if (err) {
        console.error('❌ Ошибка получения транзакций:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      
      res.json({
        success: true,
        count: transactions.length,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          orderNumber: t.order_number,
          date: t.created_at,
          balanceChange: {
            from: t.previous_balance,
            to: t.new_balance
          }
        }))
      });
    }
  );
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ API ====================

// [Здесь остальные API из предыдущей версии: /api/register, /api/login, /api/orders (GET), /api/test, /api/debug/tables и т.д.]
// Не забудьте скопировать их из предыдущего кода

// ... [Остальной код остается без изменений] ...

// Запуск сервера
app.listen(PORT, () => {
  console.log(`=======================================`);
  console.log(`🚀 Сервер космической аптеки запущен!`);
  console.log(`📍 Порт: ${PORT}`);
  console.log(`📊 База данных: cosmic_pharmacy.db`);
  console.log(`💰 Система баланса: АКТИВНА`);
  console.log(`📋 Доступные API:`);
  console.log(`   POST /api/orders - оформление с списанием баланса`);
  console.log(`   GET  /api/user/balance/:userId - баланс пользователя`);
  console.log(`   POST /api/user/topup - пополнение баланса`);
  console.log(`   GET  /api/user/transactions/:userId - история транзакций`);
  console.log(`=======================================`);
});