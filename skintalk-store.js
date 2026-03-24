/* skintalk-store.js - Beauty Logic */

// Product Data (Skincare)
const products = [
    { id: 1, name: "Radiance Vitamin C Serum", price: 45, img: "WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg", cat: "Serums" },
    { id: 2, name: "Silk Moisture Face Cream", price: 55, img: "WhatsApp Image 2026-03-23 at 9.10.40 AM.jpeg", cat: "Moisturizers" },
    { id: 3, name: "Purifying Gel Cleanser", price: 28, img: "WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg", cat: "Cleansers" },
    { id: 4, name: "Overnight Repair Mask", price: 62, img: "WhatsApp Image 2026-03-23 at 9.10.40 AM4.jpeg", cat: "Masks" },
    { id: 5, name: "SPF 50 Daily Protection", price: 38, img: "WhatsApp Image 2026-03-23 at 9.10.39 AM2.jpeg", cat: "Sunscreen" },
    { id: 6, name: "Balancing Facial Toner", price: 32, img: "WhatsApp Image 2026-03-23 at 9.10.41 AM.jpeg", cat: "Toners" }
];

let cart = [];

// DOM Elements
const header = document.querySelector('.header');
const cartSidebar = document.getElementById('cart-sidebar');
const adminPanel = document.getElementById('admin-panel');
const cartTrigger = document.querySelector('.cart-trigger');
const closeCart = document.querySelector('.close-cart');
const adminTrigger = document.getElementById('admin-trigger');
const closeAdmin = document.querySelector('.close-admin');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalLabel = document.getElementById('cart-total');
const productGrid = document.getElementById('product-grid');

// Scroll Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Sidebar Toggles
cartTrigger.addEventListener('click', () => {
    cartSidebar.classList.add('active');
    adminPanel.classList.remove('active');
});

closeCart.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
});

adminTrigger.addEventListener('click', () => {
    adminPanel.classList.add('active');
    cartSidebar.classList.remove('active');
});

closeAdmin.addEventListener('click', () => {
    adminPanel.classList.remove('active');
});

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCart();
        openCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function updateCart() {
    cartCount.innerText = cart.length;
    renderCart();
}

function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #999; margin-top: 3rem;">Your bag is empty.</p>';
        cartTotalLabel.innerText = '$0.00';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        html += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                <div style="flex: 1;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 0.3rem;">${item.name}</h4>
                    <p style="color: var(--accent); font-size: 0.85rem; font-weight: 500;">$${item.price.toFixed(2)}</p>
                    <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #aaa; font-size: 0.7rem; cursor: pointer; margin-top: 0.5rem; text-decoration: underline;">Remove</button>
                </div>
            </div>
        `;
    });
    cartItemsContainer.innerHTML = html;
    cartTotalLabel.innerText = `$${total.toFixed(2)}`;
}

function openCart() {
    cartSidebar.classList.add('active');
}

// Product Rendering
function renderProducts(productList) {
    if (!productGrid) return;
    
    productGrid.innerHTML = productList.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image-container">
                <img src="${p.img}" alt="${p.name}" class="product-img">
                <button class="quick-add" onclick="addToCart(${p.id})">Add to Bag</button>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="product-price">$${p.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

// Advanced Feature: Live Search
const searchTrigger = document.querySelector('.search-trigger');
searchTrigger.addEventListener('click', () => {
    const searchTerm = prompt("Search for skincare essentials:");
    if (searchTerm !== null) {
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderProducts(filtered);
    }
});

// Merchant Settings (Live Update)
const themeSelect = document.querySelector('#admin-panel select');
themeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'glow') {
        document.documentElement.style.setProperty('--bg-color', '#fffdfd');
        document.documentElement.style.setProperty('--accent', '#ff8fa3');
    } else {
        document.documentElement.style.setProperty('--bg-color', '#ffffff');
        document.documentElement.style.setProperty('--accent', '#e886a3');
    }
});

// Initialize
updateCart();
renderProducts(products);
