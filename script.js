// ==================== ДАННЫЕ ====================
const appData = {
    // Настройки магазина
    title: "Батоньо",
    info: "🥖 Свежая выпечка каждый день! Скидка 20% на всё",
    
    // Категории
    categories: [
        { id: "cat1", name: "Пирожные", img: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400", bg: "#fff5e6", color: "#E76F51" },
        { id: "cat2", name: "Торты", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", bg: "#f0e6d2", color: "#9C89B8" },
        { id: "cat3", name: "Выпечка", img: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=400", bg: "#e0f2e9", color: "#2A9D8F" }
    ],
    
    // Товары
    products: [
        { cat: "cat1", price: 350, weight: "90г", composition: "Мука, яйца, крем", info: "Свежее" },
        { cat: "cat1", price: 420, weight: "110г", composition: "Шоколад, мука, масло", info: "Хит продаж" },
        { cat: "cat1", price: 280, weight: "75г", composition: "Миндаль, белок, сахар", info: "Без глютена" },
        { cat: "cat1", price: 390, weight: "100г", composition: "Кокос, сгущенка", info: "Новинка" },
        { cat: "cat2", price: 1200, weight: "800г", composition: "Мед, сметана, орехи", info: "На заказ" },
        { cat: "cat2", price: 950, weight: "600г", composition: "Йогурт, ягоды, бисквит", info: "Легкий" },
        { cat: "cat3", price: 180, weight: "120г", composition: "Дрожжи, лук, яйцо", info: "Пирожок" },
        { cat: "cat3", price: 220, weight: "150г", composition: "Слоеное тесто, яблоко", info: "С яблоком" }
    ],
    
    // Города
    cities: ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Екатеринбург"],
    
    // Чекбоксы
    checkboxes: ["Перезвонить для подтверждения", "Нужен чек", "Подарочная упаковка"]
};

// Текущая категория
let currentCat = "cat1";

// ==================== ЗАПУСК ====================
function init() {
    // Заголовки
    document.getElementById('store-title').textContent = appData.title;
    document.getElementById('info-text').textContent = appData.info;
    
    // Отображаем всё
    showCategories();
    showCities();
    showCheckboxes();
    showProducts(currentCat);
    
    // Фон первой категории
    const first = appData.categories[0];
    document.getElementById('store-header').style.backgroundImage = `url('${first.img}')`;
    document.getElementById('catalog').style.backgroundColor = first.bg;
}

// ==================== КАТЕГОРИИ ====================
function showCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    appData.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${cat.id === currentCat ? 'active' : ''}`;
        btn.textContent = cat.name;
        btn.style.backgroundColor = cat.id === currentCat ? cat.color : '#e0e0e0';
        btn.style.color = cat.id === currentCat ? 'white' : '#333';
        btn.onclick = () => switchCategory(cat.id);
        container.appendChild(btn);
    });
}

function switchCategory(catId) {
    currentCat = catId;
    const cat = appData.categories.find(c => c.id === catId);
    
    // Меняем фон
    document.getElementById('store-header').style.backgroundImage = `url('${cat.img}')`;
    document.getElementById('catalog').style.backgroundColor = cat.bg;
    
    // Обновляем кнопки и товары
    showCategories();
    showProducts(catId);
}

// ==================== ТОВАРЫ ====================
function showProducts(catId) {
    const filtered = appData.products.filter(p => p.cat === catId);
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = '';
    
    if (filtered.length === 0) {
        catalog.innerHTML = '<p style="grid-column: span 2; text-align: center;">Нет товаров</p>';
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-price">${p.price} ₽</div>
            <div class="product-weight">${p.weight}</div>
            <div class="product-composition"><strong>Состав:</strong> ${p.composition}</div>
            <div class="product-info">${p.info}</div>
        `;
        catalog.appendChild(card);
    });
}

// ==================== ГОРОДА ====================
function showCities() {
    const container = document.getElementById('cities-container');
    container.innerHTML = '';
    
    appData.cities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'city-option';
        div.innerHTML = `
            <input type="radio" name="city" value="${city}">
            <label>${city}</label>
        `;
        container.appendChild(div);
    });
}

// ==================== ЧЕКБОКСЫ ====================
function showCheckboxes() {
    const container = document.getElementById('checkboxes-container');
    container.innerHTML = '';
    
    appData.checkboxes.forEach(cb => {
        const id = `cb-${cb.replace(/\s/g, '')}`;
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="${id}">
            <label for="${id}">${cb}</label>
        `;
        container.appendChild(div);
    });
    
    // Запомнить меня
    const remember = document.getElementById('remember-me-container');
    remember.innerHTML = `
        <div class="checkbox-item">
            <input type="checkbox" id="remember-me">
            <label for="remember-me">Запомнить меня</label>
        </div>
    `;
}

// ==================== ЗАКАЗ ====================
document.getElementById('order-btn').onclick = function() {
    // Проверяем выбран ли город
    const citySelected = document.querySelector('input[name="city"]:checked');
    if (!citySelected) {
        alert('Пожалуйста, выберите город доставки');
        return;
    }
    
    // Генерируем случайную сумму и номер заказа
    const amount = Math.floor(Math.random() * 1500) + 500;
    const orderNum = '#' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    document.getElementById('payment-amount').textContent = amount;
    document.getElementById('order-number').textContent = orderNum;
    
    // Показываем модалку
    document.getElementById('payment-modal').style.display = 'flex';
};

// ==================== МОДАЛКА ====================
// Закрыть
document.getElementById('close-modal').onclick = function() {
    document.getElementById('payment-modal').style.display = 'none';
};

// Оплатить
document.getElementById('fake-pay-btn').onclick = function() {
    alert('Спасибо! Заказ оформлен (демо-режим)');
    document.getElementById('payment-modal').style.display = 'none';
};

// Клик вне модалки
window.onclick = function(e) {
    const modal = document.getElementById('payment-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

// ==================== СТАРТ ====================
init();

