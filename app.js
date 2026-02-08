// Конфигурация
const API_URL = 'https://script.google.com/macros/s/AKfycbxAWkPmzxAk2HnnXJYVA9QdwyGM3Sq8Zd6esTH-wYnEYEfBPpCa24TJyafUy2jfPQvY/exec'; // Замените на ваш URL из Этапа 3.3

// Состояние приложения
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('batonio_cart')) || [],
    categories: [],
    currentCategory: 'все',
    settings: {},
    customerData: JSON.parse(localStorage.getItem('batonio_customer')) || {},
    isShopWorking: true,
    currentProduct: null,
    currentQty: 1
};

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.setText("Открыть корзину");

// DOM элементы
const elements = {
    shopName: document.getElementById('shopName'),
    deliveryInfo: document.getElementById('deliveryInfo'),
    categoriesContainer: document.getElementById('categoriesContainer'),
    productsContainer: document.getElementById('productsContainer'),
    cartFab: document.getElementById('cartFab'),
    cartCount: document.getElementById('cartCount'),
    productModal:

