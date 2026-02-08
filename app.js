// ==================== КОНФИГУРАЦИЯ ====================
// ВАШ РАБОЧИЙ API URL
const API_URL = 'https://script.google.com/macros/s/AKfycbwUCngEPHA9VXO9H8psHreI6YrFYKvqbrnoDqkSyNq1PHzCIpETeh44yOn80_mIikRK/exec';

// ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================
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
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Настройки загружены:', data);
        
        if (data.settings) {
            state.settings = data.settings;
            
            // Применяем настройки
            applyCustomStyles(data.settings);
            
            // Обновляем текст соглашения
            const agreementText = document.getElementById('agreementText');
            if (agreementText && data.settings.agreement_text) {
                agreementText.textContent = data.settings.agreement_text;
            }
            
            // Обновляем инфо о доставке
            const deliveryInfo = document.getElementById('deliveryInfo');
            if (deliveryInfo && data.settings.delivery_info) {
                deliveryInfo.textContent = data.settings.delivery_info;
            }
            
            // Обновляем название магазина
            const shopName = document.getElementById('shopName');
            if (shopName && data.settings.shop_name) {
                shopName.textContent = data.settings.shop_name;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
    }
}

async function loadProducts() {
    try {
        console.log('🔄 Загружаю товары...');
        const response = await fetch(`${API_URL}?action=getProducts`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Товары загружены:', data);
        
        if (data.products && Array.isArray(data.products)) {
            state.products = data.products;
            
            // Получаем уникальные категории
            const categories = [...new Set(data.products.map(p => p.category))];
            state.categories = categories;
            
            // Рендерим категории
            renderCategories();
            
            // Рендерим все товары
            renderProducts(state.products);
        } else {
            console.warn('⚠️ Нет товаров или неверный формат:', data);
            showError('Товары временно недоступны');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        showError('Ошибка загрузки товаров: ' + error.message);
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
    allBtn.onclick = () => {
        state.currentCategory = 'все';
        renderProducts(state.products);
        updateCategoryButtons();
    };
    container.appendChild(allBtn);
    
    // Кнопки категорий
    state.categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${state.currentCategory === category ? 'active' : ''}`;
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        btn.onclick = () => {
            state.currentCategory = category;
            const filtered = state.products.filter(p => p.category === category);
            renderProducts(filtered);
            updateCategoryButtons();
        };
        container.appendChild(btn);
    });
}

function updateCategoryButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.category-btn')).find(btn => {
        if (state.currentCategory === 'все') return btn.textContent === 'Все';
        return btn.textContent.toLowerCase() === state.currentCategory;
    });
    
    if (activeBtn) activeBtn.classList.add('active');
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-products">Товары временно отсутствуют</div>';
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductModal(product);
        
        card.innerHTML = `
            <img src="${product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-weight">${product.weight || ''}</p>
                <p class="product-price">${product.price || 0} руб</p>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ==================== СТИЛИ ====================
function applyCustomStyles(settings) {
    console.log('🎨 Применяю стили:', settings);
    
    // Применяем логотип
    if (settings.logo_url && settings.logo_url.includes('http')) {
        const shopName = document.getElementById('shopName');
        if (shopName) {
            shopName.innerHTML = `<img src="${settings.logo_url}" alt="${settings.shop_name || 'BATONIO'}" style="max-height: 40px; max-width: 200px;">`;
        }
    }
    
    // Применяем цвета через CSS переменные
    if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
        console.log('Установлен primary_color:', settings.primary_color);
    }
    
    if (settings.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
    }
    
    // Применяем фон шапки
    if (settings.header_background) {
        const header = document.querySelector('.header');
        if (header) {
            header.style.background = settings.header_background;
        }
    }
    
    // Применяем цвет фона
    if (settings.background_color) {
        document.body.style.backgroundColor = settings.background_color;
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function openProductModal(product) {
    state.currentProduct = product;
    state.currentQty = 1;
    
    const modal = document.getElementById('productModal');
    if (modal) {
        document.getElementById('modalImage').src = product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото';
        document.getElementById('modalName').textContent = product.name;
        document.getElementById('modalWeight').textContent = product.weight || '';
        document.getElementById('modalComposition').textContent = product.composition || '';
        document.getElementById('modalPrice').textContent = `${product.price || 0} руб`;
        document.getElementById('currentQty').textContent = state.currentQty;
        
        modal.classList.add('active');
    }
}

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение BATONIO запускается...');
    console.log('API URL:', API_URL);
    
    try {
        // Инициализируем кнопку корзины
        const cartFab = document.getElementById('cartFab');
        if (cartFab) {
            cartFab.onclick = () => {
                document.getElementById('cartModal').classList.add('active');
                renderCart();
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
        
        // Загружаем данные
        await loadSettings();
        await loadProducts();
        updateCartUI();
        
        console.log('✅ Приложение BATONIO успешно загружено!');
        console.log('Товаров:', state.products.length);
        console.log('Настроек:', Object.keys(state.settings).length);
        
    } catch (error) {
        console.error('❌ Ошибка запуска приложения:', error);
        showError('Не удалось загрузить приложение. Попробуйте позже.');
    }
});

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function showError(message) {
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = `<div class="error-message" style="padding: 20px; text-align: center; color: #ff4757;">${message}</div>`;
    }
    console.error('Ошибка приложения:', message);
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.filterProducts = function(category) {
    state.currentCategory = category;
    
    // Обновляем активные кнопки
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === 'Все' && category === 'все') {
            btn.classList.add('active');
        } else if (btn.textContent.toLowerCase() === category) {
            btn.classList.add('active');
        }
    });
    
    // Фильтруем товары
    const filtered = category === 'все' 
        ? state.products 
        : state.products.filter(p => p.category === category);
    
    renderProducts(filtered);
};

window.addToCart = function() {
    if (!state.currentProduct) return;
    
    const existingItem = state.cart.find(item => item.id === state.currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += state.currentQty;
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
    
    alert(`✅ ${state.currentProduct.name} добавлен в корзину!`);
};

window.renderCart = function() {
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
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} руб × ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="updateCartItem(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem(${index}, 1)">+</button>
                    <button onclick="removeCartItem(${index})">×</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('cartTotal').textContent = total;
};

window.updateCartItem = function(index, change) {
    if (state.cart[index]) {
        const newQty = state.cart[index].quantity + change;
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

window.checkout = function() {
    if (state.cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('orderFormModal').classList.add('active');
};

// Инициализируем кнопку оформления заказа
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = window.checkout;
    }
});