// ==================== КОНФИГУРАЦИЯ ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbwUCngEPHA9VXO9H8psHreI6YrFYKvqbrnoDqkSyNq1PHzCIpETeh44yOn80_mIikRK/exec';

// ==================== СОСТОЯНИЕ ====================
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('batonio_cart')) || [],
    categories: [],
    currentCategory: 'все',
    settings: {},
    customerData: JSON.parse(localStorage.getItem('batonio_customer')) || {},
    currentProduct: null,
    currentQty: 1
};

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadSettings() {
    try {
        console.log('🔄 Загружаю настройки...');
        const response = await fetch(`${API_URL}?action=getSettings`);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Настройки:', data);
        
        if (data.settings) {
            state.settings = data.settings;
            
            // Обновляем интерфейс
            updateUIFromSettings(data.settings);
            
            // Загружаем данные клиента
            loadCustomerData();
        }
    } catch (error) {
        console.error('❌ Ошибка настроек:', error);
    }
}

async function loadProducts() {
    try {
        console.log('🔄 Загружаю товары...');
        const response = await fetch(`${API_URL}?action=getProducts`);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Товары:', data);
        
        if (data.products && Array.isArray(data.products)) {
            state.products = data.products;
            
            // Собираем категории (безопасно)
            state.categories = getSafeCategories(data.products);
            console.log('📊 Категории:', state.categories);
            
            // Рендерим
            renderCategories();
            renderProducts(state.products);
        } else {
            showMessage('products', 'Товары временно недоступны');
        }
    } catch (error) {
        console.error('❌ Ошибка товаров:', error);
        showMessage('products', 'Ошибка загрузки товаров');
    }
}

function getSafeCategories(products) {
    if (!products || !Array.isArray(products)) return [];
    
    return [...new Set(
        products
            .map(p => p ? (p.category || '').trim() : '')
            .filter(cat => cat !== '')
    )];
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUIFromSettings(settings) {
    // Название магазина
    const shopName = document.getElementById('shopName');
    if (shopName) {
        if (settings.logo_url && settings.logo_url.includes('http')) {
            shopName.innerHTML = `<img src="${settings.logo_url}" alt="${settings.shop_name || 'BATONIO'}" style="max-height: 40px;">`;
        } else {
            shopName.textContent = settings.shop_name || 'BATONIO';
        }
    }
    
    // Информация о доставке
    const deliveryInfo = document.getElementById('deliveryInfo');
    if (deliveryInfo && settings.delivery_info) {
        deliveryInfo.textContent = settings.delivery_info;
    }
    
    // Текст соглашения
    const agreementText = document.getElementById('agreementText');
    if (agreementText && settings.agreement_text) {
        agreementText.textContent = settings.agreement_text;
    }
    
    // Город доставки
    const cityInput = document.getElementById('city');
    if (cityInput && settings.available_cities) {
        cityInput.value = settings.available_cities.split(',')[0] || 'Медвежьегорск';
    }
    
    // Применяем стили
    applyCustomStyles(settings);
}

function loadCustomerData() {
    const customer = JSON.parse(localStorage.getItem('batonio_customer'));
    if (customer) {
        document.getElementById('customerName').value = customer.name || '';
        document.getElementById('phone').value = customer.phone || '';
        document.getElementById('street').value = customer.street || '';
        document.getElementById('house').value = customer.house || '';
        document.getElementById('apartment').value = customer.apartment || '';
        document.getElementById('comment').value = customer.comment || '';
    }
}

// ==================== РЕНДЕРИНГ ====================
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Кнопка "Все"
    const allBtn = document.createElement('button');
    allBtn.className = `category-btn ${state.currentCategory === 'все' ? 'active' : ''}`;
    allBtn.textContent = 'Все';
    allBtn.onclick = () => filterProducts('все');
    container.appendChild(allBtn);
    
    // Кнопки категорий
    state.categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${state.currentCategory === category ? 'active' : ''}`;
        btn.textContent = formatCategoryName(category);
        btn.onclick = () => filterProducts(category);
        container.appendChild(btn);
    });
}

function formatCategoryName(category) {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function filterProducts(category) {
    state.currentCategory = category;
    
    // Обновляем активные кнопки
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === 'Все' && category === 'все') {
            btn.classList.add('active');
        } else if (btn.textContent.toLowerCase() === category.toLowerCase()) {
            btn.classList.add('active');
        }
    });
    
    // Фильтруем товары
    const filtered = category === 'все' 
        ? state.products 
        : state.products.filter(p => p.category === category);
    
    renderProducts(filtered);
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-products">Товары отсутствуют</div>';
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach(product => {
        if (!product) return;
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductModal(product);
        
        card.innerHTML = `
            <img src="${product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото'}" 
                 alt="${product.name || 'Товар'}" 
                 class="product-image"
                 onerror="this.src='https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото'">
            <div class="product-info">
                <h3 class="product-name">${product.name || 'Товар'}</h3>
                ${product.weight ? `<p class="product-weight">${product.weight}</p>` : ''}
                <p class="product-price">${product.price || 0} руб</p>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function openProductModal(product) {
    if (!product) return;
    
    state.currentProduct = product;
    state.currentQty = 1;
    
    const modal = document.getElementById('productModal');
    if (modal) {
        document.getElementById('modalImage').src = product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото';
        document.getElementById('modalName').textContent = product.name || '';
        document.getElementById('modalWeight').textContent = product.weight || '';
        document.getElementById('modalComposition').textContent = product.composition || '';
        document.getElementById('modalPrice').textContent = `${product.price || 0} руб`;
        document.getElementById('currentQty').textContent = state.currentQty;
        
        modal.classList.add('active');
    }
}

function openCartModal() {
    renderCart();
    document.getElementById('cartModal').classList.add('active');
}

function openOrderForm() {
    const cart = state.cart;
    
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    // Рассчитываем сумму
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('orderTotal').textContent = total;
    document.getElementById('paymentAmount').textContent = total;
    
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('orderFormModal').classList.add('active');
}

// ==================== КОРЗИНА ====================
function renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = '<p>Корзина пуста</p>';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }
    
    let html = '';
    let total = 0;
    
    state.cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name || 'Товар'}</h4>
                    <p>${item.price || 0} руб × ${item.quantity || 0}</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="updateCartItem(${index}, -1)">-</button>
                    <span>${item.quantity || 0}</span>
                    <button onclick="updateCartItem(${index}, 1)">+</button>
                    <button onclick="removeCartItem(${index})">×</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('cartTotal').textContent = total;
}

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.updateCartItem = function(index, change) {
    if (state.cart[index]) {
        const newQty = (state.cart[index].quantity || 0) + change;
        if (newQty > 0) {
            state.cart[index].quantity = newQty;
        } else {
            state.cart.splice(index, 1);
        }
        
        localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
        updateCartUI();
        renderCart();
    }
};

