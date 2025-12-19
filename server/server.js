require('dotenv').config();
const emailTemplates = require('./emailTemplates');
const { createTransporter, sendEmail } = require('./emailConfig');
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

// База данных
const db = new sqlite3.Database('./cosmic_pharmacy.db', (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
  } else {
    console.log('✅ База данных подключена');
    db.run('PRAGMA foreign_keys = ON');
    initializeDatabase();
  }
});

// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================

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
    
    // 2. Таблица категорий
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
    
    // 6. Таблица транзакций
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
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


// Вызовите эту функцию в seedInitialData() после создания пользователей:
    console.log('🎯 Все таблицы созданы успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
  }
}
// ПЕРЕД функцией initializeDatabase добавьте:
function createDemoOrders(callback) {
    console.log('📦 Создаю демо-заказы...');
    
    const demoOrders = [
        {
            userId: 2, // test@test.com
            customerName: 'Тестовый Пользователь',
            customerEmail: 'test@test.com',
            customerAddress: 'Марс, база Альфа',
            products: [
                { id: 1, name: 'Антигравитацин', price: 2500, quantity: 2 },
                { id: 4, name: 'Костный регенератор', price: 5400, quantity: 1 }
            ],
            total: 10400,
            status: 'completed'
        },
        {
            userId: 2,
            customerName: 'Тестовый Пользователь',
            customerEmail: 'test@test.com',
            customerAddress: 'Марс, база Альфа',
            products: [
                { id: 3, name: 'Генная адаптация Марс', price: 8500, quantity: 1 }
            ],
            total: 9000,
            status: 'delivered'
        },
        {
            userId: 1, // admin
            customerName: 'Главный Администратор',
            customerEmail: 'admin@cosmic.pharmacy',
            customerAddress: 'Орбитальная станция "Мир-2"',
            products: [
                { id: 8, name: 'Гиперпространственный адаптоген', price: 9200, quantity: 2 },
                { id: 5, name: 'Нейростабилизатор', price: 4100, quantity: 1 }
            ],
            total: 22500,
            status: 'processing'
        }
    ];
    
    let created = 0;
    
    demoOrders.forEach((order, index) => {
        const orderNumber = `ORD-DEMO-${Date.now()}-${index + 1}`;
        
        // Создаем заказ
        db.run(
            `INSERT INTO orders (order_number, user_id, customer_name, customer_email, 
             customer_address, subtotal, shipping, total, status, payment_status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-${index} days'))`,
            [
                orderNumber,
                order.userId,
                order.customerName,
                order.customerEmail,
                order.customerAddress,
                order.total - 500,
                500,
                order.total,
                order.status,
                'paid'
            ],
            function(err) {
                if (err) {
                    console.error('Ошибка создания демо-заказа:', err.message);
                    return;
                }
                
                const orderId = this.lastID;
                
                // Добавляем товары
                order.products.forEach(product => {
                    db.run(
                        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [orderId, product.id, product.name, product.quantity, product.price, product.price * product.quantity]
                    );
                });
                
                // Списываем баланс
                db.run(
                    'UPDATE users SET balance = balance - ? WHERE id = ?',
                    [order.total, order.userId]
                );
                
                // Транзакция
                db.run(
                    `INSERT INTO transactions (user_id, type, amount, description, order_id)
                     VALUES (?, ?, ?, ?, ?)`,
                    [order.userId, 'purchase', order.total, `Демо-заказ #${orderNumber}`, orderId]
                );
                
                created++;
                if (created === demoOrders.length) {
                    console.log(`✅ Создано ${demoOrders.length} демо-заказов`);
                    if (callback) callback();
                }
            }
        );
    });
}
// Вспомогательная функция
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

let emailTransporter = null;

// Инициализация email (после подключения к БД)
(async () => {
    emailTransporter = await createTransporter();
    console.log(emailTransporter ? '✅ Email transporter готов' : '⚠️ Email transporter не доступен');
})();
// ==================== ОСНОВНЫЕ API МАРШРУТЫ ====================

