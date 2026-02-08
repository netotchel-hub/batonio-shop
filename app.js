// ==================== КОНФИГУРАЦИЯ ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbwB5x3RVM_qjR1Re4KNbRkuSZGLxGjnefL7plvmmp6H4ijqBcyuCE8TyDTanEXKaonHFw/exec';
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
        const response = await fetch(`${API_URL}?action=getSettings`);
        const data = await response.json();
        console.log('Настройки:', data);
        
        if (data.settings) {
            state.settings = data.settings;
            applyCustomStyles(data.settings);
            
            const agreementText = document.getElementById('agreementText');
            if (agreementText && data.settings.agreement_text) {
                agreementText.textContent = data.settings.agreement_text;
            }
            
            if (document.getElementById('deliveryInfo') && data.settings.delivery_info) {
                document.getElementById('deliveryInfo').textContent = data.settings.delivery_info;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}

async function loadProducts() {
    try {
        console.log('Загружаю товары...');
        const response = await fetch(`${API_URL}?action=getProducts`);
        const data = await response.json();
        console.log('Товары:', data);
        
        if (data.products) {
            state.products = data.products;
            const categories = [...new Set(data.products.map(p => p.category))];
            state.categories = categories;
            
            renderCategories();
            renderProducts(state.products);
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showError('Ошибка загрузки товаров');
    }
}

// ==================== РЕНДЕРИНГ ====================
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    container.innerHTML = '<button class="category-btn active" onclick="filterProducts(\'все\')">Все</button>';
    
    state.categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        btn.onclick = () => filterProducts(category);
        container.appendChild(btn);
    });
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

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
window.filterProducts = function(category) {
    state.currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const filtered = category === 'все' ? state.products : state.products.filter(p => p.category === category);
    renderProducts(filtered);
};

window.openProductModal = function(product) {
    state.currentProduct = product;
    state.currentQty = 1;
    
    document.getElementById('modalImage').src = product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото';
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalWeight').textContent = product.weight || '';
    document.getElementById('modalComposition').textContent = product.composition || '';
    document.getElementById('modalPrice').textContent = `${product.price || 0} руб`;
    document.getElementById('currentQty').textContent = state.currentQty;
    
    document.getElementById('productModal').classList.add('active');
};

// ==================== СТИЛИ ====================
function applyCustomStyles(settings) {
    if (settings.logo_url) {
        const shopName = document.getElementById('shopName');
        if (shopName) {
            shopName.innerHTML = `<img src="${settings.logo_url}" alt="BATONIO" style="max-height: 40px;">`;
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

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Приложение BATONIO запускается...');
    
    // Инициализируем кнопку корзины
    const cartFab = document.getElementById('cartFab');
    if (cartFab) {
        cartFab.onclick = () => {
            document.getElementById('cartModal').classList.add('active');
            updateCartUI();
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
    
    // Загружаем данные
    try {
        await loadSettings();
        await loadProducts();
        console.log('Приложение успешно загружено!');
    } catch (error) {
        console.error('Ошибка запуска:', error);
    }
});

function showError(message) {
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem('batonio_cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    document.getElementById('cartCount').textContent = totalItems;
}
