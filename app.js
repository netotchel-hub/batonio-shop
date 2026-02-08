// ==================== КОНФИГУРАЦИЯ ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbwUCngEPHA9VXO9H8psHreI6YrFYKvqbrnoDqkSyNq1PHzCIpETeh44yOn80_mIikRK/exec';

// ==================== СОСТОЯНИЕ ====================
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('batonio_cart')) || [],
    categories: ['все', 'выпечка', 'заморозка'],
    currentCategory: 'все',
    settings: {},
    currentProduct: null,
    currentQty: 1,
    isWorkingTime: true
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    await loadSettings();
    await loadProducts();
    updateCartUI();
    await checkWorkingHours();
    restoreCustomerData();
    
    // Обработчик для кнопки корзины
    document.getElementById('cartFab').onclick = () => openModal('cartModal');
    
    // Обновляем время каждую минуту
    setInterval(() => checkWorkingHours(), 60000);
});

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadSettings() {
    try {
        const response = await fetch(API_URL + '?action=getSettings');
        const data = await response.json();
        
        if (data.settings) {
            state.settings = data.settings;
            
            // Обновляем интерфейс
            document.getElementById('shopName').textContent = data.settings.shop_name || 'BATONIO';
            
            if (data.settings.delivery_info) {
                document.getElementById('deliveryInfo').textContent = data.settings.delivery_info;
            }
            
            if (data.settings.agreement_text) {
                document.getElementById('agreementText').textContent = data.settings.agreement_text;
            }
            
            console.log('✅ Настройки загружены', data.settings);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(API_URL + '?action=getProducts');
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            state.products = data.products;
            renderProducts(state.products);
            updateCartUI();
            console.log(`✅ Загружено ${data.products.length} товаров`);
        } else {
            document.getElementById('productsContainer').innerHTML = 
                '<div class="no-products">Товары временно отсутствуют</div>';
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        document.getElementById('productsContainer').innerHTML = 
            '<div class="no-products">Ошибка загрузки товаров</div>';
    }
}

// ==================== РЕНДЕРИНГ ТОВАРОВ ====================
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductModal(product);
        
        card.innerHTML = `
            <img src="${product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото'}" 
                 alt="${product.name}" 
                 class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-weight">${product.weight || ''}</p>
                <p class="product-price">${product.price || 0} руб</p>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ==================== КАТЕГОРИИ ====================
window.filterProducts = function(category) {
    state.currentCategory = category;
    
    // Обновляем активные кнопки
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === category) {
            btn.classList.add('active');
        }
    });
    
    // Фильтруем товары
    let filteredProducts;
    if (category === 'все') {
        filteredProducts = state.products;
    } else {
        filteredProducts = state.products.filter(product => {
            const productCategory = product.category ? product.category.toString().toLowerCase().trim() : '';
            return productCategory === category;
        });
    }
    
    renderProducts(filteredProducts);
}

// ==================== КОРЗИНА ====================
function updateCartUI() {
    const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = cartCount;
    
    // Сохраняем в localStorage
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
    
    // Обновляем отображение корзины если она открыта
    if (document.getElementById('cartModal').classList.contains('active')) {
        renderCartItems();
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    
    state.cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${item.weight || ''}</p>
                <p class="item-price">${item.price} руб × ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateCartItem(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartItem(${index}, 1)">+</button>
                <button onclick="removeFromCart(${index})" style="background:#ff4757;">×</button>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
    
    document.getElementById('cartTotal').textContent = total;
}

window.updateCartItem = function(index, change) {
    const item = state.cart[index];
    item.quantity += change;
    
    if (item.quantity < 1) {
        state.cart.splice(index, 1);
    }
    
    updateCartUI();
}

window.removeFromCart = function(index) {
    state.cart.splice(index, 1);
    updateCartUI();
}

window.addToCart = function() {
    if (!state.currentProduct) return;
    
    const productId = state.currentProduct.id || state.currentProduct.name;
    const existingItem = state.cart.find(item => 
        (item.id && item.id === productId) || item.name === state.currentProduct.name
    );
    
    if (existingItem) {
        existingItem.quantity += state.currentQty;
    } else {
        state.cart.push({
            ...state.currentProduct,
            quantity: state.currentQty
        });
    }
    
    updateCartUI();
    closeModal('productModal');
    alert(`Добавлено в корзину: ${state.currentProduct.name} x${state.currentQty}`);
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
window.openModal = function(modalId) {
    // Проверяем работает ли магазин
    if (!state.isWorkingTime && modalId !== 'cartModal') {
        alert('Магазин сейчас не работает. Проверьте время работы.');
        return;
    }
    
    if (modalId === 'cartModal') {
        renderCartItems();
    } else if (modalId === 'orderFormModal') {
        // Проверяем что в корзине есть товары
        if (state.cart.length === 0) {
            alert('Добавьте товары в корзину');
            return;
        }
    } else if (modalId === 'paymentModal') {
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('paymentAmount').textContent = total;
    }
    
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
    
    if (modalId === 'productModal') {
        state.currentQty = 1;
        document.getElementById('currentQty').textContent = '1';
    }
    
    if (modalId === 'successModal') {
        // Очищаем корзину после успешного заказа
        state.cart = [];
        updateCartUI();
        resetOrderForm();
    }
}

window.openProductModal = function(product) {
    if (!state.isWorkingTime) {
        alert('Магазин сейчас не работает. Проверьте время работы.');
        return;
    }
    
    state.currentProduct = product;
    state.currentQty = 1;
    
    document.getElementById('modalImage').src = product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото';
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalWeight').textContent = product.weight || '';
    document.getElementById('modalComposition').textContent = product.composition || '';
    document.getElementById('modalPrice').textContent = product.price + ' руб';
    document.getElementById('currentQty').textContent = '1';
    
    openModal('productModal');
}

window.changeQuantity = function(change) {
    state.currentQty += change;
    if (state.currentQty < 1) state.currentQty = 1;
    if (state.currentQty > 99) state.currentQty = 99;
    document.getElementById('currentQty').textContent = state.currentQty;
}

// ==================== ФОРМА ЗАКАЗА ====================
window.openOrderForm = function() {
    if (state.cart.length === 0) {
        alert('Корзина пуста');
        return;
    }
    closeModal('cartModal');
    openModal('orderFormModal');
}

function restoreCustomerData() {
    const savedData = localStorage.getItem('batonio_customer');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('customerName').value = data.name || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('rememberMe').checked = true;
    }
}

function saveCustomerData() {
    const rememberMe = document.getElementById('rememberMe').checked;
    if (rememberMe) {
        const customerData = {
            name: document.getElementById('customerName').value,
            phone: document.getElementById('phone').value
        };
        localStorage.setItem('batonio_customer', JSON.stringify(customerData));
    }
}

function resetOrderForm() {
    document.getElementById('street').value = '';
    document.getElementById('house').value = '';
    document.getElementById('apartment').value = '';
    document.getElementById('comment').value = '';
    document.getElementById('agreement').checked = false;
    
    // Оставляем имя и телефон если "запомнить меня" активно
    if (!document.getElementById('rememberMe').checked) {
        document.getElementById('customerName').value = '';
        document.getElementById('phone').value = '';
    }
}

window.submitOrder = async function() {
    // Проверяем работает ли магазин
    if (!state.isWorkingTime) {
        alert('Магазин сейчас не работает. Проверьте время работы.');
        return;
    }
    
    // Проверяем обязательные поля
    const requiredFields = ['street', 'house', 'apartment', 'customerName', 'phone'];
    const fieldNames = {
        street: 'Улица',
        house: 'Дом',
        apartment: 'Квартира',
        customerName: 'Имя',
        phone: 'Телефон'
    };
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            alert(`Пожалуйста, заполните поле: ${fieldNames[fieldId]}`);
            field.focus();
            return;
        }
    }
    
    // Проверяем телефон
    const phone = document.getElementById('phone').value.trim();
    if (!phone.match(/^[\d\s\-\+\(\)]{10,15}$/)) {
        alert('Пожалуйста, введите корректный номер телефона');
        document.getElementById('phone').focus();
        return;
    }
    
    // Проверяем согласие
    if (!document.getElementById('agreement').checked) {
        alert('Пожалуйста, подтвердите условия доставки');
        return;
    }
    
    // Формируем данные заказа
    const orderData = {
        action: 'createOrder',
        order: {
            customer: {
                name: document.getElementById('customerName').value.trim(),
                phone: phone
            },
            delivery: {
                city: document.getElementById('city').value,
                street: document.getElementById('street').value.trim(),
                house: document.getElementById('house').value.trim(),
                apartment: document.getElementById('apartment').value.trim()
            },
            items: state.cart.map(item => ({
                id: item.id || item.name,
                name: item.name,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity)
            })),
            total: state.cart.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0),
            comment: document.getElementById('comment').value.trim()
        }
    };
    
    // Сохраняем данные клиента если нужно
    saveCustomerData();
    
    try {
        // Показываем загрузку
        const submitBtn = document.querySelector('.submit-order-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
        
        // Отправляем заказ
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Заказ успешно создан:', result.orderId);
            closeModal('orderFormModal');
            openModal('paymentModal');
        } else {
            throw new Error(result.error || 'Неизвестная ошибка');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при оформлении заказа:', error);
        alert('Ошибка при оформлении заказа: ' + error.message);
        
        // Восстанавливаем кнопку
        const submitBtn = document.querySelector('.submit-order-btn');
        submitBtn.textContent = 'Перейти к оплате';
        submitBtn.disabled = false;
    }
}

// ==================== ОПЛАТА ====================
window.processPayment = function() {
    // Симуляция оплаты
    const payBtn = document.querySelector('.pay-btn');
    payBtn.textContent = 'Обработка...';
    payBtn.disabled = true;
    
    setTimeout(() => {
        closeModal('paymentModal');
        openModal('successModal');
        
        // Очищаем корзину
        state.cart = [];
        updateCartUI();
        
        // Сбрасываем кнопку оплаты
        payBtn.textContent = 'Оплатить';
        payBtn.disabled = false;
    }, 1500);
}

window.goBackToForm = function() {
    closeModal('paymentModal');
    openModal('orderFormModal');
}

// ==================== НЕРАБОЧЕЕ ВРЕМЯ (ЧТЕНИЕ ИЗ ТАБЛИЦЫ) ====================
async function checkWorkingHours() {
    try {
        // Проверяем, загружены ли настройки
        if (Object.keys(state.settings).length === 0) {
            await loadSettings();
        }
        
        // Получаем настройки времени из state.settings
        const workingHoursEnabled = state.settings.working_hours_enabled === 'true' || 
                                   state.settings.working_hours_enabled === true;
        const startTimeStr = state.settings.working_time_start || '00:30';
        const endTimeStr = state.settings.working_time_end || '04:30';
        
        console.log('Настройки времени работы:', {
            enabled: workingHoursEnabled,
            start: startTimeStr,
            end: endTimeStr
        });
        
        // Если проверка времени отключена - магазин всегда открыт
        if (!workingHoursEnabled) {
            console.log('Проверка времени работы отключена');
            state.isWorkingTime = true;
            hideNonWorkingOverlay();
            return;
        }
        
        // Преобразуем время из строки в минуты
        const startMinutes = timeStringToMinutes(startTimeStr);
        const endMinutes = timeStringToMinutes(endTimeStr);
        
        // Текущее время
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        let isWorkingTime = false;
        
        // Проверяем, находится ли текущее время в рабочем диапазоне
        if (startMinutes <= endMinutes) {
            // Обычный интервал (например, 12:00-18:00)
            isWorkingTime = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
            // Ночной интервал (например, 22:00-06:00)
            isWorkingTime = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }
        
        // Сохраняем состояние
        state.isWorkingTime = isWorkingTime;
        
        console.log(`Текущее время: ${formatTime(currentMinutes)}, Рабочее время: ${startTimeStr}-${endTimeStr}, Магазин ${isWorkingTime ? 'открыт' : 'закрыт'}`);
        
        // Обновляем сообщение в overlay
        updateNonWorkingMessage(startTimeStr, endTimeStr);
        
        if (!isWorkingTime) {
            // Магазин закрыт - показываем сообщение
            showNonWorkingOverlay();
        } else {
            // Магазин открыт - скрываем сообщение
            hideNonWorkingOverlay();
        }
        
    } catch (error) {
        console.error('Ошибка проверки времени работы:', error);
        // В случае ошибки показываем магазин открытым
        state.isWorkingTime = true;
        hideNonWorkingOverlay();
    }
}

function timeStringToMinutes(timeStr) {
    // Преобразует "12:30" в 12*60 + 30 = 750
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function updateNonWorkingMessage(startTime, endTime) {
    const messageElement = document.querySelector('.non-working-message');
    if (messageElement) {
        messageElement.innerHTML = `
            <h3>⏰ Магазин не работает</h3>
            <p>Прием заказов с ${startTime} до ${endTime}</p>
            <p>Возвращайтесь после ${endTime}</p>
        `;
    }
}

function showNonWorkingOverlay() {
    const overlay = document.getElementById('nonWorkingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        
        // Блокируем все интерактивные элементы
        document.querySelectorAll('.product-card, .cart-fab, .category-btn').forEach(el => {
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.5';
        });
    }
}

function hideNonWorkingOverlay() {
    const overlay = document.getElementById('nonWorkingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        
        // Разблокируем все интерактивные элементы
        document.querySelectorAll('.product-card, .cart-fab, .category-btn').forEach(el => {
            el.style.pointerEvents = 'auto';
            el.style.opacity = '1';
        });
    }
}

// ==================== УТИЛИТЫ ====================
window.forceOpenShop = function() {
    // Функция для принудительного открытия магазина (для тестирования)
    state.isWorkingTime = true;
    hideNonWorkingOverlay();
    alert('Магазин принудительно открыт для тестирования');
}

window.forceCloseShop = function() {
    // Функция для принудительного закрытия магазина (для тестирования)
    state.isWorkingTime = false;
    showNonWorkingOverlay();
    alert('Магазин принудительно закрыт для тестирования');
}