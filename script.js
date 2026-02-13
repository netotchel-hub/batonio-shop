// ==================== ССЫЛКИ НА ВАШИ ТАБЛИЦЫ ====================
const CONFIG_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5VjLVCGBNhsLDKt_kWcE1rOKZW_kppOC3r3MMZ8GCEzgPIjxxjFOFQZfmrBitJBuE9kuZAzEQ9JzX/pub?gid=0&single=true&output=csv';
const PRODUCTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5VjLVCGBNhsLDKt_kWcE1rOKZW_kppOC3r3MMZ8GCEzgPIjxxjFOFQZfmrBitJBuE9kuZAzEQ9JzX/pub?gid=1546882724&single=true&output=csv';

// ==================== ЗАПАСНЫЕ ДАННЫЕ (если таблицы не загрузятся) ====================
const FALLBACK_DATA = {
    title: "Батоньо",
    info: "🥖 Свежая выпечка",
    categories: [
        { id: "cat1", name: "Пирожные", img: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400", bg: "#fff5e6", color: "#E76F51" },
        { id: "cat2", name: "Торты", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", bg: "#f0e6d2", color: "#9C89B8" },
        { id: "cat3", name: "Выпечка", img: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=400", bg: "#e0f2e9", color: "#2A9D8F" }
    ],
    products: [
        { cat: "cat1", price: 350, weight: "90г", composition: "Мука, яйца, крем", info: "Свежее" },
        { cat: "cat1", price: 420, weight: "110г", composition: "Шоколад, мука, масло", info: "Хит" }
    ],
    cities: ["Москва", "СПб", "Казань"],
    checkboxes: ["Перезвонить", "Нужен чек"]
};

// ==================== ПЕРЕМЕННЫЕ ====================
let currentCat = "cat1";
let appData = FALLBACK_DATA; // Начинаем с запасных

// ==================== ЗАГРУЗКА ИЗ ТАБЛИЦ ====================
async function loadFromSheets() {
    try {
        // Показываем, что идет загрузка
        document.getElementById('info-text').textContent = "Загрузка данных...";
        
        // Загружаем config
        const configRes = await fetch(CONFIG_URL);
        const configText = await configRes.text();
        console.log("Config загружен:", configText);
        
        // Загружаем products
        const productsRes = await fetch(PRODUCTS_URL);
        const productsText = await productsRes.text();
        console.log("Products загружен:", productsText);
        
        // Парсим config (простой способ - разбиваем по строкам)
        const configLines = configText.split('\n');
        const newData = {
            title: "Батоньо",
            info: "Добро пожаловать!",
            categories: [],
            products: [],
            cities: [],
            checkboxes: []
        };
        
        // Обрабатываем config
        configLines.forEach(line => {
            if (line.includes('storeTitle')) newData.title = line.split('\t')[1] || newData.title;
            if (line.includes('infoText')) newData.info = line.split('\t')[1] || newData.info;
            
            // Категории (ищем строки с category1, category2 и т.д.)
            if (line.match(/category\d/)) {
                const parts = line.split('\t');
                const catNum = parts[0].replace('category', '');
                newData.categories.push({
                    id: `cat${catNum}`,
                    name: parts[1] || `Категория ${catNum}`,
                    img: parts[2] || appData.categories[0]?.img,
                    bg: parts[3] || "#f5f5f5",
                    color: parts[4] || "#E76F51"
                });
            }
            
            // Города
            if (line.match(/city\d/)) {
                const parts = line.split('\t');
                if (parts[1] && parts[2] === 'вкл') {
                    newData.cities.push(parts[1]);
                }
            }
            
            // Чекбоксы
            if (line.match(/checkbox\d/)) {
                const parts = line.split('\t');
                if (parts[1] && parts[2] === 'вкл') {
                    newData.checkboxes.push(parts[1]);
                }
            }
        });
        
        // Обрабатываем products
        const productLines = productsText.split('\n');
        productLines.forEach((line, index) => {
            if (index === 0) return; // Пропускаем заголовок
            const parts = line.split('\t');
            if (parts.length >= 5) {
                let catId = "cat1";
                if (parts[0] === "Торты") catId = "cat2";
                if (parts[0] === "Выпечка") catId = "cat3";
                
                newData.products.push({
                    cat: catId,
                    price: parseInt(parts[1]) || 0,
                    weight: parts[2] || "",
                    composition: parts[3] || "",
                    info: parts[4] || ""
                });
            }
        });
        
        // Если получили данные, обновляем appData
        if (newData.categories.length > 0) appData = newData;
        
        // Обновляем интерфейс
        updateUI();
        
    } catch (error) {
        console.log("Ошибка загрузки, используем запасные:", error);
        updateUI();
    }
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
        btn.onclick = () => {
            currentCat = cat.id;
            document.getElementById('store-header').style.backgroundImage = `url('${cat.img}')`;
            document.getElementById('catalog').style.backgroundColor = cat.bg;
            showCategories();
            showProducts(cat.id);
        };
        container.appendChild(btn);
    });
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
        const div = document.createElement('div');
        div.className = 'city-option';
        div.innerHTML = `
            <input type="radio" name="city" value="${city}">
            <label>${city}</label>
        `;
        container.appendChild(div);
    });
}

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
    
    document.getElementById('remember-me-container').innerHTML = `
        <div class="checkbox-item">
            <input type="checkbox" id="remember-me">
            <label for="remember-me">Запомнить меня</label>
        </div>
    `;
}

// ==================== ЗАКАЗ ====================
document.getElementById('order-btn').onclick = function() {
    const citySelected = document.querySelector('input[name="city"]:checked');
    if (!citySelected) {
        alert('Выберите город доставки');
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
    alert('Заказ оформлен!');
    document.getElementById('payment-modal').style.display = 'none';
};

window.onclick = function(e) {
    const modal = document.getElementById('payment-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

// ==================== СТАРТ ====================
loadFromSheets();