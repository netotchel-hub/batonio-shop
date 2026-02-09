// =================== КОНФИГУРАЦИЯ ===================
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzzTpQJ5yLz0lgRv2LxLMFKLUQu_NBpF_CpNnTaYUQf6ZMF-8-cjkNJtOSTr5xe2-m5/exec'
};

// =================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===================
let tg = null;
let shopData = null;
let products = [];
let cart = [];
let currentCategory = 'all';
let currentProduct = null;
let currentQuantity = 1;
let userData = {
    name: '',
    phone: '',
    city: 'Медвежьегорск',
    street: '',
    house: '',
    apartment: '',
    comment: ''
};

// =================== ИНИЦИАЛИЗАЦИЯ ===================
async function initApp() {
    // Инициализация Telegram Web App
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.MainButton.hide();
    tg.BackButton.hide();
    
    // Загружаем данные магазина
    await loadShopData();
    
    // Загружаем товары
    await loadProducts();
    
    // Восстанавливаем корзину и данные пользователя из localStorage
    loadCartFromStorage();
    loadUserDataFromStorage();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Обновляем интерфейс
    updateCartUI();
    updateCheckoutButton();
}

// =================== ЗАГРУЗКА ДАННЫХ ===================
async function loadShopData() {
    try {
        showLoading(true);
        const response = await fetch(`${CONFIG.API_URL}?action=getShopData`);
        const data = await response.json();
        
        if (data.success) {
            shopData = data;
            updateShopUI();
        } else {
            showError('Ошибка загрузки данных магазина');
        }
    } catch (error) {
        showError('Ошибка соединения с сервером');
        console.error('Error loading shop data:', error);
    } finally {
        showLoading(false);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getProducts`);
        const data = await response.json();
        
        if (data.success) {
            products = data.products || [];
            updateCategoriesUI();
            updateProductsUI();
            
            if (!data.shopOpen) {
                document.getElementById('checkout-btn').disabled = true;
                document.getElementById('checkout-btn').textContent = 'Магазин закрыт';
            }
        } else {
            showError(data.message || 'Ошибка загрузки товаров');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// =================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===================
function updateShopUI() {
    if (!shopData) return;
    
    // Обновляем название и информацию
    document.getElementById('shop-name').textContent = shopData.shopName || 'BATONIO';
    document.getElementById('delivery-info').textContent = shopData.deliveryInfo || '';
    document.getElementById('terms-text').textContent = shopData.orderConfirmationText || '';
    
    // Статус магазина
    const statusElement = document.getElementById('shop-status');
    if (shopData.shopOpen) {
        statusElement.textContent = 'Открыто';
        statusElement.className = 'shop-status open';
    } else {
        statusElement.textContent = 'Закрыто';
        statusElement.className = 'shop-status closed';
    }
    
    // Применяем стили для текущей категории
    applyCategoryStyle('all');
}

function updateCategoriesUI() {
    const categoriesContainer = document.getElementById('categories-scroll');
    categoriesContainer.innerHTML = '';
    
    // Определяем уникальные категории из товаров
    const uniqueCategories = ['all'];
    products.forEach(product => {
        if (product.category && !uniqueCategories.includes(product.category)) {
            uniqueCategories.push(product.category);
        }
    });
    
    // Создаем кнопки категорий
    uniqueCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${category === currentCategory ? 'active' : ''}`;
        button.textContent = getCategoryDisplayName(category);
        button.dataset.category = category;
        
        button.addEventListener('click', () => {
            switchCategory(category);
        });
        
        categoriesContainer.appendChild(button);
    });
}

function getCategoryDisplayName(category) {
    const names = {
        'all': 'Все товары',
        'baking': 'Выпечка',
        'frozen': 'Заморозка',
        'drinks': 'Напитки',
        'slot1': 'Категория 1',
        'slot2': 'Категория 2'
    };
    return names[category] || category;
}

function switchCategory(category) {
    currentCategory = category;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Применяем стили категории
    applyCategoryStyle(category);
    
    // Фильтруем товары
    updateProductsUI();
}