// 1. Регистрация пользователя с отправкой email
app.post('/api/register', async (req, res) => {
    const { email, password, name, address } = req.body;
    
    console.log('📝 Регистрация нового пользователя:', email);
    
    if (!email || !password || !name) {
        return res.status(400).json({ 
            success: false,
            error: 'Заполните email, пароль и имя' 
        });
    }
    
    try {
        // Проверяем, существует ли email
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'Email уже используется' 
            });
        }
        
        // Создаем пользователя
        const newUser = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (email, password, name, address, balance) VALUES (?, ?, ?, ?, ?)',
                [email, password, name, address || '', 0],
                function(err) {
                    if (err) reject(err);
                    else {
                        db.get('SELECT id, email, name, address, role, balance FROM users WHERE id = ?', 
                            [this.lastID], (err, user) => {
                                if (err) reject(err);
                                else resolve(user);
                            });
                    }
                }
            );
        });
        
        console.log('✅ Новый пользователь создан:', email, 'ID:', newUser.id);
        
        // Отправляем приветственное письмо
        if (emailTransporter) {
            const emailTemplates = require('./emailTemplates');
            const welcomeEmail = emailTemplates.welcomeEmail(newUser);
            
            await sendEmail(emailTransporter, {
                from: '"Космическая аптека" <noreply@cosmic.pharmacy>',
                to: email,
                subject: welcomeEmail.subject,
                html: welcomeEmail.html,
                text: welcomeEmail.text
            });
            
            console.log('📧 Приветственное письмо отправлено на:', email);
        } else {
            console.log('⚠️ Email transporter не доступен. Письмо не отправлено.');
        }
        
        res.json({
            success: true,
            user: newUser,
            emailSent: !!emailTransporter
        });
        
    } catch (error) {
        console.error('❌ Ошибка при регистрации:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера' 
        });
    }
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

// 4. КРИТИЧЕСКИЙ МАРШРУТ: Оформление заказа с проверкой баланса и отправкой email
app.post('/api/orders', async (req, res) => {
  console.log('🛒 Получен запрос на оформление заказа');
  
  const { customer, items, total, userId } = req.body;
  
  // Валидация данных
  if (!customer || !items || !total || !userId) {
    console.error('❌ Неполные данные заказа');
    return res.status(400).json({
      success: false,
      error: 'Неполные данные заказа'
    });
  }
  
  if (items.length === 0) {
    console.error('❌ Пустой заказ');
    return res.status(400).json({
      success: false,
      error: 'Корзина пуста'
    });
  }
  
  try {
    // Проверяем наличие пользователя и баланса
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, balance, name, email, address FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      console.error('❌ Пользователь не найден:', userId);
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    // Проверяем баланс
    if (user.balance < total) {
      console.error(`❌ Недостаточно средств: баланс ${user.balance}, нужно ${total}`);
      return res.status(400).json({
        success: false,
        error: `Недостаточно средств. Баланс: ${user.balance} ₽, нужно: ${total} ₽`
      });
    }
    
    // Начинаем транзакцию
    const result = await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Генерируем номер заказа
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const orderEmail = customer.email || user.email;
        
        // Вставляем заказ
        db.run(
          `INSERT INTO orders (
            order_number, user_id, customer_name, customer_email, 
            customer_address, subtotal, shipping, total, status, 
            payment_status, comments
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderNumber,
            userId,
            customer.name || user.name,
            orderEmail,
            customer.address || user.address || '',
            total - 500, // subtotal
            500, // shipping
            total,
            'new',
            'paid',
            customer.comments || ''
          ],
          function(orderErr) {
            if (orderErr) {
              console.error('❌ Ошибка создания заказа:', orderErr.message);
              db.run('ROLLBACK');
              return reject(new Error('Ошибка создания заказа'));
            }
            
            const orderId = this.lastID;
            console.log(`✅ Заказ создан: #${orderNumber}, ID: ${orderId}`);
            
            // Добавляем товары заказа
            let itemsProcessed = 0;
            items.forEach(item => {
              db.run(
                `INSERT INTO order_items (
                  order_id, product_id, product_name, 
                  quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  orderId,
                  item.id,
                  item.name,
                  item.quantity,
                  item.price,
                  item.price * item.quantity
                ],
                (itemErr) => {
                  if (itemErr) {
                    console.error('❌ Ошибка добавления товара:', itemErr.message);
                    db.run('ROLLBACK');
                    return reject(new Error('Ошибка добавления товаров в заказ'));
                  }
                  
                  itemsProcessed++;
                  
                  // Когда все товары добавлены
                  if (itemsProcessed === items.length) {
                    // Списываем средства с баланса
                    const newBalance = user.balance - total;
                    
                    db.run(
                      'UPDATE users SET balance = ? WHERE id = ?',
                      [newBalance, userId],
                      (balanceErr) => {
                        if (balanceErr) {
                          console.error('❌ Ошибка списания средств:', balanceErr.message);
                          db.run('ROLLBACK');
                          return reject(new Error('Ошибка списания средств'));
                        }
                        
                        // Записываем транзакцию
                        db.run(
                          `INSERT INTO transactions (
                            user_id, type, amount, description, 
                            order_id, previous_balance, new_balance
                          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                          [
                            userId,
                            'purchase',
                            total,
                            `Оплата заказа #${orderNumber}`,
                            orderId,
                            user.balance,
                            newBalance
                          ],
                          (transactionErr) => {
                            if (transactionErr) {
                              console.error('❌ Ошибка записи транзакции:', transactionErr.message);
                              db.run('ROLLBACK');
                              return reject(new Error('Ошибка записи транзакции'));
                            }
                            
                            // Фиксируем транзакцию
                            db.run('COMMIT', (commitErr) => {
                              if (commitErr) {
                                console.error('❌ Ошибка коммита транзакции:', commitErr.message);
                                return reject(new Error('Ошибка завершения операции'));
                              }
                              
                              console.log(`✅ Заказ #${orderNumber} успешно оформлен!`);
                              console.log(`💰 Списано: ${total} ₽, Новый баланс: ${newBalance} ₽`);
                              
                              resolve({
                                orderNumber,
                                orderId,
                                newBalance,
                                orderEmail,
                                customerName: customer.name || user.name
                              });
                            });
                          }
                        );
                      }
                    );
                  }
                }
              );
            });
          }
        );
      });
    });
    
    // Отправляем email уведомление о заказе
    try {
      if (emailTransporter && result.orderEmail) {
        const orderEmailTemplate = emailTemplates.orderConfirmation({
          order_number: result.orderNumber,
          customer_name: result.customerName,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            total_price: item.price * item.quantity
          })),
          total: total,
          status: 'new',
          address: customer.address || user.address || '',
          created_at: new Date().toISOString()
        });
        
        await sendEmail(emailTransporter, {
          from: '"Космическая аптека" <orders@cosmic.pharmacy>',
          to: result.orderEmail,
          subject: orderEmailTemplate.subject,
          html: orderEmailTemplate.html
        });
        
        console.log('📧 Уведомление о заказе отправлено на:', result.orderEmail);
      }
    } catch (emailError) {
      console.error('⚠️ Ошибка отправки email:', emailError);
      // Не прерываем ответ, если email не отправился
    }
    
    // Возвращаем успешный ответ
    res.json({
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      newBalance: result.newBalance,
      emailSent: !!emailTransporter && !!result.orderEmail,
      message: `Заказ #${result.orderNumber} успешно оформлен!`
    });
    
  } catch (error) {
    console.error('❌ Ошибка оформления заказа:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка сервера при оформлении заказа'
    });
  }
});

