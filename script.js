// ==================== ПОДКЛЮЧЕНИЕ К SHEET.BEST (ВСЯ ТАБЛИЦА) ====================
const API_URL = 'https://api.sheetbest.com/sheets/d32ff2ab-71e3-40b2-bcb1-16235b99df7b';

// ==================== ПЕРЕМЕННЫЕ ====================
let currentCat = "cat1";
let appData = {
    title: "Загрузка...",
    info: "Загрузка данных...",
    categories: [],
    products: [],
    cities: [],
    checkboxes: [],
    rememberMe: true
};

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadData() {
    try {
        // Показываем статус
        document.getElementById('info-text').textContent = "Загрузка данных...";
        
        // Загружаем все данные из API
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("Данные из таблицы:", data);
        
        // Разделяем данные на config и products
        const configRows = [];
        const productRows = [];
        
        // Определяем, где какие данные (по первым строкам)
        data.forEach(row => {
            // Проверяем, есть ли поле с названиями категорий или товаров
            if (row.storeTitle && row.storeTitle.startsWith('category')) {
                configRows.push(row);
            } else if (row.категория || row.categoryId) {
                productRows.push(row);
            } else {
                // По умолчанию считаем конфигом
                configRows.push(row);
            }
        });
        
        console.log("Config rows:", configRows);
        console.log("Product rows:", productRows);
        
        // Парсим конфиг
        parseConfig(configRows);
        
        // Парсим товары (если есть)
        if (productRows.length > 0) {
            parseProducts(productRows);
        } else {
            // Если товаров нет, используем тестовые
            useTestProducts();
        }
        
        // Обновляем интерфейс
        updateUI();
        
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        document.getElementById('info-text').textContent = "Ошибка загрузки. Использую тестовые данные.";
        useTestData();
        updateUI();
    }
}

