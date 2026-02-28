<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BATONIO - Курьер</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            padding-bottom: 80px;
        }
        
        /* Экран входа */
        .login-screen {
            max-width: 400px;
            margin: 50px auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .login-logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
        }
        
        .login-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .login-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #333;
        }
        
        .login-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
        }
        
        .login-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: 500;
        }
        
        .login-input:focus {
            border-color: #0088cc;
            outline: none;
        }
        
        .login-btn {
            width: 100%;
            padding: 15px;
            background: #0088cc;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s;
        }
        
        .login-btn:hover {
            opacity: 0.9;
        }
        
        .login-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .login-error {
            color: #f44336;
            font-size: 14px;
            margin-top: 10px;
            min-height: 20px;
        }
        
        /* Основной экран */
        .main-screen {
            display: none;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .main-screen.active {
            display: block;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .header-title {
            font-size: 20px;
            font-weight: 700;
            color: #333;
        }
        
        .header-courier {
            background: #0088cc;
            color: white;
            padding: 8px 15px;
            border-radius: 30px;
            font-weight: 500;
        }
        
        .logout-btn {
            background: none;
            border: none;
            color: #999;
            font-size: 24px;
            cursor: pointer;
            padding: 0 10px;
        }
        
        .logout-btn:hover {
            color: #f44336;
        }
        
        /* Фильтры */
        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            background: white;
            padding: 10px;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .filter-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 10px;
            background: #f0f0f0;
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .filter-btn.active {
            background: #0088cc;
            color: white;
        }
        
        .filter-btn.pizza.active {
            background: #ff6b6b;
        }
        
        /* Список заказов */
        .orders-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .order-card {
            background: white;
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-left: 4px solid #0088cc;
        }
        
        .order-card.pizza {
            border-left-color: #ff6b6b;
        }
        
        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .order-id {
            font-weight: 700;
            color: #333;
        }
        
        .order-category {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 30px;
            background: #f0f0f0;
        }
        
        .order-category.pizza {
            background: #ff6b6b;
            color: white;
        }
        
        .order-status {
            padding: 4px 12px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-ready {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        
        .status-taken {
            background: #cce5ff;
            color: #004085;
        }
        
        .order-address {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .order-items {
            font-size: 14px;
            color: #333;
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .order-courier {
            font-size: 13px;
            color: #666;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .order-actions {
            display: flex;
            gap: 10px;
        }
        
        .nav-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: #e3f2fd;
            color: #0d47a1;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
        
        .take-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: #ff9800;
            color: white;
            font-weight: 600;
            cursor: pointer;
        }
        
        .deliver-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: #4caf50;
            color: white;
            font-weight: 600;
            cursor: pointer;
        }
        
        .deliver-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            background: white;
            border-radius: 15px;
            color: #999;
        }
        
        .toast {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 14px;
            z-index: 20000;
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
    </style>
</head>
<body>
    <!-- Экран входа -->
    <div class="login-screen" id="loginScreen">
        <div class="login-logo">
            <img src="https://i.ibb.co/qFyjcZ5D/IMG-20260215-141126-1.png" alt="BATONIO">
        </div>
        <div class="login-title">BATONIO</div>
        <div class="login-subtitle">Вход для курьеров</div>
        
        <input type="text" class="login-input" id="courierCode" placeholder="Ваш код" autocomplete="off">
        <button class="login-btn" id="loginBtn">Войти</button>
        <div class="login-error" id="loginError"></div>
    </div>
    
    <!-- Основной экран -->
    <div class="main-screen" id="mainScreen">
        <div class="header">
            <button class="logout-btn" id="logoutBtn">←</button>
            <div class="header-title">Заказы на сегодня</div>
            <div class="header-courier" id="courierName"></div>
        </div>
        
        <div class="filters">
            <button class="filter-btn active" id="filterAll">Все</button>
            <button class="filter-btn" id="filterRegular">Хлеб</button>
            <button class="filter-btn pizza" id="filterPizza">Пицца</button>
            <button class="filter-btn" id="filterMy">Мои</button>
        </div>
        
        <div class="orders-list" id="ordersList"></div>
    </div>
    
    <script>
        const API_URL = 'https://script.google.com/macros/s/AKfycbymd47Au5nGvOIaspBqVhDWXtU73_s_pLVire3hEKeXhEnZihvGinDFIEBODKlMF4SO/exec';
        
        let currentCourier = null;
        let currentFilter = 'all';
        let allOrders = [];
        
        // Проверяем сохранённый вход
        const savedCode = localStorage.getItem('courierCode');
        if (savedCode) {
            loginWithCode(savedCode);
        }
        
        // Вход по коду
        document.getElementById('loginBtn').addEventListener('click', () => {
            const code = document.getElementById('courierCode').value.trim();
            loginWithCode(code);
        });
        
        function loginWithCode(code) {
            if (!code) {
                showError('Введите код');
                return;
            }
            
            const callbackName = 'jsonp_login_' + Date.now();
            window[callbackName] = function(data) {
                delete window[callbackName];
                if (data.success && data.courier) {
                    currentCourier = data.courier;
                    localStorage.setItem('courierCode', code);
                    
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('mainScreen').classList.add('active');
                    document.getElementById('courierName').textContent = data.courier.name;
                    
                    loadOrders();
                } else {
                    showError('Неверный код или курьер не активен');
                }
            };
            
            const script = document.createElement('script');
            script.src = `${API_URL}?callback=${callbackName}&action=checkCourier&code=${encodeURIComponent(code)}`;
            document.head.appendChild(script);
        }
        
        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            currentCourier = null;
            localStorage.removeItem('courierCode');
            document.getElementById('loginScreen').style.display = 'block';
            document.getElementById('mainScreen').classList.remove('active');
            document.getElementById('courierCode').value = '';
        });
        
        // Фильтры
        document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
        document.getElementById('filterRegular').addEventListener('click', () => setFilter('regular'));
        document.getElementById('filterPizza').addEventListener('click', () => setFilter('pizza'));
        document.getElementById('filterMy').addEventListener('click', () => setFilter('my'));
        
        function setFilter(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add('active');
            renderOrders();
        }
        
        // Загрузка заказов
        function loadOrders() {
            const callbackName = 'jsonp_orders_' + Date.now();
            window[callbackName] = function(data) {
                delete window[callbackName];
                allOrders = data.orders || [];
                renderOrders();
            };
            
            const script = document.createElement('script');
            script.src = `${API_URL}?callback=${callbackName}&action=getAllTodayOrders`;
            document.head.appendChild(script);
        }
        
        // Взять заказ
        function takeOrder(orderId, category) {
            const callbackName = 'jsonp_take_' + Date.now();
            window[callbackName] = function(data) {
                delete window[callbackName];
                if (data.success) {
                    showToast('✅ Заказ взят в работу');
                    loadOrders();
                } else {
                    showToast('❌ Ошибка: ' + data.error);
                }
            };
            
            const script = document.createElement('script');
            script.src = `${API_URL}?callback=${callbackName}&action=takeOrder&orderId=${orderId}&category=${encodeURIComponent(category)}&courier=${encodeURIComponent(currentCourier.code)}`;
            document.head.appendChild(script);
        }
        
        // Отметить доставку
        function markDelivered(orderId, category) {
            const callbackName = 'jsonp_deliver_' + Date.now();
            window[callbackName] = function(data) {
                delete window[callbackName];
                if (data.success) {
                    showToast('✅ Заказ доставлен');
                    loadOrders();
                } else {
                    showToast('❌ Ошибка: ' + data.error);
                }
            };
            
            const script = document.createElement('script');
            script.src = `${API_URL}?callback=${callbackName}&action=markDelivered&orderId=${orderId}&category=${encodeURIComponent(category)}&courier=${encodeURIComponent(currentCourier.code)}`;
            document.head.appendChild(script);
        }
        
        // Открыть навигатор
        function openNavigator(address) {
            const url = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        }
        
        // Отрисовка заказов
        function renderOrders() {
            const container = document.getElementById('ordersList');
            
            let filtered = allOrders;
            
            // Применяем фильтр
            if (currentFilter === 'regular') {
                filtered = filtered.filter(o => o.category === 'Обычные');
            } else if (currentFilter === 'pizza') {
                filtered = filtered.filter(o => o.category === 'Пицца');
            } else if (currentFilter === 'my') {
                filtered = filtered.filter(o => o.courier === currentCourier?.name);
            }
            
            if (filtered.length === 0) {
                container.innerHTML = '<div class="empty-state">📦 Заказов нет</div>';
                return;
            }
            
            let html = '';
            filtered.forEach(order => {
                const isPizza = order.category === 'Пицца';
                const categoryClass = isPizza ? 'pizza' : '';
                
                let statusClass = 'status-ready';
                let statusText = '🕒 Готов';
                let actionButton = '';
                
                if (order.status === 'Доставлено') {
                    statusClass = 'status-delivered';
                    statusText = '✅ Доставлено';
                } else if (order.courier) {
                    if (order.courier === currentCourier?.name) {
                        statusClass = 'status-taken';
                        statusText = '🚚 У вас';
                        actionButton = `<button class="deliver-btn" onclick="markDelivered('${order.id}', '${order.category}')">✅ Доставлено</button>`;
                    } else {
                        statusClass = 'status-taken';
                        statusText = `👤 У ${order.courier}`;
                    }
                } else {
                    actionButton = `<button class="take-btn" onclick="takeOrder('${order.id}', '${order.category}')">📦 Взять</button>`;
                }
                
                html += `
                    <div class="order-card ${isPizza ? 'pizza' : ''}">
                        <div class="order-header">
                            <span class="order-id">Заказ #${order.id}</span>
                            <span class="order-category ${categoryClass}">${order.category}</span>
                            <span class="order-status ${statusClass}">${statusText}</span>
                        </div>
                        <div class="order-address">📍 ${order.address}</div>
                        <div class="order-items">${order.items}</div>
                        ${order.courier ? `<div class="order-courier">👤 Курьер: ${order.courier}</div>` : ''}
                        <div class="order-actions">
                            <button class="nav-btn" onclick="openNavigator('${order.address.replace(/'/g, "\\'")}')">🗺️ Маршрут</button>
                            ${actionButton}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
        
        function showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        function showError(msg) {
            document.getElementById('loginError').textContent = msg;
        }
    </script>
</body>
</html>