// 5. Получение всех заказов (для отладки)
app.get('/api/orders', (req, res) => {
  db.all(`
    SELECT o.*, u.name as user_name, u.email as user_email 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    ORDER BY o.created_at DESC
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 6. Заказы пользователя
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

// 7. Баланс пользователя
app.get('/api/user/balance/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get('SELECT id, name, email, balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('❌ Ошибка получения баланса:', err.message);
      return res.status(500).json({ 
        success: false,
        error: 'Ошибка сервера' 
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Пользователь не найден' 
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  });
});

// 8. Пополнение баланса
app.post('/api/user/topup', (req, res) => {
  const { userId, amount } = req.body;
  
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Некорректные данные'
    });
  }
  
  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    const newBalance = user.balance + parseFloat(amount);
    
    db.run(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance, userId],
      function(updateErr) {
        if (updateErr) {
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
          [userId, 'topup', amount, 'Пополнение баланса', user.balance, newBalance],
          (transactionErr) => {
            if (transactionErr) {
              console.error('Ошибка записи транзакции:', transactionErr.message);
            }
            
            res.json({
              success: true,
              newBalance: newBalance,
              message: `Баланс пополнен на ${amount} ₽`
            });
          }
        );
      }
    );
  });
});

// 9. История транзакций пользователя
app.get('/api/user/transactions/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all(
    `SELECT t.*, o.order_number 
     FROM transactions t
     LEFT JOIN orders o ON t.order_id = o.id
     WHERE t.user_id = ?
     ORDER BY t.created_at DESC
     LIMIT 50`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('❌ Ошибка получения транзакций:', err.message);
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      res.json(rows);
    }
  );
});

// ==================== ТЕСТОВЫЕ МАРШРУТЫ ====================

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
      'GET  /api/user/transactions/:userId - транзакции'
    ]
  });
});

// Проверка здоровья сервера
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
// ==================== ДЛЯ СТРАНИЦЫ СТАТИСТИКИ ====================

// 1. Полная статистика для дашборда
app.get('/api/admin/dashboard', (req, res) => {
    db.serialize(() => {
        const dashboardData = {};
        
        // 1. Базовая статистика
        db.all(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM orders) as total_orders,
                (SELECT IFNULL(SUM(total), 0) FROM orders) as total_revenue,
                (SELECT COUNT(*) FROM products) as total_products,
                (SELECT IFNULL(AVG(total), 0) FROM orders) as avg_order_value
        `, [], (err, stats) => {
            if (stats && stats.length > 0) {
                dashboardData.statistics = stats[0];
            }
            
            // 2. Последние 10 заказов
            db.all(`
                SELECT o.*, u.email, u.name as user_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT 10
            `, [], (err, recentOrders) => {
                dashboardData.recentOrders = recentOrders || [];
                
                // 3. Топ товаров
                db.all(`
                    SELECT 
                        p.name,
                        SUM(oi.quantity) as total_sold,
                        SUM(oi.total_price) as total_revenue
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    GROUP BY p.id
                    ORDER BY total_sold DESC
                    LIMIT 5
                `, [], (err, popularProducts) => {
                    dashboardData.popularProducts = popularProducts || [];
                    
                    // 4. Статусы заказов
                    db.all(`
                        SELECT 
                            status,
                            COUNT(*) as count,
                            SUM(total) as revenue
                        FROM orders
                        GROUP BY status
                    `, [], (err, orderStatuses) => {
                        dashboardData.orderStatuses = orderStatuses || [];
                        
                        res.json({
                            success: true,
                            timestamp: new Date().toISOString(),
                            ...dashboardData
                        });
                    });
                });
            });
        });
    });
});
// После успешного оформления заказа добавьте:
const emailTemplates = require('./emailTemplates');