window.removeCartItem = function(index) {
    state.cart.splice(index, 1);
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
    updateCartUI();
    renderCart();
};

window.addToCart = function() {
    if (!state.currentProduct) return;
    
    const existingItem = state.cart.find(item => item.id === state.currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 0) + state.currentQty;
    } else {
        state.cart.push({
            ...state.currentProduct,
            quantity: state.currentQty
        });
    }
    
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
    updateCartUI();
    
    // Закрываем модальное окно
    document.getElementById('productModal').classList.remove('active');
    
    // Показываем уведомление
    showNotification(`${state.currentProduct.name} добавлен в корзину!`);
};

window.submitOrder = async function() {
    // Собираем данные формы
    const orderData = {
        customer: {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('phone').value.trim()
        },
        delivery: {
            city: document.getElementById('city').value.trim(),
            street: document.getElementById('street').value.trim(),
            house: document.getElementById('house').value.trim(),
            apartment: document.getElementById('apartment').value.trim()
        },
        comment: document.getElementById('comment').value.trim(),
        items: state.cart,
        total: document.getElementById('orderTotal').textContent
    };
    
    // Валидация
    if (!orderData.customer.name || !orderData.customer.phone) {
        showNotification('Заполните имя и телефон', 'error');
        return;
    }
    
    if (!orderData.delivery.street || !orderData.delivery.house) {
        showNotification('Заполните адрес доставки', 'error');
        return;
    }
    
    // Проверяем согласие
    const agreement = document.getElementById('agreement');
    if (!agreement || !agreement.checked) {
        showNotification('Подтвердите условия доставки', 'error');
        return;
    }
    
    // Сохраняем данные клиента
    if (document.getElementById('rememberMe').checked) {
        localStorage.setItem('batonio_customer', JSON.stringify({
            name: orderData.customer.name,
            phone: orderData.customer.phone,
            street: orderData.delivery.street,
            house: orderData.delivery.house,
            apartment: orderData.delivery.apartment,
            comment: orderData.comment
        }));
    }
    
    // Переходим к оплате
    document.getElementById('orderFormModal').classList.remove('active');
    document.getElementById('paymentModal').classList.add('active');
};

