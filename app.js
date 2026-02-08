// ==================== КОНФИГУРАЦИЯ ====================
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

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function normalizeCategories(products) {
    if (!products || !Array.isArray(products)) {
        return [];
    }
    
    const categories = products
        .map(p => p ? p.category : null)
        .filter(category => category && typeof category === 'string' && category.trim() !== '')
        .map(category => category.trim());
    
    return [...new Set(categories)];
}

function showError(message) {
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = `<div class="error-message" style="padding: 20px; text-align: center; color: #ff4757;">${message}</div>`;
    }
    console.error('Ошибка:', message);
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadSettings() {
    try {
        console.log('🔄 Загружаю настройки...');
        const response = await fetch(`${API_URL}?action=getSettings`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Настройки:', data);
        
        if (data.settings) {
            state.settings = data.settings;
            
            // Обновляем интерфейс
            const agreementText = document.getElementById('agreementText');
            if (agreementText && data.settings.agreement_text) {
                agreementText.textContent = data.settings.agreement_text;
            }
            
            const deliveryInfo = document.getElementById('deliveryInfo');
            if (deliveryInfo && data.settings.delivery_info) {
                deliveryInfo.textContent = data.settings.delivery_info;
            }
            
            const shopName = document.getElementById('shopName');
            if (shopName && data.settings.shop_name) {
                shopName.textContent = data.settings.shop_name;
            }
            
            // Применяем стили
            applyCustomStyles(data.settings);
        }
    } catch (error) {
        console.error('❌ Ошибка настроек:', error);
    }
}

async function loadProducts() {
    try {
        console.log('🔄 Загружаю товары...');
        const response = await fetch(`${API_URL}?action=getProducts`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Товары загружены:', data);
        
        if (data.products && Array.isArray(data.products)) {
            state.products = data.products;
            state.categories = normalizeCategories(data.products);
            console.log('📊 Категории:', state.categories);
            
            renderCategories();
            renderProducts(state.products);
        } else {
            showError('Товары временно недоступны');
        }
    } catch (error) {
        console.error('❌ Ошибка товаров:', error);
        showError('Ошибка загрузки: ' + error.message);
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
    if (state.categories && state.categories.length > 0) {
        state.categories.forEach(category => {
            if (category && typeof category === 'string' && category.trim() !== '') {
                const btn = document.createElement('button');
                btn.className = `category-btn`;
                
                const displayName = category.trim();
                btn.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                
                btn.onclick = () => {
                    state.currentCategory = category;
                    const filtered = state.products.filter(p => p.category === category);
                    renderProducts(filtered);
                    updateCategoryButtons();
                };
                container.appendChild(btn);
            }
        });
        
        // Активируем кнопки
        updateCategoryButtons();
    }
}

function updateCategoryButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        
        if (state.currentCategory === 'все' && btn.textContent === 'Все') {
            btn.classList.add('active');
        } else if (btn.textContent.toLowerCase() === state.currentCategory) {
            btn.classList.add('active');
        }
    });
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
        if (!product || !product.name) return;
        
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
    if (!settings) return;
    
    if (settings.logo_url && settings.logo_url.includes('http')) {
        const shopName = document.getElementById('shopName');
        if (shopName) {
            shopName.innerHTML = `<img src="${settings.logo_url}" alt="${settings.shop_name || 'BATONIO'}" style="max-height: 40px;">`;
        }
    }
    
    if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    }
    
    if (settings.header_background) {
        const header = document.querySelector('.header');
        if (header) header.style.background = settings.header_background;
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
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

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = totalItems;
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 BATONIO запускается...');
    console.log('API:', API_URL);
    
    try {
        // Инициализация кнопок
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
        
        // Загрузка данных
        await loadSettings();
        await loadProducts();
        updateCartUI();
        
        console.log('✅ BATONIO загружен!');
        
    } catch (error) {
        console.error('❌ Ошибка запуска:', error);
        showError('Ошибка загрузки приложения');
    }
});

// ==================== КОРЗИНА ====================
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
};

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

window.checkout = function() {
    if (state.cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('orderFormModal').classList.add('active');
};

// Инициализация кнопки оформления
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.onclick = window.checkout;
});

// Функция добавления в корзину
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
    document.getElementById('productModal').classList.remove('active');
    alert(`✅ ${state.currentProduct.name} добавлен в корзину!`);
};