// Отправляем письмо о заказе
if (emailTransporter && customer.email) {
    const orderEmail = emailTemplates.orderConfirmation({
        order_number: orderNumber,
        customer_name: customer.name || user.name,
        items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            total_price: item.price * item.quantity
        })),
        total: total,
        status: 'new',
        address: customer.address || user.address || '',
        created_at: new Date().toISOString()
    });
    
    await sendEmail(emailTransporter, {
        from: '"Космическая аптека" <orders@cosmic.pharmacy>',
        to: customer.email,
        subject: orderEmail.subject,
        html: orderEmail.html
    });
    
    console.log('📧 Уведомление о заказе отправлено на:', customer.email);
}
// 2. Простой API для получения всех данных таблиц
app.get('/api/admin/tables', (req, res) => {
    const tables = ['users', 'orders', 'products', 'order_items', 'transactions'];
    const result = {};
    let processed = 0;
    
    tables.forEach(table => {
        db.all(`SELECT * FROM ${table} LIMIT 50`, [], (err, rows) => {
            result[table] = rows || [];
            processed++;
            
            if (processed === tables.length) {
                res.json({
                    success: true,
                    tables: result
                });
            }
        });
    });
});

// 3. Очистка тестовых данных (только для демо)
app.post('/api/admin/reset-demo', (req, res) => {
    // Удаляем все заказы и транзакции, оставляя пользователей и товары
    db.serialize(() => {
        db.run('DELETE FROM transactions');
        db.run('DELETE FROM order_items');
        db.run('DELETE FROM orders');
        
        // Восстанавливаем начальный баланс
        db.run('UPDATE users SET balance = 100000 WHERE email = "admin@cosmic.pharmacy"');
        db.run('UPDATE users SET balance = 5000 WHERE email = "test@test.com"');
        
        // Создаем новые демо-заказы
        setTimeout(() => {
            createDemoOrders(() => {
                res.json({
                    success: true,
                    message: 'Демо-данные сброшены и созданы заново'
                });
            });
        }, 1000);
    });
});
// Экспорт всех данных в JSON
app.get('/api/export/all', (req, res) => {
    db.serialize(() => {
        const data = {};
        
        db.all('SELECT * FROM users', [], (err, users) => {
            data.users = users;
            
            db.all('SELECT * FROM orders', [], (err, orders) => {
                data.orders = orders;
                
                db.all('SELECT * FROM order_items', [], (err, items) => {
                    data.order_items = items;
                    
                    db.all('SELECT * FROM transactions', [], (err, transactions) => {
                        data.transactions = transactions;
                        
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Content-Disposition', 'attachment; filename="cosmic_backup.json"');
                        res.json(data);
                    });
                });
            });
        });
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
  console.log(`=======================================`);
  console.log(`🌐 Доступно по адресу: http://localhost:${PORT}`);
  console.log(`💡 Тестируйте заказы с пользователем test@test.com / 123`);
  console.log(`=======================================`);
});