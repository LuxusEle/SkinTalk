document.addEventListener('DOMContentLoaded', async function() {
    // =============================================
    // 1. SUPABASE INITIALIZATION
    // =============================================
    let supabase = null;
    let isSupabaseAvailable = false;
    
    // Check if Supabase is configured and available
    if (typeof SkinTalkSupabase !== 'undefined' && SkinTalkSupabase.isConfigured()) {
        supabase = SkinTalkSupabase.getClient();
        isSupabaseAvailable = true;
        console.log('Supabase initialized successfully');
    } else {
        console.warn('Supabase not configured. Using localStorage fallback.');
    }
    
    // =============================================
    // 2. ADMIN PANEL TOGGLE (unchanged)
    // =============================================
    const adminToggle = document.querySelector('.admin-panel-toggle');
    const adminPanel = document.querySelector('.admin-panel');
    const closeAdmin = document.querySelector('.close-admin');
    
    adminToggle.addEventListener('click', () => {
        adminPanel.classList.add('active');
    });
    
    closeAdmin.addEventListener('click', () => {
        adminPanel.classList.remove('active');
    });
    
    // Close admin panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!adminPanel.contains(e.target) && !adminToggle.contains(e.target) && adminPanel.classList.contains('active')) {
            adminPanel.classList.remove('active');
        }
    });
    
    // =============================================
    // 3. PRODUCT MANAGEMENT - SUPABASE HYBRID
    // =============================================
    const addProductBtn = document.getElementById('add-product');
    const productsGrid = document.querySelector('.products-grid');
    const totalProductsEl = document.getElementById('total-products');
    const totalValueEl = document.getElementById('total-value');
    
    // Product data - will be loaded from Supabase or localStorage
    let products = [];
    let promoCodes = [];
    
    // =============================================
    // 4. DATA LOADING FUNCTIONS
    // =============================================
    
    // Load products from Supabase or fallback
    async function loadProducts() {
        if (isSupabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading products from Supabase:', error);
                    return getLocalProducts();
                }
                
                console.log(`Loaded ${data.length} products from Supabase`);
                products = data;
                saveLocalProducts(products); // Cache locally
                return products;
            } catch (error) {
                console.error('Failed to load products from Supabase:', error);
                return getLocalProducts();
            }
        } else {
            return getLocalProducts();
        }
    }
    
    // Load promo codes
    async function loadPromoCodes() {
        if (isSupabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase
                    .from('promo_codes')
                    .select('*')
                    .eq('is_active', true)
                    .gte('expiry_date', new Date().toISOString().split('T')[0]);
                
                if (error) {
                    console.error('Error loading promo codes:', error);
                    return getLocalPromoCodes();
                }
                
                promoCodes = data;
                saveLocalPromoCodes(promoCodes);
                return promoCodes;
            } catch (error) {
                console.error('Failed to load promo codes:', error);
                return getLocalPromoCodes();
            }
        } else {
            return getLocalPromoCodes();
        }
    }
    
    // Local storage fallback functions
    function getLocalProducts() {
        const localProducts = localStorage.getItem('skintalk_products');
        products = localProducts ? JSON.parse(localProducts) : [];
        
        // If no local products, use the default sample products
        if (products.length === 0) {
            products = [
                { id: 1, name: 'Glow Revival Serum', desc: 'Vitamin C & Hyaluronic Acid for radiant skin', price: 42.99, cost: 21.50, stock: 42, image: 'WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg', badge: 'BEST SELLER' },
                { id: 2, name: 'Barrier Repair Cream', desc: 'Ceramide-rich formula for skin barrier protection', price: 38.99, cost: 19.50, stock: 28, image: 'WhatsApp Image 2026-03-23 at 9.10.40 AM4.jpeg', badge: 'NEW' },
                { id: 3, name: 'Youthful Eyes Treatment', desc: 'Caffeine & peptides for brighter, firmer eye area', price: 52.99, cost: 26.50, stock: 15, image: 'WhatsApp Image 2026-03-23 at 9.10.39 AM2.jpeg', badge: null }
            ];
            saveLocalProducts(products);
        }
        
        return products;
    }
    
    function getLocalPromoCodes() {
        const localPromos = localStorage.getItem('skintalk_promocodes');
        promoCodes = localPromos ? JSON.parse(localPromos) : [];
        
        if (promoCodes.length === 0) {
            promoCodes = [
                { code: 'SPRING40', discount: 40, expiry: '2026-03-31', title: 'Spring Sale - Up to 40% Off' }
            ];
            saveLocalPromoCodes(promoCodes);
        }
        
        return promoCodes;
    }
    
    function saveLocalProducts(productsArray) {
        localStorage.setItem('skintalk_products', JSON.stringify(productsArray));
    }
    
    function saveLocalPromoCodes(promosArray) {
        localStorage.setItem('skintalk_promocodes', JSON.stringify(promosArray));
    }
    
    // =============================================
    // 5. INVENTORY STATS - UPDATED FOR SUPABASE
    // =============================================
    async function updateInventoryStats() {
        if (isSupabaseAvailable && supabase) {
            try {
                // Get total products count
                const { count: productCount, error: countError } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });
                
                if (countError) throw countError;
                
                // Get total inventory value
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('cost, stock');
                
                if (productsError) throw productsError;
                
                const totalValue = productsData.reduce((sum, p) => 
                    sum + (p.cost * p.stock), 0);
                
                // Update UI
                totalProductsEl.textContent = productCount || 0;
                totalValueEl.textContent = `$${(totalValue / 1000).toFixed(1)}k`;
                
            } catch (error) {
                console.error('Error updating inventory stats from Supabase:', error);
                updateInventoryStatsLocal();
            }
        } else {
            updateInventoryStatsLocal();
        }
    }
    
    function updateInventoryStatsLocal() {
        const localProducts = getLocalProducts();
        const totalValue = localProducts.reduce((sum, p) => 
            sum + (p.cost * p.stock), 0);
        
        totalProductsEl.textContent = localProducts.length;
        totalValueEl.textContent = `$${(totalValue / 1000).toFixed(1)}k`;
    }
    
    // =============================================
    // 6. LOAD EXISTING PRODUCTS FOR ADMIN PANEL
    // =============================================
    async function loadExistingProducts() {
        const productsList = document.getElementById('products-list');
        if (!productsList) return;
        
        let productsToDisplay = [];
        
        if (isSupabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                productsToDisplay = data;
            } catch (error) {
                console.error('Error loading products for admin:', error);
                productsToDisplay = getLocalProducts();
            }
        } else {
            productsToDisplay = getLocalProducts();
        }
        
        productsList.innerHTML = '';
        
        productsToDisplay.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-info">
                    <div class="product-name-small">${product.name}</div>
                    <div class="product-details">
                        <span>Price: $${product.price?.toFixed(2) || '0.00'}</span>
                        <span>Stock: ${product.stock || 0}</span>
                        <span>Cost: $${product.cost?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            productsList.appendChild(productItem);
            
            // Add event listeners
            const editBtn = productItem.querySelector('.edit-btn');
            const deleteBtn = productItem.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => {
                editProduct(product.id);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteProduct(product.id);
            });
        });
    }
    
    // =============================================
    // 7. PRODUCT CRUD OPERATIONS WITH SUPABASE
    // =============================================
    async function editProduct(productId) {
        let product = null;
        
        if (isSupabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                
                if (error) throw error;
                product = data;
            } catch (error) {
                console.error('Error fetching product for edit:', error);
                product = getLocalProducts().find(p => p.id === productId);
            }
        } else {
            product = getLocalProducts().find(p => p.id === productId);
        }
        
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }
        
        // Fill form with product data
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-cost').value = product.cost;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-desc').value = product.description || product.desc || '';
        
        // Change button text
        addProductBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
        addProductBtn.dataset.editing = productId;
        
        showNotification(`Editing ${product.name}`, 'success');
    }
    
    async function deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        if (isSupabaseAvailable && supabase) {
            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);
                
                if (error) throw error;
                
                showNotification('Product deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting product:', error);
                showNotification('Failed to delete product', 'error');
                deleteProductLocal(productId);
            }
        } else {
            deleteProductLocal(productId);
        }
        
        // Refresh UI
        loadExistingProducts();
        updateInventoryStats();
        // Reload products grid if on shop page
        if (productsGrid) {
            const updatedProducts = await loadProducts();
            renderProductsGrid(updatedProducts);
        }
    }
    
    function deleteProductLocal(productId) {
        const localProducts = getLocalProducts();
        const updatedProducts = localProducts.filter(p => p.id !== productId);
        saveLocalProducts(updatedProducts);
        showNotification('Product deleted from local storage', 'success');
    }
    
    // =============================================
    // 8. ADD/UPDATE PRODUCT HANDLER
    // =============================================
    addProductBtn.addEventListener('click', async () => {
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const cost = parseFloat(document.getElementById('product-cost').value);
        const stock = parseInt(document.getElementById('product-stock').value);
        const desc = document.getElementById('product-desc').value;
        
        if (!name || !price || !cost || !stock || !desc) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        
        const editingId = addProductBtn.dataset.editing;
        const productData = {
            name,
            description: desc,
            price,
            cost,
            stock,
            category: 'skincare'
        };
        
        if (editingId) {
            // Update existing product
            if (isSupabaseAvailable && supabase) {
                try {
                    const { error } = await supabase
                        .from('products')
                        .update(productData)
                        .eq('id', editingId);
                    
                    if (error) throw error;
                    
                    showNotification('Product updated successfully!', 'success');
                } catch (error) {
                    console.error('Error updating product:', error);
                    showNotification('Failed to update product', 'error');
                    updateProductLocal(editingId, productData);
                }
            } else {
                updateProductLocal(editingId, productData);
            }
            
            // Reset button
            addProductBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
            delete addProductBtn.dataset.editing;
        } else {
            // Add new product
            const newProduct = await addProductToDatabase(productData);
            
            if (newProduct) {
                showNotification('Product added successfully!', 'success');
                
                // Add to products grid if on shop page
                if (productsGrid) {
                    addProductToGrid(newProduct);
                }
            }
        }
        
        // Update UI
        updateInventoryStats();
        loadExistingProducts();
        
        // Clear form
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-cost').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-desc').value = '';
    });
    
    async function addProductToDatabase(productData) {
        if (isSupabaseAvailable && supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .insert([{
                        name: productData.name,
                        description: productData.description,
                        price: productData.price,
                        cost: productData.cost,
                        stock: productData.stock,
                        category: productData.category || 'skincare',
                        badge: null
                    }])
                    .select();
                
                if (error) throw error;
                
                console.log('Product added to Supabase:', data[0]);
                return data[0];
            } catch (error) {
                console.error('Error adding product to Supabase:', error);
                return addProductToLocal(productData);
            }
        } else {
            return addProductToLocal(productData);
        }
    }
    
    function addProductToLocal(productData) {
        const localProducts = getLocalProducts();
        const newId = localProducts.length > 0 ? Math.max(...localProducts.map(p => p.id)) + 1 : 1;
        const newProduct = { 
            ...productData, 
            id: newId,
            image: 'WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg',
            badge: null
        };
        localProducts.push(newProduct);
        saveLocalProducts(localProducts);
        return newProduct;
    }
    
    function updateProductLocal(productId, updates) {
        const localProducts = getLocalProducts();
        const index = localProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            localProducts[index] = { ...localProducts[index], ...updates };
            saveLocalProducts(localProducts);
        }
    }
    
    // =============================================
    // 9. PRODUCT GRID RENDERING
    // =============================================
    function addProductToGrid(product) {
        if (!productsGrid) return;
        
        const productCard = document.createElement('div');
        productCard.className = 'glass-product-card animate-up';
        productCard.innerHTML = `
            <div class="product-img-wrap">
                <img src="${product.image_url || product.image || 'WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg'}" alt="${product.name}">
                ${product.badge ? `<span class="badge ${product.badge === 'NEW' ? 'new-badge' : 'sale-badge'}">${product.badge}</span>` : ''}
            </div>
            <div class="product-details">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price?.toFixed(2) || '0.00'}</p>
                <button class="btn-outline add-cart-btn" data-id="${product.id}">Add to Cart</button>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
        
        // Add animation observer
        if (typeof observer !== 'undefined') {
            observer.observe(productCard);
        }
        
        // Add event listener
        const addToCartBtn = productCard.querySelector('.add-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            addToCart(product.id);
        });
    }
    
    function renderProductsGrid(productsArray) {
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '';
        
        productsArray.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'glass-product-card animate-up';
            productCard.style.animationDelay = `${index * 0.1}s`;
            
            productCard.innerHTML = `
                <div class="product-img-wrap">
                    <img src="${product.image_url || product.image || 'WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg'}" alt="${product.name}">
                    ${product.badge ? `<span class="badge ${product.badge === 'NEW' ? 'new-badge' : 'sale-badge'}">${product.badge}</span>` : ''}
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">$${product.price?.toFixed(2) || '0.00'}</p>
                    <button class="btn-outline add-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            
            productsGrid.appendChild(productCard);
            
            // Add animation observer
            if (typeof observer !== 'undefined') {
                observer.observe(productCard);
            }
            
            // Add event listener
            const addToCartBtn = productCard.querySelector('.add-cart-btn');
            addToCartBtn.addEventListener('click', () => {
                addToCart(product.id);
            });
        });
    }
    
    // =============================================
    // 10. CART FUNCTIONALITY (keep existing with localStorage)
    // =============================================
    let cart = [];
    const cartCount = document.querySelector('.cart-count');
    const cartBtn = document.querySelector('.cart-btn');
    const cartModal = document.querySelector('.cart-modal');
    const closeCart = document.querySelector('.close-cart');
    const continueShopping = document.querySelector('.continue-shopping');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Cart modal toggle (keep existing)
    cartBtn.addEventListener('click', () => {
        cartModal.classList.add('active');
        updateCartDisplay();
    });
    
    closeCart.addEventListener('click', () => {
        cartModal.classList.remove('active');
    });
    
    continueShopping.addEventListener('click', () => {
        cartModal.classList.remove('active');
    });
    
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        showNotification('Proceeding to checkout...', 'success');
        // In a real app, this would redirect to checkout page
    });
    
    // Close cart modal when clicking outside
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
        }
    });
    
    // Load cart from localStorage
    function loadCart() {
        const savedCart = localStorage.getItem('skintalk_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        updateCartCount();
    }
    
    function saveCart() {
        localStorage.setItem('skintalk_cart', JSON.stringify(cart));
    }
    
    function addToCart(productId) {
        // Find product in products array
        const product = products.find(p => p.id === productId) || 
                       getLocalProducts().find(p => p.id === productId);
        
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }
        
        // Check if product is in stock
        if (product.stock <= 0) {
            showNotification(`${product.name} is out of stock!`, 'error');
            return;
        }
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            // Check if we have enough stock
            if (existingItem.quantity >= product.stock) {
                showNotification(`Only ${product.stock} units available!`, 'error');
                return;
            }
            existingItem.quantity++;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        updateCartCount();
        saveCart();
        showNotification(`${product.name} added to cart!`, 'success');
    }
    
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    function updateCartDisplay() {
        const cartItems = document.querySelector('.cart-items');
        const totalAmount = document.querySelector('.total-amount');
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            totalAmount.textContent = '$0.00';
            return;
        }
        
        let itemsHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            itemsHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image_url || item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn plus">+</button>
                            <button class="remove-item"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartItems.innerHTML = itemsHTML;
        totalAmount.textContent = `$${total.toFixed(2)}`;
        
        // Add event listeners to cart items
        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const productId = parseInt(cartItem.dataset.id);
                updateCartQuantity(productId, -1);
            });
        });
        
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const productId = parseInt(cartItem.dataset.id);
                updateCartQuantity(productId, 1);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const productId = parseInt(cartItem.dataset.id);
                removeFromCart(productId);
            });
        });
    }
    
    function updateCartQuantity(productId, change) {
        const cartItem = cart.find(item => item.id === productId);
        if (!cartItem) return;
        
        const product = products.find(p => p.id === productId) || 
                       getLocalProducts().find(p => p.id === productId);
        if (!product) return;
        
        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        if (newQuantity > product.stock) {
            showNotification(`Only ${product.stock} units available!`, 'error');
            return;
        }
        
        cartItem.quantity = newQuantity;
        updateCartCount();
        saveCart();
        updateCartDisplay();
    }
    
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartCount();
        saveCart();
        updateCartDisplay();
        showNotification('Item removed from cart', 'success');
    }
    
    // =============================================
    // 11. NOTIFICATION SYSTEM (keep existing)
    // =============================================
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 500;
                    z-index: 1003;
                    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                    box-shadow: var(--glass-shadow);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .notification.success {
                    background: rgba(76, 175, 80, 0.85);
                }
                
                .notification.error {
                    background: rgba(244, 67, 54, 0.85);
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // =============================================
    // 12. INITIALIZE APPLICATION
    // =============================================
    async function initApp() {
        console.log('Initializing SkinTalk with Supabase integration...');
        
        // Load products
        products = await loadProducts();
        promoCodes = await loadPromoCodes();
        
        // Render products grid if on shop page
        if (productsGrid) {
            renderProductsGrid(products);
        }
        
        // Load admin data
        updateInventoryStats();
        loadExistingProducts();
        
        // Load cart
        loadCart();
        
        console.log('Application initialized successfully');
    }
    
    // Start the application
    await initApp();
});

// =============================================
// 13. ANIMATION OBSERVER (keep existing from index.html)
// =============================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-up, .animate-fade').forEach(el => {
    if(el.classList.contains('animate-up')) {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    observer.observe(el);
});