// ==================== ПАРСИНГ КОНФИГА ====================
function parseConfig(rows) {
    // Преобразуем в удобный объект
    const config = {};
    rows.forEach(row => {
        // В данных из Sheet.best ключи могут быть разными
        // Пробуем разные варианты
        const key = row.storeTitle || row.param || Object.keys(row)[0];
        const value = row["Вкусный Уголок"] || row.value || row[Object.keys(row)[1]];
        const status = row["2"] || row.status || row[Object.keys(row)[2]];
        
        if (key && value) {
            config[key] = { value, status };
        }
    });
    
    console.log("Распарсенный config:", config);
    
    // Заполняем appData
    appData.title = config.storeTitle?.value || "Вкусный Уголок";
    appData.info = config.infoText?.value || "Добро пожаловать!";
    
    // Категории
    appData.categories = [];
    for (let i = 1; i <= 10; i++) { // Проверяем до 10 категорий
        const name = config[`category${i}`]?.value;
        if (name) {
            appData.categories.push({
                id: `cat${i}`,
                name: name,
                img: config[`category${i}img`]?.value || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`,
                bg: config[`category${i}bg`]?.value || "#f5f5f5",
                color: config[`category${i}btn`]?.value || "#E76F51"
            });
        }
    }
    
    // Города
    appData.cities = [];
    for (let i = 1; i <= 10; i++) {
        const cityName = config[`city${i}`]?.value;
        if (cityName) {
            appData.cities.push({
                name: cityName,
                enabled: config[`city${i}`]?.status === "вкл"
            });
        }
    }
    
    // Чекбоксы
    appData.checkboxes = [];
    for (let i = 1; i <= 10; i++) {
        const cbName = config[`checkbox${i}`]?.value;
        if (cbName) {
            appData.checkboxes.push({
                label: cbName,
                enabled: config[`checkbox${i}`]?.status === "вкл"
            });
        }
    }
    
    appData.rememberMe = config.rememberMe?.value === "да";
}

// ==================== ПАРСИНГ ТОВАРОВ ====================
function parseProducts(rows) {
    appData.products = [];
    
    rows.forEach(row => {
        // Пробуем разные варианты названий полей
        const category = row.категория || row.category || row.categoryId || row.cat;
        const price = row.цена || row.price;
        const weight = row.вес || row.weight;
        const composition = row.состав || row.composition;
        const info = row.инфо || row.info;
        
        if (category && price) {
            // Определяем categoryId по названию
            let catId = "cat1";
            if (category.includes("Торт")) catId = "cat2";
            if (category.includes("Выпечка")) catId = "cat3";
            
            appData.products.push({
                cat: catId,
                price: parseInt(price) || 0,
                weight: weight || "",
                composition: composition || "",
                info: info || ""
            });
        }
    });
    
    console.log("Распарсенные товары:", appData.products);
}

// ==================== ТЕСТОВЫЕ ТОВАРЫ ====================
function useTestProducts() {
    appData.products = [
        { cat: "cat1", price: 350, weight: "90г", composition: "Мука, яйца, крем", info: "Свежее" },
        { cat: "cat1", price: 420, weight: "110г", composition: "Шоколад, мука, масло", info: "Хит" },
        { cat: "cat1", price: 280, weight: "75г", composition: "Миндаль, белок, сахар", info: "Без глютена" },
        { cat: "cat2", price: 1200, weight: "800г", composition: "Мед, сметана, орехи", info: "На заказ" },
        { cat: "cat2", price: 950, weight: "600г", composition: "Йогурт, ягоды, бисквит", info: "Легкий" },
        { cat: "cat3", price: 180, weight: "120г", composition: "Дрожжи, лук, яйцо", info: "Пирожок" },
        { cat: "cat3", price: 220, weight: "150г", composition: "Слоеное тесто, яблоко", info: "С яблоком" }
    ];
}

// ==================== ТЕСТОВЫЕ ДАННЫЕ (ПОЛНЫЕ) ====================
function useTestData() {
    appData = {
        title: "Вкусный Уголок",
        info: "🥖 Свежая выпечка каждый день! Скидка 20%",
        categories: [
            { id: "cat1", name: "Пирожные", img: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400", bg: "#fff5e6", color: "#E76F51" },
            { id: "cat2", name: "Торты", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", bg: "#f0e6d2", color: "#9C89B8" },
            { id: "cat3", name: "Выпечка", img: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=400", bg: "#e0f2e9", color: "#2A9D8F" }
        ],
        products: [
            { cat: "cat1", price: 350, weight: "90г", composition: "Мука, яйца, крем", info: "Свежее" },
            { cat: "cat1", price: 420, weight: "110г", composition: "Шоколад, мука, масло", info: "Хит" },
            { cat: "cat2", price: 1200, weight: "800г", composition: "Мед, сметана, орехи", info: "На заказ" },
            { cat: "cat3", price: 180, weight: "120г", composition: "Дрожжи, лук, яйцо", info: "Пирожок" }
        ],
        cities: [
            { name: "Москва", enabled: true },
            { name: "СПб", enabled: true },
            { name: "Казань", enabled: true },
            { name: "Новосибирск", enabled: false },
            { name: "Екатеринбург", enabled: true },
            { name: "Сочи", enabled: false }
        ],
        checkboxes: [
            { label: "Перезвонить", enabled: true },
            { label: "Нужен чек", enabled: true },
            { label: "Подарочная упаковка", enabled: false }
        ],
        rememberMe: true
    };
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUI() {
    document.getElementById('store-title').textContent = appData.title;
    document.getElementById('info-text').textContent = appData.info;
    
    showCategories();
    showCities();
    showCheckboxes();
    showProducts(currentCat);
    
    if (appData.categories.length > 0) {
        const first = appData.categories[0];
        document.getElementById('store-header').style.backgroundImage = `url('${first.img}')`;
        document.getElementById('catalog').style.backgroundColor = first.bg;
    }
}

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
    
    if (cat) {
        document.getElementById('store-header').style.backgroundImage = `url('${cat.img}')`;
        document.getElementById('catalog').style.backgroundColor = cat.bg;
    }
    
    showCategories();
    showProducts(catId);
}

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

function showCities() {
    const container = document.getElementById('cities-container');
    container.innerHTML = '';
    
    appData.cities.forEach(city => {
        if (!city.enabled) return;
        
        const div = document.createElement('div');
        div.className = 'city-option';
        div.innerHTML = `
            <input type="radio" name="city" value="${city.name}">
            <label>${city.name}</label>
        `;
        container.appendChild(div);
    });
}

function showCheckboxes() {
    const container = document.getElementById('checkboxes-container');
    container.innerHTML = '';
    
    appData.checkboxes.forEach(cb => {
        if (!cb.enabled) return;
        
        const id = `cb-${cb.label.replace(/\s/g, '')}`;
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="${id}">
            <label for="${id}">${cb.label}</label>
        `;
        container.appendChild(div);
    });
    
    if (appData.rememberMe) {
        document.getElementById('remember-me-container').innerHTML = `
            <div class="checkbox-item">
                <input type="checkbox" id="remember-me">
                <label for="remember-me">Запомнить меня</label>
            </div>
        `;
    } else {
        document.getElementById('remember-me-container').innerHTML = '';
    }
}

// ==================== ЗАКАЗ ====================
document.getElementById('order-btn').onclick = function() {
    const citySelected = document.querySelector('input[name="city"]:checked');
    if (!citySelected) {
        alert('Пожалуйста, выберите город доставки');
        return;
    }
    
    const amount = Math.floor(Math.random() * 1500) + 500;
    const orderNum = '#' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    document.getElementById('payment-amount').textContent = amount;
    document.getElementById('order-number').textContent = orderNum;
    document.getElementById('payment-modal').style.display = 'flex';
};

// ==================== МОДАЛКА ====================
document.getElementById('close-modal').onclick = function() {
    document.getElementById('payment-modal').style.display = 'none';
};

document.getElementById('fake-pay-btn').onclick = function() {
    alert('Спасибо! Заказ оформлен');
    document.getElementById('payment-modal').style.display = 'none';
};

window.onclick = function(e) {
    const modal = document.getElementById('payment-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

// ==================== СТАРТ ====================
loadData();