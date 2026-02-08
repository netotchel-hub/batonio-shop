// ==================== КОНФИГУРАЦИЯ ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbwUCngEPHA9VXO9H8psHreI6YrFYKvqbrnoDqkSyNq1PHzCIpETeh44yOn80_mIikRK/exec';

// ==================== СОСТОЯНИЕ ====================
let state = {
    products: [],
    cart: []
};

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadData() {
    console.log('🚀 BATONIO загружается...');
    
    try {
        // 1. Загружаем настройки
        console.log('🔄 Загружаю настройки...');
        const settingsRes = await fetch(API_URL + '?action=getSettings');
        const settingsData = await settingsRes.json();
        
        if (settingsData.settings) {
            // Обновляем текст
            const agreement = document.getElementById('agreementText');
            if (agreement && settingsData.settings.agreement_text) {
                agreement.textContent = settingsData.settings.agreement_text;
            }
            console.log('✅ Настройки загружены');
        }
        
        // 2. Загружаем товары
        console.log('🔄 Загружаю товары...');
        const productsRes = await fetch(API_URL + '?action=getProducts');
        const productsData = await productsRes.json();
        
        if (productsData.products && productsData.products.length > 0) {
            state.products = productsData.products;
            renderProductsSimple(state.products);
            console.log(`✅ Загружено ${productsData.products.length} товаров`);
        } else {
            showMessage('Товары временно отсутствуют');
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showMessage('Ошибка загрузки данных');
    }
}

// ==================== ПРОСТОЙ РЕНДЕРИНГ ТОВАРОВ ====================
function renderProductsSimple(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем HTML для каждого товара
    products.forEach(product => {
        // Безопасно получаем данные товара
        const name = product.name || 'Товар';
        const price = product.price || 0;
        const weight = product.weight || '';
        const imageUrl = product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото';
        
        const productHTML = `
            <div class="product-card" onclick="showProductDetail(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                <img src="${imageUrl}" 
                     alt="${name}" 
                     class="product-image"
                     onerror="this.src='https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото'">
                <div class="product-info">
                    <h3 class="product-name">${name}</h3>
                    ${weight ? `<p class="product-weight">${weight}</p>` : ''}
                    <p class="product-price">${price} руб</p>
                </div>
            </div>
        `;
        
        container.innerHTML += productHTML;
    });
    
    // Обновляем кнопку корзины
    updateCartButton();
}

// ==================== ПРОСТЫЕ ФУНКЦИИ ====================
function showMessage(text) {
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = `<div style="padding: 40px; text-align: center;">${text}</div>`;
    }
}

function updateCartButton() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('batonio_cart')) || [];
        const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        cartCount.textContent = total;
    }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.showProductDetail = function(product) {
    // Простое модальное окно
    alert(`${product.name}\nЦена: ${product.price} руб\nВес: ${product.weight || 'нет'}\nСостав: ${product.composition || 'нет'}`);
    
    // Можно добавить в корзину
    if (confirm('Добавить в корзину?')) {
        addToCartSimple(product);
    }
};

window.addToCartSimple = function(product) {
    let cart = JSON.parse(localStorage.getItem('batonio_cart')) || [];
    
    // Ищем товар в корзине
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    localStorage.setItem('batonio_cart', JSON.stringify(cart));
    updateCartButton();
    alert(`✅ ${product.name} добавлен в корзину!`);
};

window.openCart = function() {
    const cart = JSON.parse(localStorage.getItem('batonio_cart')) || [];
    
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }
    
    let message = 'Ваша корзина:\n\n';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `${item.name} x${item.quantity} = ${itemTotal} руб\n`;
    });
    
    message += `\nИтого: ${total} руб`;
    
    if (confirm(message + '\n\nОформить заказ?')) {
        // Простая форма заказа
        const name = prompt('Ваше имя:');
        const phone = prompt('Ваш телефон:');
        
        if (name && phone) {
            alert(`✅ Заказ оформлен!\nИмя: ${name}\nТелефон: ${phone}\nСумма: ${total} руб\n\nЗаказ будет доставлен завтра с 17:00`);
            localStorage.removeItem('batonio_cart');
            updateCartButton();
        }
    }
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 BATONIO Mini App запущен');
    
    // Загружаем данные
    loadData();
    
    // Настраиваем кнопку корзины
    const cartBtn = document.getElementById('cartFab');
    if (cartBtn) {
        cartBtn.onclick = window.openCart;
    }
    
    // Обновляем счетчик корзины
    updateCartButton();
    
    // Простая инициализация кнопок закрытия
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        };
    });
});
