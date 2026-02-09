// Конфигурация
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzBzucEpZ_gAJSy-InWums6sRsuhPJ8APuRFLwlQnGuvGMg3v6t3JKyyTlqXAwec5Yzzg/exec/dev'
};

// Состояние приложения
let state = {
    shopData: null,
    products: [],
    categories: [],
    activeCategory: 'all',
    cart: JSON.parse(localStorage.getItem('batonio_cart')) || [],
    userData: JSON.parse(localStorage.getItem('batonio_user')) || {},
    currentProduct: null,
    telegramUserId: null
};

// DOM элементы
const elements = {
    shopName: document.getElementById('shopName'),
    deliveryInfo: document.getElementById('deliveryInfo'),
    categoriesContainer: document.getElementById('categoriesContainer'),
    productsContainer: document.getElementById('productsContainer'),
    loader: document.getElementById('loader'),
    cartItemsCount: document.getElementById('cartItemsCount'),
    cartTotal: document.getElementById('cartTotal'),
    cartButton: document.getElementById('cartButton'),
    
    // Модальные окна
    productModal: document.getElementById('productModal'),
    cartModal: document.getElementById('cartModal'),
    checkoutModal: document.getElementById('checkoutModal'),
    successModal: document.getElementById('successModal'),
    
    // Кнопки закрытия
    closeModal: document.getElementById('closeModal'),
    closeCartModal: document.getElementById('closeCartModal'),
    closeCheckoutModal: document.getElementById('closeCheckoutModal'),
    closeSuccessBtn: document.getElementById('closeSuccessBtn'),
    
    // Модальное окно товара
    modalImage: document.getElementById('modalImage'),
    modalTitle: document.getElementById('modalTitle'),
    modalWeight: document.getElementById('modalWeight'),
    modalComposition: document.getElementById('modalComposition'),
    modalPrice: document.getElementById('modalPrice'),
    quantityInput: document.getElementById('quantityInput'),
    quantityMinus: document.getElementById('quantityMinus'),
    quantityPlus: document.getElementById('quantityPlus'),
    maxOrderText: document.getElementById('maxOrderText'),
    addToCartBtn: document.getElementById('addToCartBtn'),
    
    // Модальное окно корзины
    cartItemsList: document.getElementById('cartItemsList'),
    cartModalTotal: document.getElementById('cartModalTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    
    // Модальное окно оформления заказа
    checkoutForm: document.getElementById('checkoutForm'),
    customerName: document.getElementById('customerName'),
    phone: document.getElementById('phone'),
    city: document.getElementById('city'),
    street: document.getElementById('street'),
    house: document.getElementById('house'),
    apartment: document.getElementById('apartment'),
    comment: document.getElementById('comment'),
    agreeToTerms: document.getElementById('agreeToTerms'),
    termsText: document.getElementById('termsText'),
    checkoutOrderItems: document.getElementById('checkoutOrderItems'),
    checkoutTotal: document.getElementById('checkoutTotal'),
    submitOrderBtn: document.getElementById('submitOrderBtn'),
    
    // Модальное окно успеха
    successMessage: document.getElementById('successMessage'),
    successDelivery: document.getElementById('successDelivery')
};

// Инициализация Telegram Web App
function initTelegram() {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram && Telegram.WebApp) {
        try {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            console.log('✅ Telegram WebApp готов');
            console.log('📱 Platform:', Telegram.WebApp.platform);
            console.log('🎨 Theme:', Telegram.WebApp.colorScheme);
            
            // Получаем данные пользователя
            const initData = Telegram.WebApp.initDataUnsafe;
            if (initData && initData.user) {
                state.telegramUserId = initData.user.id;
                console.log('👤 User ID:', state.telegramUserId);
                console.log('👤 User:', initData.user);
                
                // Автозаполнение имени
                if (initData.user.first_name && !state.userData.customerName) {
                    const fullName = initData.user.first_name + 
                                   (initData.user.last_name ? ' ' + initData.user.last_name : '');
                    elements.customerName.value = fullName;
                    console.log('📝 Автозаполнение имени:', fullName);
                }
            } else {
                console.log('⚠️ Данные пользователя не доступны');
            }
            
            // Устанавливаем тему Telegram
            applyTelegramTheme();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Telegram:', error);
        }
    } else {
        console.log('⚠️ Telegram WebApp не обнаружен, работаем в браузере');
    }
}

