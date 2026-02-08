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
    currentQty: 1
};

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
            
            console.log('✅ Настройки загружены');
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
    });
    
    // Находим и активируем нужную кнопку
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        if (btn.textContent === 'Все' && category === 'все') {
            btn.classList.add('active');
        } else if (btn.textContent === 'Выпечка' && category === 'выпечка') {
            btn.classList.add('active');
        } else if (btn.textContent === 'Заморозка' && category === 'заморозка') {
            btn.classList.add('active');
        }
    });
    
    // Фильтруем товары
    let filteredProducts = [];
    
    if (category === 'все') {
        filteredProducts = state.products;
    } else {
        filteredProducts = state.products.filter(product => 
            product.category && product.category.toLowerCase().includes(category)
        );
    }
    
    renderProducts(filteredProducts);
    console.log(`🎯 Показано ${filteredProducts.length} товаров в категории "${category}"`);
};

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function openProductModal(product) {
    state.currentProduct = product;
    state.currentQty = 1;
    
    document.getElementById('modalImage').src = product.image_url || 'https://placehold.co/400x400/CCCCCC/666666?text=Нет+фото';
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalWeight').textContent = product.weight || '';
    document.getElementById('modalComposition').textContent = product.composition || '';
    document.getElementById('modalPrice').textContent = `${product.price || 0} руб`;
    document.getElementById('currentQty').textContent = state.currentQty;
    
    document.getElementById('productModal').classList.add('active');
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
};

window.changeQuantity = function(change) {
    const newQty = state.currentQty + change;
    if (newQty >= 1 && newQty <= 10) {
        state.currentQty = newQty;
        document.getElementById('currentQty').textContent = state.currentQty;
    }
};

// ==================== КОРЗИНА ====================
window.addToCart = function() {
    if (!state.currentProduct) return;
    
    // Проверяем, есть ли уже такой товар в корзине
    const existingIndex = state.cart.findIndex(item => item.id === state.currentProduct.id);
    
    if (existingIndex !== -1) {
        // Увеличиваем количество
        state.cart[existingIndex].quantity += state.currentQty;
    } else {
        // Добавляем новый товар
        state.cart.push({
            ...state.currentProduct,
            quantity: state.currentQty
        });
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
    
    // Обновляем интерфейс
    updateCartUI();
    
    // Закрываем модальное окно
    closeModal('productModal');
    
    // Показываем уведомление
    alert(`✅ ${state.currentProduct.name} добавлен в корзину!`);
};

function updateCartUI() {
    // Обновляем счетчик на кнопке корзины
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
    
    // Обновляем содержимое корзины
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = '<p>Корзина пуста</p>';
        totalElement.textContent = '0';
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
    totalElement.textContent = total;
}

window.updateCartItem = function(index, change) {
    const newQty = state.cart[index].quantity + change;
    
    if (newQty > 0) {
        state.cart[index].quantity = newQty;
    } else {
        state.cart.splice(index, 1);
    }
    
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
    updateCartUI();
};

window.removeCartItem = function(index) {
    state.cart.splice(index, 1);
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
    updateCartUI();
};

window.openOrderForm = function() {
    if (state.cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    // Рассчитываем общую сумму
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('paymentAmount').textContent = total;
    
    // Загружаем сохраненные данные клиента
    const savedData = JSON.parse(localStorage.getItem('batonio_customer')) || {};
    if (savedData.name) document.getElementById('customerName').value = savedData.name;
    if (savedData.phone) document.getElementById('phone').value = savedData.phone;
    if (savedData.street) document.getElementById('street').value = savedData.street;
    if (savedData.house) document.getElementById('house').value = savedData.house;
    if (savedData.apartment) document.getElementById('apartment').value = savedData.apartment;
    if (savedData.comment) document.getElementById('comment').value = savedData.comment;
    
    closeModal('cartModal');
    document.getElementById('orderFormModal').classList.add('active');
};

// ==================== ОФОРМЛЕНИЕ ЗАКАЗА ====================
window.submitOrder = function() {
    // Проверяем обязательные поля
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const street = document.getElementById('street').value.trim();
    const house = document.getElementById('house').value.trim();
    const apartment = document.getElementById('apartment').value.trim();
    const agreement = document.getElementById('agreement').checked;
    
    if (!name || !phone || !street || !house || !apartment) {
        alert('Заполните все обязательные поля (отмечены *)');
        return;
    }
    
    if (!agreement) {
        alert('Подтвердите условия доставки');
        return;
    }
    
    // Сохраняем данные клиента, если отмечена галочка
    if (document.getElementById('rememberMe').checked) {
        const customerData = {
            name: name,
            phone: phone,
            street: street,
            house: house,
            apartment: apartment,
            comment: document.getElementById('comment').value.trim()
        };
        localStorage.setItem('batonio_customer', JSON.stringify(customerData));
    }
    
    closeModal('orderFormModal');
    document.getElementById('paymentModal').classList.add('active');
};

window.goBackToForm = function() {
    closeModal('paymentModal');
    document.getElementById('orderFormModal').classList.add('active');
};

window.processPayment = function() {
    // Имитация оплаты
    setTimeout(() => {
        closeModal('paymentModal');
        
        // Очищаем корзину
        state.cart = [];
        localStorage.removeItem('batonio_cart');
        updateCartUI();
        
        // Показываем успешное сообщение
        document.getElementById('successModal').classList.add('active');
        
        // Автоматически закрываем через 5 секунд
        setTimeout(() => {
            closeModal('successModal');
        }, 5000);
        
        console.log('✅ Заказ успешно оформлен!');
    }, 2000);
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BATONIO запускается...');
    
    // Загружаем данные
    loadSettings();
    loadProducts();
    
    // Настраиваем кнопку корзины
    document.getElementById('cartFab').onclick = function() {
        document.getElementById('cartModal').classList.add('active');
    };
    
    // Настраиваем кнопку оформления заказа в корзине
    document.getElementById('checkoutBtn').onclick = openOrderForm;
    
    console.log('✅ BATONIO готов к работе!');
});