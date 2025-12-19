// Конфигурация для отправки email
const nodemailer = require('nodemailer');

// Для тестирования используем Ethereal.email (бесплатный тестовый сервис)
const createTestAccount = async () => {
    try {
        // Создаем тестовый аккаунт на ethereal.email
        const testAccount = await nodemailer.createTestAccount();
        
        return {
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        };
    } catch (error) {
        console.error('❌ Ошибка создания тестового email аккаунта:', error);
        return null;
    }
};

// Для продакшена (например, Gmail)
const getProductionConfig = () => {
    return {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,    // Ваш Gmail
            pass: process.env.EMAIL_PASS     // Пароль приложения
        }
    };
};

// Выбираем конфигурацию в зависимости от окружения
const getEmailConfig = async () => {
    if (process.env.NODE_ENV === 'production') {
        return getProductionConfig();
    } else {
        // В development используем тестовый аккаунт
        return await createTestAccount();
    }
};

// Создаем transporter
const createTransporter = async () => {
    const config = await getEmailConfig();
    
    if (!config) {
        console.warn('⚠️ Email transporter не создан. Отправка писем отключена.');
        return null;
    }
    
    const transporter = nodemailer.createTransport(config);
    
    // Проверяем соединение
    try {
        await transporter.verify();
        console.log('✅ Email transporter готов к отправке');
        
        // Если это тестовый аккаунт, покажем данные для входа
        if (config.host === 'smtp.ethereal.email') {
            console.log('📧 Тестовый email аккаунт создан:');
            console.log('   Email:', config.auth.user);
            console.log('   Пароль:', config.auth.pass);
            console.log('   Для просмотра писем: https://ethereal.email');
        }
        
        return transporter;
    } catch (error) {
        console.error('❌ Ошибка настройки email:', error);
        return null;
    }
};

// Функция отправки email
const sendEmail = async (transporter, mailOptions) => {
    if (!transporter) {
        console.warn('⚠️ Transporter не доступен. Письмо не отправлено.');
        return null;
    }
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email отправлен:', info.messageId);
        
        // Если это тестовый email, покажем ссылку для просмотра
        if (transporter.options.host === 'smtp.ethereal.email') {
            console.log('📧 Просмотр письма: %s', nodemailer.getTestMessageUrl(info));
        }
        
        return info;
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error);
        return null;
    }
};

module.exports = {
    createTransporter,
    sendEmail,
    getEmailConfig
};