// Применяем тему Telegram
function applyTelegramTheme() {
    if (window.Telegram && Telegram.WebApp) {
        const theme = Telegram.WebApp.colorScheme;
        const bgColor = Telegram.WebApp.backgroundColor;
        
        console.log('🎨 Применяем тему Telegram:', theme, bgColor);
        
        if (theme === 'dark') {
            document.body.style.backgroundColor = '#212121';
            document.body.style.color = '#ffffff';
        }
        
        // Можно добавить больше кастомизации под тему Telegram
    }
}

// Загрузка данных магазина
async function loadShopData() {
    console.log('🔄 Загружаем данные магазина...');
    
    try {
        const url = `${CONFIG.API_URL}?action=getShopData`;
        console.log('📡 URL:', url);
        
        const response = await fetch(url);
        console.log('📦 Ответ получен, статус:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Данные магазина:', data);
        
        if (data.success) {
            state.shopData = data;
            
            // Обновляем UI
            elements.shopName.textContent = data.shopName || 'BATONIO';
            elements.deliveryInfo.textContent = data.deliveryInfo || 'Загрузка...';
            elements.termsText.textContent = data.orderConfirmationText || 'Я понимаю, что заказывая сейчас, заказ будет доставлен завтра';
            
            console.log('✅ Данные магазина загружены');
            
            // Загружаем товары
            await loadProducts();
        } else {
            console.error('❌ Ошибка API магазина:', data.error);
            showError('Ошибка загрузки данных магазина');
        }
    } catch (error) {
        console.error('💥 Ошибка загрузки данных:', error);
        showError('Ошибка соединения с сервером');
        
        // Показываем тестовые данные если API не работает
        loadTestShopData();
        await loadProducts();
    }
}

// Тестовые данные магазина
function loadTestShopData() {
    console.log('🛠️ Загружаем тестовые данные магазина...');
    
    state.shopData = {
        shopName: 'BATONIO',
        deliveryInfo: 'Доставка осуществляется на следующий день с 17:00 до 20:00',
        orderConfirmationText: 'Я понимаю, что заказывая сейчас, заказ будет доставлен завтра с 17:00 до 20:00',
        shopOpen: true,
        deliveryTime: { startTime: '17:00', endTime: '20:00' },
        defaultColor: '#667eea',
        categoryStyles: {
            baking: { bg: '', color: '#8B4513', color2: '#D2691E' },
            frozen: { bg: '', color: '#1e90ff', color2: '#87ceeb' },
            drinks: { bg: '', color: '#32CD32', color2: '#90EE90' }
        }
    };
    
    elements.shopName.textContent = state.shopData.shopName;
    elements.deliveryInfo.textContent = state.shopData.deliveryInfo;
    elements.termsText.textContent = state.shopData.orderConfirmationText;
}

