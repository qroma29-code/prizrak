const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');



app.use(express.json());

// 1. АВТОРИЗАЦИЯ МОДЕРАТОРА
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    fs.readFile('moders.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: 'Ошибка чтения файла модераторов' });
        const moders = data.split('\n').map(name => name.trim()).filter(Boolean);
        if (moders.includes(username.trim())) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: 'Логин не найден' });
        }
    });
});

// 2. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ
app.get('/api/orders', (req, res) => {
    fs.readFile('orders.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка чтения базы данных');
        res.json(JSON.parse(data || '[]'));
    });
});

// 3. ДОБАВЛЕНИЕ НОВОГО ЗАКАЗА (Возвращает ID заказа)
app.post('/api/orders/new', (req, res) => {
    const { user, service, price } = req.body;

    fs.readFile('orders.json', 'utf8', (err, data) => {
        let orders = JSON.parse(data || '[]');
        const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;

        const newOrder = {
            id: newId,
            user,
            service,
            price,
            status: "new"
        };

        orders.push(newOrder);

        fs.writeFile('orders.json', JSON.stringify(orders, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            // Передаем клиенту созданный ID, чтобы он мог его отследить
            res.json({ success: true, orderId: newId });
        });
    });
});

// 4. ПОЛУЧЕНИЕ СТАТУСА ОДНОГО КОНКРЕТНОГО ЗАКАЗА
app.get('/api/orders/status/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    
    fs.readFile('orders.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });
        const orders = JSON.parse(data || '[]');
        const targetOrder = orders.find(o => o.id === orderId);
        
        if (targetOrder) {
            res.json({ success: true, status: targetOrder.status });
        } else {
            res.json({ success: false, message: "Заказ не найден" });
        }
    });
});

// 5. ОБНОВЛЕНИЕ СТАТУСА МОДЕРАТОРОМ
app.post('/api/orders/update-status', (req, res) => {
    const { orderId, newStatus } = req.body;
    fs.readFile('orders.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка базы данных');
        
        let orders = JSON.parse(data || '[]');
        orders = orders.map(order => {
            if (order.id === parseInt(orderId)) order.status = newStatus;
            return order;
        });

        fs.writeFile('orders.json', JSON.stringify(orders, null, 2), (err) => {
            if (err) return res.status(500).send('Ошибка записи изменений');
            res.json({ success: true });
        });
    });
});

// РАЗДАЧА СТРАНИЦ
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/order', (req, res) => res.sendFile(path.join(__dirname, 'client.html')));

app.listen(PORT, () => console.log(`Сервер успешно запущен на http://localhost:${PORT}`));
