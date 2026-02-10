// BATONIO - Простой магазин выпечки
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Магазин BATONIO запущен!');
    
    // Данные магазина (ЗДЕСЬ МЕНЯТЬ ТОВАРЫ!)
    const shopData = {
        settings: {
            name: 'BATONIO 🥖',
            color: '#667eea',
            delivery: 'Доставка завтра с 17:00 до 20:00'
        },
        products: [
            {
                id: 1,
                name: "Багет французский",
                category: "выпечка",
                price: 120,
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
                weight: "300г",
                max: 10
            },
            {
                id: 2,
                name: "Круассан с шоколадом",
                category: "выпечка",
                price: 130,
                image: "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?w=400&h=400&fit=crop",
                weight: "150г",
                max: 10
            },
            {
                id: 3,
                name: "Пельмени классические",
                category: "заморозка",
                price: 280,
                image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop",
                weight: "500г",
                max: 10
            },
            {
                id: 4,
                name: "Кола 1л",
                category: "напитки",
                price: 150,
                image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop",
                weight: "1л",
                max: 5
            },
            {
                id: 5,
                name: "Пирожок с капустой",
                category: "выпечка",
                price: 80,
                image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
                weight: "200г",
                max: 10
            },
            {
                id: 6,
                name: "Сок апельсиновый",
                category: "напитки",
                price: 180,
                image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop",
                weight: "1л",
                max: 5
            }
        ],
        cart: [],
        categories: ['все', 'выпечка', 'заморозка', 'напитки']
    };
    
    // Загружаем корзину из памяти
    loadCart();
    
    // Настраиваем магазин
    setupShop();
    
    // Показываем товары
    showProducts('все');
    
    // Обновляем корзину
    updateCart();
    
    // ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
    
    function setupShop() {
        // Название магазина
        document.getElementById('shopName').textContent = shopData.settings.name;
        
        // Время доставки
        document.getElementById('deliveryInfo').innerHTML = `
            <i class="fas fa-truck"></i>
            <span>${shopData.settings.delivery}</span>
        `;
        
        // Цвет магазина
        document.querySelector('.app-header').style.background = 
            `linear-gradient(135deg, ${shopData.settings.color} 0%, #764ba2 100%)`;
        
        // Кнопки категорий
        const categoriesNav = document.getElementById('categoriesNav');
        categoriesNav.innerHTML = '';
        
        shopData.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.textContent = category === 'все' ? 'Все товары' : category;
            button.dataset.category = category;
            
            if (category === 'все') button.classList.add('active');
            
            button.addEventListener('click', function() {
                // Убираем активный класс у всех кнопок
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                
                // Показываем товары выбранной категории
                showProducts(this.dataset.category);
            });
            
            categoriesNav.appendChild(button);
        });
        
        // Кнопка корзины
        document.getElementById('cartBtn').addEventListener('click', showCart);
        
        // Кнопка оформления заказа
        document.getElementById('checkoutBtn').addEventListener('click', checkout);
    }
    
    function showProducts(category) {
        const container = document.getElementById('productsGrid');
        
        // Фильтруем товары
        let productsToShow = shopData.products;
        if (category !== 'все') {
            productsToShow = shopData.products.filter(p => p.category === category);
        }
        
        // Если нет товаров
        if (productsToShow.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <p>😔 В этой категории пока нет товаров</p>
                </div>
            `;
            return;
        }
        
        // Показываем товары
        container.innerHTML = productsToShow.map(product => `
            <div class="product-card" onclick="addToCart(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">${product.weight}</div>
                    <div class="product-price">${product.price} ₽</div>
                </div>
            </div>
        `).join('');
    }
    
    // Глобальная функция для добавления в корзину
    window.addToCart = function(productId) {
        const product = shopData.products.find(p => p.id === productId);
        if (!product) return;
        
        // Проверяем, есть ли уже в корзине
        const cartItem = shopData.cart.find(item => item.id === productId);
        
        if (cartItem) {
            // Если уже есть, увеличиваем количество
            if (cartItem.quantity < product.max) {
                cartItem.quantity++;
            } else {
                alert(`Максимальное количество: ${product.max} шт.`);
                return;
            }
        } else {
            // Если нет, добавляем новый товар
            shopData.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: 1,
                max: product.max
            });
        }
        
        // Сохраняем и обновляем
        saveCart();
        updateCart();
        showNotification(`${product.name} добавлен в корзину!`);
    };
    
    function showCart() {
        if (shopData.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }
        
        let cartText = '🛒 Ваша корзина:\n\n';
        let total = 0;
        
        shopData.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            cartText += `${item.name} × ${item.quantity} = ${itemTotal} ₽\n`;
        });
        
        cartText += `\n💰 Итого: ${total} ₽`;
        cartText += '\n\nНажмите "Оформить заказ" для продолжения';
        
        alert(cartText);
    }
    
    function checkout() {
        if (shopData.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }
        
        // Собираем данные
        const total = shopData.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderDetails = shopData.cart.map(item => 
            `${item.name} × ${item.quantity}`
        ).join(', ');
        
        // Запрашиваем данные клиента
        const name = prompt('Ваше имя:');
        if (!name) return;
        
        const phone = prompt('Ваш телефон:');
        if (!phone) return;
        
        const address = prompt('Адрес доставки (улица, дом, квартира):');
        if (!address) return;
        
        // Формируем сообщение о заказе
        const orderMessage = `
✅ ЗАКАЗ ПРИНЯТ!

👤 Имя: ${name}
📞 Телефон: ${phone}
📍 Адрес: ${address}

🛒 Заказ: ${orderDetails}
💰 Сумма: ${total} ₽

⏰ Доставка: ${shopData.settings.delivery}

Спасибо за заказ! Мы скоро свяжемся с вами.
        `.trim();
        
        // Показываем подтверждение
        alert(orderMessage);
        
        // Очищаем корзину
        shopData.cart = [];
        saveCart();
        updateCart();
        
        // Можно добавить отправку в Google Sheets или Telegram
        console.log('Заказ:', { name, phone, address, total, orderDetails });
    }
    
    function updateCart() {
        const totalItems = shopData.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = shopData.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Обновляем бейдж
        document.getElementById('cartBadge').textContent = totalItems;
        
        // Обновляем панель
        document.getElementById('cartCount').textContent = `${totalItems} товаров`;
        document.getElementById('cartTotal').textContent = `${totalPrice} ₽`;
        
        // Активируем/деактивируем кнопку
        document.getElementById('checkoutBtn').disabled = totalItems === 0;
        
        // Показываем/скрываем панель
        document.getElementById('cartPanel').style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    function saveCart() {
        localStorage.setItem('batonio_cart', JSON.stringify(shopData.cart));
    }
    
    function loadCart() {
        const savedCart = localStorage.getItem('batonio_cart');
        if (savedCart) {
            shopData.cart = JSON.parse(savedCart);
        }
    }
    
    function showNotification(message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #20bf6b;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(32, 191, 107, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Анимация
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        
        notification.textContent = message;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
// Отправка уведомления в Telegram
function sendToTelegram(order) {
    const botToken = '8349205890:AAFVqI8UACzi5WRI0e64_1IP_LrnN9boUio';
    const chatId = '-5121850609';
    // ... код отправки
}
});