// Упрощенная загрузка товаров для Telegram
async function loadProducts() {
    console.log('🔄 Загружаем товары...');
    
    try {
        const url = `${CONFIG.API_URL}?action=getProducts`;
        console.log('📡 URL:', url);
        
        const response = await fetch(url);
        console.log('📦 Ответ получен, статус:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Данные товаров:', data);
        
        if (data.success && data.products) {
            // Очищаем и валидируем данные
            const cleanedProducts = (data.products || []).map((product, index) => ({
                id: Number(product.id) || index + 1,
                name: String(product.name || `Товар ${index + 1}`).trim(),
                category: String(product.category || 'other').trim(),
                weight: String(product.weight || '').trim(),
                composition: String(product.composition || 'Состав не указан').trim(),
                price: Number(product.price) || 0,
                imageUrl: String(product.imageUrl || 'https://via.placeholder.com/400x300?text=Товар').trim(),
                maxOrder: Number(product.maxOrder) || 10
            }));
            
            state.products = cleanedProducts;
            console.log(`✅ Загружено ${state.products.length} товаров`);
            
        } else {
            console.warn('⚠️ API вернул ошибку или пустой список');
            console.log('Данные:', data);
            loadTestProducts();
        }
    } catch (error) {
        console.error('💥 Ошибка загрузки товаров:', error);
        console.log('🛠️ Используем тестовые товары из-за ошибки');
        loadTestProducts();
    }
    
    // Всегда показываем что-то
    if (state.products.length === 0) {
        loadTestProducts();
    }
    
    extractCategories();
    renderCategories();
    renderProducts();
    elements.loader.style.display = 'none';
    updateCartUI();
    
    console.log('🎉 Товары успешно загружены!');
}

// Тестовые товары
function loadTestProducts() {
    console.log('🛠️ Загружаем тестовые товары...');
    
    state.products = [
        {
            id: 1,
            name: "Багет французский",
            category: "baking",
            weight: "300г",
            composition: "Мука, вода, соль, дрожжи",
            price: 120,
            imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
            maxOrder: 10
        },
        {
            id: 2,
            name: "Круассан шоколадный",
            category: "baking",
            weight: "150г",
            composition: "Мука, масло, шоколад, сахар",
            price: 180,
            imageUrl: "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?w=400&h=400&fit=crop",
            maxOrder: 10
        },
        {
            id: 3,
            name: "Пельмени",
            category: "frozen",
            weight: "500г",
            composition: "Тесто, мясо, лук, специи",
            price: 450,
            imageUrl: "https://images.unsplash.com/photo-1606580664954-b5f0d4e5dfd0?w=400&h=400&fit=crop",
            maxOrder: 5
        }
    ];
    
    console.log(`✅ Загружено ${state.products.length} тестовых товаров`);
}

// Извлечение категорий из товаров
function extractCategories() {
    const categoriesSet = new Set(['all']);
    state.products.forEach(product => {
        if (product && product.category) {
            categoriesSet.add(product.category);
        }
    });
    
    state.categories = Array.from(categoriesSet);
    console.log('📂 Категории:', state.categories);
}

// Рендер категорий
function renderCategories() {
    console.log('🎨 Рендерим категории...');
    
    elements.categoriesContainer.innerHTML = '';
    
    state.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${category === state.activeCategory ? 'active' : ''}`;
        button.textContent = getCategoryName(category);
        button.dataset.category = category;
        
        button.addEventListener('click', () => {
            state.activeCategory = category;
            renderCategories();
            renderProducts();
        });
        
        elements.categoriesContainer.appendChild(button);
    });
}

// Рендер товаров
function renderProducts() {
    console.log('🎨 Рендерим товары...');
    console.log('Активная категория:', state.activeCategory);
    console.log('Всего товаров:', state.products.length);
    
    elements.productsContainer.innerHTML = '';
    
    const filteredProducts = state.activeCategory === 'all' 
        ? state.products 
        : state.products.filter(p => p && p.category === state.activeCategory);
    
    console.log('Отфильтрованные товары:', filteredProducts.length);
    
    if (filteredProducts.length === 0) {
        elements.productsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <p>Товары в этой категории пока отсутствуют</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.imageUrl}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Товар'">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-weight">${product.weight}</div>
                <div class="product-price">${product.price} руб.</div>
            </div>
        `;
        
        productCard.addEventListener('click', () => openProductModal(product));
        elements.productsContainer.appendChild(productCard);
    });
}