function applyCategoryStyle(category) {
    if (!shopData || !shopData.categoryStyles) return;
    
    const styles = shopData.categoryStyles[category] || shopData.categoryStyles['all'] || {};
    const productsSection = document.getElementById('products-section');
    const root = document.documentElement;
    
    // Применяем фоновое изображение
    if (styles.bg) {
        productsSection.style.backgroundImage = `url('${styles.bg}')`;
    } else {
        productsSection.style.backgroundImage = 'none';
    }
    
    // Применяем CSS переменные для цветов
    if (styles.color) {
        root.style.setProperty('--primary-color', styles.color);
    }
    if (styles.color2) {
        root.style.setProperty('--secondary-color', styles.color2);
    }
    
    // Также применяем к кнопкам категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.style.backgroundColor = styles.color || '';
            btn.style.borderColor = styles.color || '';
        } else {
            btn.style.backgroundColor = '';
            btn.style.borderColor = styles.color || '';
            btn.style.color = styles.color || '';
        }
    });
}

function updateProductsUI() {
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="loading">Товары не найдены</div>';
        return;
    }
    
    // Фильтруем товары по категории
    let filteredProducts = products;
    if (currentCategory !== 'all') {
        filteredProducts = products.filter(p => p.category === currentCategory);
    }
    
    // Сортируем по ID
    filteredProducts.sort((a, b) => a.id - b.id);
    
    productsGrid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x200/667eea/ffffff?text=Товар'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=Товар'">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-weight">${product.weight || ''}</div>
                <div class="product-price">${product.price} руб.</div>
            </div>
            <div class="product-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn minus" ${quantity === 0 ? 'disabled' : ''}>-</button>
                    <span class="quantity-display">${quantity || 0}</span>
                    <button class="quantity-btn plus" ${quantity >= product.maxOrder ? 'disabled' : ''}>+</button>
                </div>
            </div>
        `;
        
        // Обработчики для кнопок +/- на карточке
        const minusBtn = productCard.querySelector('.minus');
        const plusBtn = productCard.querySelector('.plus');
        const quantityDisplay = productCard.querySelector('.quantity-display');
        
        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateCartItem(product.id, -1);
            const newQty = Math.max(0, quantity - 1);
            quantityDisplay.textContent = newQty;
            minusBtn.disabled = newQty === 0;
            plusBtn.disabled = newQty >= product.maxOrder;
            updateCartUI();
        });
        
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (quantity < product.maxOrder) {
                updateCartItem(product.id, 1);
                const newQty = quantity + 1;
                quantityDisplay.textContent = newQty;
                minusBtn.disabled = false;
                plusBtn.disabled = newQty >= product.maxOrder;
                updateCartUI();
            }
        });
        
        // Клик по карточке открывает модалку товара
        productCard.addEventListener('click', () => {
            openProductModal(product);
        });
        
        productsGrid.appendChild(productCard);
    });
}

// =================== РАБОТА С КОРЗИНОЙ ===================
function updateCartItem(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + change;
        
        if (newQuantity <= 0) {
            // Удаляем товар из корзины
            cart = cart.filter(item => item.id !== productId);
        } else if (newQuantity <= product.maxOrder) {
            // Обновляем количество
            existingItem.quantity = newQuantity;
            existingItem.total = existingItem.price * newQuantity;
        }
    } else if (change > 0) {
        // Добавляем новый товар
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price,
            maxOrder: product.maxOrder
        });
    }
    
    saveCartToStorage();
    updateCheckoutButton();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountElement = document.getElementById('cart-count');
    const cartTotalElement = document.getElementById('cart-total');
    const modalTotalElement = document.getElementById('modal-total');
    
    // Обновляем счетчики
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalSum = cart.reduce((sum, item) => sum + item.total, 0);
    
    cartCountElement.textContent = totalItems;
    cartTotalElement.textContent = `${totalSum} руб.`;
    modalTotalElement.textContent = totalSum;
    
    // Обновляем список товаров в корзине
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} × ${item.quantity} = ${item.total} руб.</div>
            </div>
            <div class="cart-item-quantity">
                <button class="decrease">-</button>
                <button class="increase">+</button>
            </div>
        `;
        
        // Обработчики для кнопок в корзине
        const decreaseBtn = cartItemElement.querySelector('.decrease');
        const increaseBtn = cartItemElement.querySelector('.increase');
        const product = products.find(p => p.id === item.id);
        
        decreaseBtn.addEventListener('click', () => {
            updateCartItem(item.id, -1);
            updateCartUI();
            updateProductsUI();
        });
        
        increaseBtn.addEventListener('click', () => {
            if (item.quantity < (product?.maxOrder || 10)) {
                updateCartItem(item.id, 1);
                updateCartUI();
                updateProductsUI();
            }
        });
        
        cartItemsContainer.appendChild(cartItemElement);
    });
}

function updateCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const isShopOpen = shopData?.shopOpen !== false;
    
    if (cart.length > 0 && isShopOpen) {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Оформить заказ';
    } else {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = cart.length === 0 ? 'Корзина пуста' : 'Магазин закрыт';
    }
}

function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCartUI();
    updateProductsUI();
    updateCheckoutButton();
}

// =================== МОДАЛЬНЫЕ ОКНА ===================
function openProductModal(product) {
    currentProduct = product;
    currentQuantity = 1;
    
    document.getElementById('modal-product-image').src = product.imageUrl || 'https://via.placeholder.com/300x200/667eea/ffffff?text=Товар';
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-weight').textContent = product.weight || '';
    document.getElementById('modal-product-composition').textContent = product.composition || '';
    document.getElementById('modal-product-price').textContent = product.price;
    document.getElementById('modal-product-max').textContent = product.maxOrder || 10;
    document.getElementById('product-quantity').textContent = currentQuantity;
    
    document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
    currentProduct = null;
}

function openCheckoutModal() {
    // Заполняем форму данными пользователя
    document.getElementById('customer-name').value = userData.name;
    document.getElementById('phone').value = userData.phone;
    document.getElementById('city').value = userData.city;
    document.getElementById('street').value = userData.street;
    document.getElementById('house').value = userData.house;
    document.getElementById('apartment').value = userData.apartment;
    document.getElementById('comment').value = userData.comment;
    document.getElementById('remember-me').checked = true;
    
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

function openPaymentModal() {
    document.getElementById('payment-modal').classList.remove('hidden');
    
    // Имитация обработки платежа
    setTimeout(() => {
        document.querySelector('.payment-loader').classList.add('hidden');
        document.getElementById('confirm-payment').classList.remove('hidden');
    }, 2000);
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    document.querySelector('.payment-loader').classList.remove('hidden');
    document.getElementById('confirm-payment').classList.add('hidden');
}

function showSuccess(message) {
    document.getElementById('success-message').textContent = message;
    document.getElementById('success-modal').classList.remove('hidden');
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
    clearCart();
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.remove('hidden');
}

function closeErrorModal() {
    document.getElementById('error-modal').classList.add('hidden');
}

function showLoading(show) {
    // Можно добавить индикатор загрузки
    if (show) {
        document.getElementById('products-grid').innerHTML = '<div class="loading">Загрузка...</div>';
    }
}

// =================== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ===================
function saveCartToStorage() {
    try {
        localStorage.setItem('batonio_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart to storage:', e);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('batonio_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Error loading cart from storage:', e);
    }
}

function saveUserDataToStorage() {
    try {
        localStorage.setItem('batonio_user', JSON.stringify(userData));
    } catch (e) {
        console.error('Error saving user data:', e);
    }
}

function loadUserDataFromStorage() {
    try {
        const savedUser = localStorage.getItem('batonio_user');
        if (savedUser) {
            userData = JSON.parse(savedUser);
        }
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

// =================== ОФОРМЛЕНИЕ ЗАКАЗА ===================
async function submitOrder() {
    try {
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            showError('Ошибка Telegram. Перезагрузите приложение.');
            return;
        }
        
        const user = tg.initDataUnsafe.user;
        const telegramUserId = user.id;
        
        // Собираем данные формы
        const orderData = {
            telegramUserId: telegramUserId,
            customerName: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            city: document.getElementById('city').value,
            street: document.getElementById('street').value.trim(),
            house: document.getElementById('house').value.trim(),
            apartment: document.getElementById('apartment').value.trim(),
            comment: document.getElementById('comment').value.trim(),
            cart: cart,
            totalSum: cart.reduce((sum, item) => sum + item.total, 0),
            agreeToTerms: document.getElementById('agree-terms').checked
        };
        
        // Валидация
        if (!orderData.customerName || !orderData.phone || !orderData.street || !orderData.house) {
            showError('Заполните все обязательные поля (отмечены *)');
            return;
        }
        
        if (!orderData.agreeToTerms) {
            showError('Необходимо согласиться с условиями доставки');
            return;
        }
        
        // Сохраняем данные пользователя, если нужно
        if (document.getElementById('remember-me').checked) {
            userData = {
                name: orderData.customerName,
                phone: orderData.phone,
                city: orderData.city,
                street: orderData.street,
                house: orderData.house,
                apartment: orderData.apartment,
                comment: orderData.comment
            };
            saveUserDataToStorage();
        }
        
        // Закрываем модалку оформления и открываем оплату
        closeCheckoutModal();
        openPaymentModal();
        
    } catch (error) {
        console.error('Error preparing order:', error);
        showError('Ошибка подготовки заказа');
    }
}

async function confirmPayment() {
    try {
        const user = tg.initDataUnsafe.user;
        const telegramUserId = user.id;
        
        const orderData = {
            telegramUserId: telegramUserId,
            customerName: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            city: document.getElementById('city').value,
            street: document.getElementById('street').value.trim(),
            house: document.getElementById('house').value.trim(),
            apartment: document.getElementById('apartment').value.trim(),
            comment: document.getElementById('comment').value.trim(),
            cart: cart,
            totalSum: cart.reduce((sum, item) => sum + item.total, 0),
            agreeToTerms: true // Уже проверили
        };
        
        // Отправляем заказ на сервер
        const response = await fetch(`${CONFIG.API_URL}?action=placeOrder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closePaymentModal();
            showSuccess(result.message || 'Заказ успешно оформлен!');
        } else {
            closePaymentModal();
            showError(result.message || 'Ошибка оформления заказа');
        }
        
    } catch (error) {
        console.error('Error confirming payment:', error);
        closePaymentModal();
        showError('Ошибка соединения с сервером');
    }
}

// =================== НАСТРОЙКА ОБРАБОТЧИКОВ ===================
function setupEventListeners() {
    // Кнопка оформления заказа
    document.getElementById('checkout-btn').addEventListener('click', openCheckoutModal);
    
    // Кнопка очистки корзины
    document.getElementById('clear-cart').addEventListener('click', clearCart);
    
    // Модалка товара
    document.getElementById('close-product-modal').addEventListener('click', closeProductModal);
    document.getElementById('decrease-qty').addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            document.getElementById('product-quantity').textContent = currentQuantity;
        }
    });
    document.getElementById('increase-qty').addEventListener('click', () => {
        if (currentProduct && currentQuantity < currentProduct.maxOrder) {
            currentQuantity++;
            document.getElementById('product-quantity').textContent = currentQuantity;
        }
    });
    document.getElementById('add-to-cart-modal').addEventListener('click', () => {
        if (currentProduct) {
            // Добавляем товар в корзину с выбранным количеством
            for (let i = 0; i < currentQuantity; i++) {
                updateCartItem(currentProduct.id, 1);
            }
            updateCartUI();
            updateProductsUI();
            closeProductModal();
        }
    });
    
    // Модалка оформления
    document.getElementById('cancel-order').addEventListener('click', closeCheckoutModal);
    document.getElementById('delivery-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitOrder();
    });
    
    // Модалка оплаты
    document.getElementById('confirm-payment').addEventListener('click', confirmPayment);
    
    // Модалка успеха
    document.getElementById('close-success').addEventListener('click', closeSuccessModal);
    
    // Модалка ошибки
    document.getElementById('close-error').addEventListener('click', closeErrorModal);
    
    // Закрытие модалок по клику на фон
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// =================== ЗАПУСК ПРИЛОЖЕНИЯ ===================
// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);