window.processPayment = async function() {
    // Собираем данные заказа
    const orderData = {
        customer: {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('phone').value.trim()
        },
        delivery: {
            city: document.getElementById('city').value.trim(),
            street: document.getElementById('street').value.trim(),
            house: document.getElementById('house').value.trim(),
            apartment: document.getElementById('apartment').value.trim()
        },
        comment: document.getElementById('comment').value.trim(),
        items: state.cart,
        total: document.getElementById('orderTotal').textContent
    };
    
    try {
        // Имитация оплаты
        showNotification('Обрабатываем оплату...', 'info');
        
        setTimeout(async () => {
            try {
                // Отправляем заказ на сервер
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'createOrder',
                        order: orderData
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Очищаем корзину
                    state.cart = [];
                    localStorage.removeItem('batonio_cart');
                    updateCartUI();
                    
                    // Показываем успех
                    document.getElementById('paymentModal').classList.remove('active');
                    document.getElementById('successModal').classList.add('active');
                    
                    // Закрываем через 5 секунд
                    setTimeout(() => {
                        document.getElementById('successModal').classList.remove('active');
                    }, 5000);
                } else {
                    showNotification('Ошибка при оформлении заказа', 'error');
                    document.getElementById('paymentModal').classList.remove('active');
                    document.getElementById('orderFormModal').classList.add('active');
                }
            } catch (error) {
                showNotification('Ошибка сети', 'error');
                console.error('Ошибка отправки заказа:', error);
            }
        }, 2000);
        
    } catch (error) {
        showNotification('Ошибка при обработке платежа', 'error');
        console.error('Ошибка платежа:', error);
    }
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div style="padding: 20px; text-align: center;">${message}</div>`;
    }
}

function showNotification(message, type = 'success') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'info' ? '#2ed573' : '#1e90ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function applyCustomStyles(settings) {
    if (!settings) return;
    
    // Применяем цвета
    if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    }
    
    if (settings.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
    }
    
    if (settings.background_color) {
        document.body.style.backgroundColor = settings.background_color;
    }
    
    // Применяем фон шапки
    if (settings.header_background) {
        const header = document.querySelector('.header');
        if (header) {
            header.style.background = settings.header_background;
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 BATONIO запускается...');
    
    // Инициализация событий
    initEventListeners();
    
    // Загрузка данных
    try {
        await loadSettings();
        await loadProducts();
        updateCartUI();
        
        console.log('✅ BATONIO успешно загружен!');
    } catch (error) {
        console.error('❌ Ошибка запуска:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
});

function initEventListeners() {
    // Кнопка корзины
    const cartFab = document.getElementById('cartFab');
    if (cartFab) {
        cartFab.onclick = openCartModal;
    }
    
    // Кнопка оформления заказа в корзине
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = openOrderForm;
    }
    
    // Кнопка "Оплатить"
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.onclick = window.processPayment;
    }
    
    // Кнопка "Назад" в форме оплаты
    const backBtn = document.getElementById('backToForm');
    if (backBtn) {
        backBtn.onclick = () => {
            document.getElementById('paymentModal').classList.remove('active');
            document.getElementById('orderFormModal').classList.add('active');
        };
    }
    
    // Кнопка закрытия успеха
    const closeSuccess = document.getElementById('closeSuccess');
    if (closeSuccess) {
        closeSuccess.onclick = () => {
            document.getElementById('successModal').classList.remove('active');
        };
    }
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        };
    });
    
    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    });
    
    // Изменение количества в модальном окне товара
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const addToCartBtn = document.getElementById('addToCart');
    
    if (decreaseBtn) {
        decreaseBtn.onclick = () => {
            if (state.currentQty > 1) {
                state.currentQty--;
                document.getElementById('currentQty').textContent = state.currentQty;
            }
        };
    }
    
    if (increaseBtn) {
        increaseBtn.onclick = () => {
            if (state.currentQty < 10) {
                state.currentQty++;
                document.getElementById('currentQty').textContent = state.currentQty;
            }
        };
    }
    
    if (addToCartBtn) {
        addToCartBtn.onclick = window.addToCart;
    }
}