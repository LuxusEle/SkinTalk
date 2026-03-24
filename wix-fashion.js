/* wix-fashion.js - Core Logic */

// Product Data (Mock)
const products = [
    { id: 1, name: "Premium Linen Shirt", price: 89, img: "WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg" },
    { id: 2, name: "Silk Midi Dress", price: 145, img: "WhatsApp Image 2026-03-23 at 9.10.40 AM.jpeg" },
    { id: 3, name: "Tapered Cotton Trousers", price: 110, img: "WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg" },
    { id: 4, name: "Minimalist Leather Sandals", price: 75, img: "WhatsApp Image 2026-03-23 at 9.10.40 AM4.jpeg" }
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
    cartSidebar.classList.toggle('active');
    adminPanel.classList.remove('active');
});

closeCart.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
});

adminTrigger.addEventListener('click', () => {
    adminPanel.classList.toggle('active');
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
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #999; margin-top: 2rem;">Your bag is empty.</p>';
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
                    <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem;">${item.name}</h4>
                    <p style="color: #666; font-size: 0.8rem;">$${item.price.toFixed(2)}</p>
                    <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff4444; font-size: 0.7rem; cursor: pointer; margin-top: 0.5rem; text-decoration: underline;">Remove</button>
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

// Mobile Menu (Simple toggle for demo)
const mobileMenuTrigger = document.querySelector('.mobile-menu-trigger');
mobileMenuTrigger.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    const isVisible = navLinks.style.display === 'flex';
    
    if (!isVisible) {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '60px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'white';
        navLinks.style.padding = '2rem';
        navLinks.style.borderBottom = '1px solid #eee';
    } else {
        navLinks.style.display = 'none';
    }
});

// Advanced Feature: Live Search
const searchTrigger = document.querySelector('.search-trigger');
searchTrigger.addEventListener('click', () => {
    const searchTerm = prompt("Search for products:");
    if (searchTerm) {
        filterProducts(searchTerm);
    } else if (searchTerm === "") {
        renderProducts(products); // Reset
    }
});

function filterProducts(term) {
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(term.toLowerCase())
    );
    renderProducts(filtered);
}

function renderProducts(productList) {
    const productGrid = document.getElementById('product-grid');
    if (productList.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No products found.</p>';
        return;
    }
    
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

// Advanced Feature: Merchant Settings (Live Update)
const storeNameInput = document.querySelector('#admin-panel input[placeholder="Product Name"]'); // Using as mock Store Name
const themeSelect = document.querySelector('#admin-panel select');

themeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'dark') {
        document.documentElement.style.setProperty('--bg-color', '#111111');
        document.documentElement.style.setProperty('--text-main', '#ffffff');
        document.documentElement.style.setProperty('--secondary-bg', '#1a1a1a');
        document.documentElement.style.setProperty('--border-color', '#333333');
        document.querySelector('.header').style.background = 'rgba(17, 17, 17, 0.95)';
    } else {
        document.documentElement.style.setProperty('--bg-color', '#ffffff');
        document.documentElement.style.setProperty('--text-main', '#111111');
        document.documentElement.style.setProperty('--secondary-bg', '#f9f9f9');
        document.documentElement.style.setProperty('--border-color', '#eeeeee');
        document.querySelector('.header').style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Initialize
updateCart();
renderProducts(products);
