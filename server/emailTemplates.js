// Шаблоны email сообщений
const emailTemplates = {
    // Приветственное письмо после регистрации
    welcomeEmail: (userData) => ({
        subject: `🚀 Добро пожаловать в Космическую аптеку, ${userData.name}!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background: #0d1b2a; color: #ffffff; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; padding: 30px; }
                    .header { text-align: center; border-bottom: 2px solid #e94560; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #e94560; margin: 0; }
                    .content { line-height: 1.6; }
                    .highlight { color: #e94560; font-weight: bold; }
                    .button { display: inline-block; background: #e94560; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #2a3b5c; color: #aaa; font-size: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Космическая аптека</h1>
                        <p>Интернет-магазин космических медикаментов</p>
                    </div>
                    
                    <div class="content">
                        <h2>Добро пожаловать, ${userData.name}!</h2>
                        
                        <p>Спасибо за регистрацию в нашей космической аптеке! Теперь вы можете:</p>
                        
                        <ul>
                            <li>🛒 <span class="highlight">Покупать</span> уникальные космические медикаменты</li>
                            <li>💰 <span class="highlight">Пополнять баланс</span> и отслеживать расходы</li>
                            <li>📦 <span class="highlight">Оформлять заказы</span> с доставкой в любую точку галактики</li>
                            <li>📊 <span class="highlight">Просматривать историю</span> всех покупок</li>
                        </ul>
                        
                        <p><strong>Ваши данные для входа:</strong></p>
                        <ul>
                            <li><strong>Email:</strong> ${userData.email}</li>
                            <li><strong>Имя:</strong> ${userData.name}</li>
                            <li><strong>Адрес:</strong> ${userData.address || 'Не указан'}</li>
                            <li><strong>Баланс:</strong> ${userData.balance || 0} ₽</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.SITE_URL || 'http://localhost:3000'}" class="button">
                                Начать покупки 🚀
                            </a>
                        </div>
                        
                        <p>Если у вас есть вопросы, просто ответьте на это письмо!</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Космическая аптека. Все права защищены.</p>
                        <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Добро пожаловать в Космическую аптеку, ${userData.name}!
            
            Спасибо за регистрацию! Теперь вы можете:
            - Покупать уникальные космические медикаменты
            - Пополнять баланс и отслеживать расходы
            - Оформлять заказы с доставкой в любую точку галактики
            - Просматривать историю всех покупок
            
            Ваши данные:
            Email: ${userData.email}
            Имя: ${userData.name}
            Адрес: ${userData.address || 'Не указан'}
            Баланс: ${userData.balance || 0} ₽
            
            Начать покупки: ${process.env.SITE_URL || 'http://localhost:3000'}
            
            © ${new Date().getFullYear()} Космическая аптека
        `
    }),
    
    // Письмо о новом заказе
    orderConfirmation: (orderData) => ({
        subject: `✅ Заказ №${orderData.order_number} оформлен!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background: #0d1b2a; color: #ffffff; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; padding: 30px; }
                    .header { text-align: center; border-bottom: 2px solid #27ae60; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #27ae60; margin: 0; }
                    .order-info { background: rgba(39, 174, 96, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a3b5c; }
                    .total { font-size: 1.2em; font-weight: bold; color: #27ae60; text-align: right; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Заказ успешно оформлен!</h1>
                    </div>
                    
                    <p>Уважаемый ${orderData.customer_name},</p>
                    
                    <p>Ваш заказ <strong>№${orderData.order_number}</strong> успешно оформлен и принят в обработку.</p>
                    
                    <div class="order-info">
                        <h3>Детали заказа:</h3>
                        ${orderData.items.map(item => `
                            <div class="item">
                                <span>${item.name} x ${item.quantity}</span>
                                <span>${item.total_price} ₽</span>
                            </div>
                        `).join('')}
                        
                        <div class="total">
                            Итого: ${orderData.total} ₽
                        </div>
                    </div>
                    
                    <p><strong>Статус:</strong> ${orderData.status}</p>
                    <p><strong>Адрес доставки:</strong> ${orderData.address}</p>
                    <p><strong>Дата заказа:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
                    
                    <p>Спасибо за покупку! 🚀</p>
                </div>
            </body>
            </html>
        `
    })
};

module.exports = emailTemplates;