// Создание карточки товара
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.imageUrl || 'https://via.placeholder.com/400x300?text=Товар'}" 
             alt="${product.name}" 
             class="product-image"
             onerror="this.src='https://via.placeholder.com/400x300?text=Товар'">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-weight">${product.weight}</div>
            <div class="product-price">${product.price} руб.</div>
        </div>
    `;
    
    card.addEventListener('click', () => openProductModal(product));
    return card;
}

// Открытие модального окна товара
function openProductModal(product) {
    state.currentProduct = product;
    
    elements.modalImage.src = product.imageUrl || 'https://via.placeholder.com/400x300?text=Товар';
    elements.modalImage.onerror = function() {
        this.src = 'https://via.placeholder.com/400x300?text=Товар';
    };
    
    elements.modalTitle.textContent = product.name;
    elements.modalWeight.textContent = product.weight;
    elements.modalComposition.textContent = product.composition || 'Состав не указан';
    elements.modalPrice.textContent = `${product.price} руб.`;
    elements.maxOrderText.textContent = `Макс: ${product.maxOrder || 10} шт.`;
    
    elements.quantityInput.value = 1;
    elements.quantityInput.max = product.maxOrder || 10;
    
    elements.productModal.style.display = 'flex';
}

// Управление корзиной
function addToCart(productId, quantity) {
    const product = state.products.find(p => p.id == productId);
    if (!product) return false;
    
    const existingItem = state.cart.find(item => item.id == productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.maxOrder) {
            alert(`Максимальное количество: ${product.maxOrder} шт.`);
            return false;
        }
        existingItem.quantity = newQuantity;
        existingItem.total = existingItem.quantity * product.price;
    } else {
        if (quantity > product.maxOrder) {
            alert(`Максимальное количество: ${product.maxOrder} шт.`);
            return false;
        }
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            total: product.price * quantity,
            imageUrl: product.imageUrl
        });
    }
    
    saveCart();
    updateCartUI();
    return true;
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id != productId);
    saveCart();
    updateCartUI();
}

function updateCartItemQuantity(productId, newQuantity) {
    const item = state.cart.find(item => item.id == productId);
    if (!item) return;
    
    const product = state.products.find(p => p.id == productId);
    if (newQuantity > (product?.maxOrder || 10)) {
        alert(`Максимальное количество: ${product.maxOrder} шт.`);
        return;
    }
    
    if (newQuantity < 1) {
        removeFromCart(productId);
    } else {
        item.quantity = newQuantity;
        item.total = item.quantity * item.price;
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('batonio_cart', JSON.stringify(state.cart));
}

function saveUserData() {
    localStorage.setItem('batonio_user', JSON.stringify(state.userData));
}

// Обновление UI корзины
function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + item.total, 0);
    
    elements.cartItemsCount.textContent = `${totalItems} ${getWordForm(totalItems, ['товар', 'товара', 'товаров'])}`;
    elements.cartTotal.textContent = `${totalPrice} руб.`;
    
    elements.cartButton.disabled = totalItems === 0;
    
    if (elements.cartModal.style.display === 'flex') {
        renderCartItems();
    }
}

// Рендер товаров в модальном окне корзины
function renderCartItems() {
    elements.cartItemsList.innerHTML = '';
    
    if (state.cart.length === 0) {
        elements.cartItemsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>Корзина пуста</p>
            </div>
        `;
        return;
    }
    
    state.cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.imageUrl || 'https://via.placeholder.com/100x100?text=Товар'}" 
                 alt="${item.name}" 
                 class="cart-item-image"
                 onerror="this.src='https://via.placeholder.com/100x100?text=Товар'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} руб.</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn minus" data-id="${item.id}">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}">+</button>
                <button class="remove-item" data-id="${item.id}">×</button>
            </div>
        `;
        
        elements.cartItemsList.appendChild(cartItem);
    });
    
    const total = state.cart.reduce((sum, item) => sum + item.total, 0);
    elements.cartModalTotal.textContent = total;
}

// Оформление заказа
async function submitOrder(orderData) {
    console.log('🔄 Отправляем заказ...', orderData);
    
    try {
        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('action', 'placeOrder');
        url.searchParams.append('telegramUserId', state.telegramUserId || 0);
        url.searchParams.append('customerName', orderData.customerName);
        url.searchParams.append('phone', orderData.phone);
        url.searchParams.append('city', orderData.city);
        url.searchParams.append('street', orderData.street);
        url.searchParams.append('house', orderData.house);
        url.searchParams.append('apartment', orderData.apartment || '');
        url.searchParams.append('comment', orderData.comment || '');
        url.searchParams.append('cart', JSON.stringify(state.cart));
        url.searchParams.append('totalSum', state.cart.reduce((sum, item) => sum + item.total, 0));
        url.searchParams.append('agreeToTerms', 'true');
        
        console.log('📡 URL запроса:', url.toString());
        
        const response = await fetch(url.toString());
        console.log('📦 Ответ получен, статус:', response.status);
        
        const result = await response.json();
        console.log('📊 Результат:', result);
        
        if (result.success) {
            state.cart = [];
            saveCart();
            updateCartUI();
            
            state.userData = {
                customerName: orderData.customerName,
                phone: orderData.phone,
                city: orderData.city,
                street: orderData.street,
                house: orderData.house,
                apartment: orderData.apartment
            };
            saveUserData();
            
            showSuccessModal(result.orderId);
            return true;
        } else {
            alert(`Ошибка: ${result.error || 'Неизвестная ошибка'}`);
            return false;
        }
    } catch (error) {
        console.error('💥 Ошибка при отправке заказа:', error);
        alert('Ошибка при отправке заказа. Попробуйте еще раз.\n' + error.message);
        return false;
    }
}

// Вспомогательные функции
function getCategoryName(category) {
    const names = {
        'all': 'Все',
        'baking': 'Выпечка',
        'frozen': 'Заморозка',
        'drinks': 'Напитки',
        'slot1': 'Доп.категория 1',
        'slot2': 'Доп.категория 2'
    };
    return names[category] || category;
}

function getWordForm(number, forms) {
    number = Math.abs(number) % 100;
    const n1 = number % 10;
    if (number > 10 && number < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 == 1) return forms[0];
    return forms[2];
}

function showSuccessModal(orderId) {
    const deliveryTime = state.shopData?.deliveryTime || { startTime: '17:00', endTime: '20:00' };
    
    elements.successMessage.textContent = `Ваш заказ #${orderId} успешно принят.`;
    elements.successDelivery.textContent = `Доставка: завтра с ${deliveryTime.startTime} до ${deliveryTime.endTime}`;
    
    elements.checkoutModal.style.display = 'none';
    elements.cartModal.style.display = 'none';
    elements.successModal.style.display = 'flex';
}

function showError(message) {
    elements.productsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <p>${message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Попробовать снова
            </button>
        </div>
    `;
}

// Инициализация событий
function initEventListeners() {
    console.log('🔄 Инициализация событий...');
    
    // Закрытие модальных окон
    elements.closeModal.addEventListener('click', () => {
        elements.productModal.style.display = 'none';
    });
    
    elements.closeCartModal.addEventListener('click', () => {
        elements.cartModal.style.display = 'none';
    });
    
    elements.closeCheckoutModal.addEventListener('click', () => {
        elements.checkoutModal.style.display = 'none';
    });
    
    elements.closeSuccessBtn.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
    });
    
    // Закрытие по клику на оверлей
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });
    
    // Управление количеством в модальном окне товара
    elements.quantityMinus.addEventListener('click', () => {
        const current = parseInt(elements.quantityInput.value);
        if (current > 1) {
            elements.quantityInput.value = current - 1;
        }
    });
    
    elements.quantityPlus.addEventListener('click', () => {
        const current = parseInt(elements.quantityInput.value);
        const max = parseInt(elements.quantityInput.max);
        if (current < max) {
            elements.quantityInput.value = current + 1;
        }
    });
    
    // Добавление в корзину
    elements.addToCartBtn.addEventListener('click', () => {
        if (!state.currentProduct) return;
        
        const quantity = parseInt(elements.quantityInput.value);
        if (addToCart(state.currentProduct.id, quantity)) {
            elements.productModal.style.display = 'none';
            showNotification(`${state.currentProduct.name} добавлен в корзину`);
        }
    });
    
    // Открытие корзины
    elements.cartButton.addEventListener('click', () => {
        renderCartItems();
        elements.cartModal.style.display = 'flex';
    });
    
    // Делегирование событий в корзине
    elements.cartItemsList.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        
        if (e.target.classList.contains('minus')) {
            const item = state.cart.find(item => item.id == productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity - 1);
            }
        } else if (e.target.classList.contains('plus')) {
            const item = state.cart.find(item => item.id == productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity + 1);
            }
        } else if (e.target.classList.contains('remove-item')) {
            removeFromCart(productId);
        }
    });
    
    // Оформление заказа
    elements.checkoutBtn.addEventListener('click', () => {
        state.userData = {
            customerName: elements.customerName.value,
            phone: elements.phone.value,
            city: elements.city.value,
            street: elements.street.value,
            house: elements.house.value,
            apartment: elements.apartment.value
        };
        saveUserData();
        
        elements.checkoutModal.style.display = 'flex';
        elements.cartModal.style.display = 'none';
        
        if (state.userData.customerName) elements.customerName.value = state.userData.customerName;
        if (state.userData.phone) elements.phone.value = state.userData.phone;
        if (state.userData.street) elements.street.value = state.userData.street;
        if (state.userData.house) elements.house.value = state.userData.house;
        if (state.userData.apartment) elements.apartment.value = state.userData.apartment;
        
        renderCheckoutOrder();
    });
    
    // Отправка формы заказа
    elements.checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!elements.agreeToTerms.checked) {
            alert('Необходимо согласиться с условиями доставки');
            return;
        }
        
        elements.submitOrderBtn.disabled = true;
        elements.submitOrderBtn.textContent = 'Отправка...';
        
        try {
            await submitOrder({
                customerName: elements.customerName.value,
                phone: elements.phone.value,
                city: elements.city.value,
                street: elements.street.value,
                house: elements.house.value,
                apartment: elements.apartment.value,
                comment: elements.comment.value
            });
        } finally {
            elements.submitOrderBtn.disabled = false;
            elements.submitOrderBtn.textContent = 'Подтвердить заказ';
        }
    });
    
    console.log('✅ События инициализированы');
}

// Рендер заказа в форме оформления
function renderCheckoutOrder() {
    elements.checkoutOrderItems.innerHTML = '';
    
    state.cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checkout-order-item';
        div.textContent = `${item.name} x${item.quantity} = ${item.total} руб.`;
        elements.checkoutOrderItems.appendChild(div);
    });
    
    const total = state.cart.reduce((sum, item) => sum + item.total, 0);
    elements.checkoutTotal.textContent = total;
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Инициализация приложения
async function initApp() {
    console.log('🚀 Запуск приложения BATONIO...');
    
    // Инициализируем Telegram
    initTelegram();
    
    // Инициализируем события
    initEventListeners();
    
    // Загружаем данные
    await loadShopData();
    
    // Восстанавливаем данные пользователя
    if (state.userData.customerName) elements.customerName.value = state.userData.customerName;
    if (state.userData.phone) elements.phone.value = state.userData.phone;
    if (state.userData.street) elements.street.value = state.userData.street;
    if (state.userData.house) elements.house.value = state.userData.house;
    if (state.userData.apartment) elements.apartment.value = state.userData.apartment;
    
    console.log('🎉 Приложение успешно запущено!');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);