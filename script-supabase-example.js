// SkinTalk with Supabase Integration - Example Update
// This shows key changes needed in script.js

document.addEventListener('DOMContentLoaded', async function() {
    // =============================================
    // 1. Initialize Supabase
    // =============================================
    let supabase = null;
    
    // Check if Supabase is configured
    if (typeof SkinTalkSupabase !== 'undefined' && SkinTalkSupabase.isConfigured()) {
        supabase = SkinTalkSupabase.getClient();
        console.log('Supabase initialized successfully');
    } else {
        console.warn('Supabase not configured. Using localStorage fallback.');
        // Fallback to existing in-memory data
    }
    
    // =============================================
    // 2. Admin Panel Toggle (unchanged)
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
    // 3. Product Management - UPDATED FOR SUPABASE
    // =============================================
    const addProductBtn = document.getElementById('add-product');
    const productsGrid = document.querySelector('.products-grid');
    const totalProductsEl = document.getElementById('total-products');
    const totalValueEl = document.getElementById('total-value');
    
    // Load products from Supabase or fallback
    async function loadProducts() {
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading products:', error);
                    // Fallback to localStorage or empty array
                    return getLocalProducts();
                }
                
                console.log(`Loaded ${data.length} products from Supabase`);
                return data;
            } catch (error) {
                console.error('Failed to load products:', error);
                return getLocalProducts();
            }
        } else {
            return getLocalProducts();
        }
    }
    
    // Fallback to localStorage
    function getLocalProducts() {
        const localProducts = localStorage.getItem('skintalk_products');
        return localProducts ? JSON.parse(localProducts) : [];
    }
    
    // Save to localStorage as fallback
    function saveLocalProducts(products) {
        localStorage.setItem('skintalk_products', JSON.stringify(products));
    }
    
    // =============================================
    // 4. Update Product Functions for Supabase
    // =============================================
    async function addProductToSupabase(productData) {
        if (!supabase) {
            // Fallback to local storage
            const localProducts = getLocalProducts();
            const newId = localProducts.length > 0 ? Math.max(...localProducts.map(p => p.id)) + 1 : 1;
            const newProduct = { ...productData, id: newId };
            localProducts.push(newProduct);
            saveLocalProducts(localProducts);
            return newProduct;
        }
        
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
                    badge: productData.badge
                }])
                .select();
            
            if (error) throw error;
            
            console.log('Product added to Supabase:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Error adding product to Supabase:', error);
            // Fallback to localStorage
            return addProductToLocal(productData);
        }
    }
    
    // =============================================
    // 5. Update Inventory Stats for Supabase
    // =============================================
    async function updateInventoryStats() {
        if (supabase) {
            try {
                // Get total products count
                const { count: productCount, error: countError } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });
                
                if (countError) throw countError;
                
                // Get total inventory value
                const { data: products, error: productsError } = await supabase
                    .from('products')
                    .select('cost, stock');
                
                if (productsError) throw productsError;
                
                const totalValue = products.reduce((sum, p) => 
                    sum + (p.cost * p.stock), 0);
                
                // Update UI
                totalProductsEl.textContent = productCount || 0;
                totalValueEl.textContent = `$${(totalValue / 1000).toFixed(1)}k`;
                
            } catch (error) {
                console.error('Error updating inventory stats:', error);
                // Fallback to local calculation
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
    // 6. Load Existing Products for Admin Panel
    // =============================================
    async function loadExistingProducts() {
        const productsList = document.getElementById('products-list');
        if (!productsList) return;
        
        let products = [];
        
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                products = data;
            } catch (error) {
                console.error('Error loading products for admin:', error);
                products = getLocalProducts();
            }
        } else {
            products = getLocalProducts();
        }
        
        productsList.innerHTML = '';
        
        products.forEach(product => {
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
    // 7. Update Product CRUD Operations
    // =============================================
    async function editProduct(productId) {
        let product = null;
        
        if (supabase) {
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
                // Fallback to local
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
        
        if (supabase) {
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
                // Fallback to local delete
                deleteProductLocal(productId);
            }
        } else {
            deleteProductLocal(productId);
        }
        
        // Refresh UI
        loadExistingProducts();
        updateInventoryStats();
    }
    
    function deleteProductLocal(productId) {
        const localProducts = getLocalProducts();
        const updatedProducts = localProducts.filter(p => p.id !== productId);
        saveLocalProducts(updatedProducts);
        showNotification('Product deleted from local storage', 'success');
    }
    
    // =============================================
    // 8. Update Add Product Button Handler
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
            if (supabase) {
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
                }
            } else {
                // Local update
                updateProductLocal(editingId, productData);
            }
            
            // Reset button
            addProductBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
            delete addProductBtn.dataset.editing;
        } else {
            // Add new product
            const newProduct = await addProductToSupabase(productData);
            
            if (newProduct) {
                showNotification('Product added successfully!', 'success');
                
                // Add to products grid if on shop page
                addProductToGrid(newProduct);
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
    
    // =============================================
    // 9. Cart Management - Hybrid Approach
    // =============================================
    let cart = [];
    const cartCount = document.querySelector('.cart-count');
    
    // Load cart based on auth state
    async function loadCart() {
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Load user cart from Supabase
                await loadUserCart(user.id);
            } else {
                // Load guest cart from localStorage
                loadGuestCart();
            }
        } else {
            loadGuestCart();
        }
    }
    
    async function loadUserCart(userId) {
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select(`
                    quantity,
                    product_id,
                    products (*)
                `)
                .eq('user_id', userId);
            
            if (error) throw error;
            
            cart = data.map(item => ({
                ...item.products,
                quantity: item.quantity,
                product_id: item.product_id
            }));
            
            updateCartCount();
        } catch (error) {
            console.error('Error loading user cart:', error);
            loadGuestCart();
        }
    }
    
    function loadGuestCart() {
        const guestCart = localStorage.getItem('skintalk_guest_cart');
        cart = guestCart ? JSON.parse(guestCart) : [];
        updateCartCount();
    }
    
    function saveGuestCart() {
        localStorage.setItem('skintalk_guest_cart', JSON.stringify(cart));
    }
    
    // =============================================
    // 10. Initialize Application
    // =============================================
    async function initApp() {
        console.log('Initializing SkinTalk with Supabase...');
        
        // Load products for shop page
        if (productsGrid) {
            const products = await loadProducts();
            renderProductsGrid(products);
        }
        
        // Load admin data
        updateInventoryStats();
        loadExistingProducts();
        
        // Load cart
        await loadCart();
        
        // Initialize auth state listener if supabase is available
        if (supabase) {
            initAuthListener();
        }
        
        console.log('Application initialized');
    }
    
    // Start the application
    await initApp();
    
    // =============================================
    // Helper Functions (keep existing)
    // =============================================
    
    function showNotification(message, type) {
        // Keep existing notification implementation
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    function addProductToGrid(product) {
        // Keep existing product grid rendering logic
        // Update to use product data structure from Supabase
    }
    
    function renderProductsGrid(products) {
        // Render products to the grid
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '';
        
        products.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'glass-product-card animate-up';
            productCard.style.animationDelay = `${index * 0.1}s`;
            
            productCard.innerHTML = `
                <div class="product-img-wrap">
                    <img src="${product.image_url || product.image || 'default-product.jpg'}" alt="${product.name}">
                    ${product.badge ? `<span class="badge ${product.badge === 'NEW' ? 'new-badge' : 'sale-badge'}">${product.badge}</span>` : ''}
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">$${product.price?.toFixed(2) || '0.00'}</p>
                    <button class="btn-outline add-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            
            productsGrid.appendChild(productCard);
            
            // Add event listener
            const addToCartBtn = productCard.querySelector('.add-cart-btn');
            addToCartBtn.addEventListener('click', () => {
                addToCart(product.id);
            });
        });
    }
    
    async function addToCart(productId) {
        // Enhanced add to cart with Supabase support
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Add to Supabase cart
                try {
                    const { error } = await supabase
                        .from('cart_items')
                        .upsert({
                            user_id: user.id,
                            product_id: productId,
                            quantity: 1
                        }, {
                            onConflict: 'user_id,product_id'
                        });
                    
                    if (error) throw error;
                    
                    // Update local cart state
                    const existingItem = cart.find(item => item.id === productId || item.product_id === productId);
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        // Fetch product details
                        const { data: product } = await supabase
                            .from('products')
                            .select('*')
                            .eq('id', productId)
                            .single();
                        
                        if (product) {
                            cart.push({
                                ...product,
                                quantity: 1,
                                product_id: productId
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error adding to cart:', error);
                    // Fallback to local cart
                    addToCartLocal(productId);
                }
            } else {
                // Guest - use localStorage
                addToCartLocal(productId);
            }
        } else {
            // No Supabase - use localStorage
            addToCartLocal(productId);
        }
        
        updateCartCount();
        showNotification('Added to cart!', 'success');
    }
    
    function addToCartLocal(productId) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // Find product in loaded products
            const product = getLocalProducts().find(p => p.id === productId);
            if (product) {
                cart.push({ ...product, quantity: 1 });
            }
        }
        saveGuestCart();
    }
    
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // =============================================
    // Authentication Functions
    // =============================================
    function initAuthListener() {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (session) {
                // User signed in
                updateUIForLoggedInUser(session.user);
                // Migrate guest cart to user cart
                migrateGuestCartToUser(session.user.id);
            } else {
                // User signed out
                updateUIForLoggedOutUser();
                // Switch to guest cart
                loadGuestCart();
            }
        });
    }
    
    function updateUIForLoggedInUser(user) {
        // Update UI to show user is logged in
        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');
        
        if (authBtn) authBtn.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            const userName = userMenu.querySelector('#user-name');
            if (userName) {
                userName.textContent = user.user_metadata?.full_name || user.email;
            }
        }
    }
    
    function updateUIForLoggedOutUser() {
        // Update UI to show login option
        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');
        
        if (authBtn) authBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
    
    async function migrateGuestCartToUser(userId) {
        if (cart.length === 0) return;
        
        try {
            // Add each guest cart item to user cart in Supabase
            for (const item of cart) {
                await supabase
                    .from('cart_items')
                    .upsert({
                        user_id: userId,
                        product_id: item.id || item.product_id,
                        quantity: item.quantity
                    }, {
                        onConflict: 'user_id,product_id'
                    });
            }
            
            console.log('Guest cart migrated to user cart');
            
            // Clear guest cart
            cart = [];
            localStorage.removeItem('skintalk_guest_cart');
            
            // Reload user cart
            await loadUserCart(userId);
            
        } catch (error) {
            console.error('Error migrating guest cart:', error);
        }
    }
});

// =============================================
// Utility Functions for Local Storage Fallback
// =============================================
function addProductToLocal(productData) {
    const localProducts = JSON.parse(localStorage.getItem('skintalk_products') || '[]');
    const newId = localProducts.length > 0 ? Math.max(...localProducts.map(p => p.id)) + 1 : 1;
    const newProduct = { ...productData, id: newId };
    localProducts.push(newProduct);
    localStorage.setItem('skintalk_products', JSON.stringify(localProducts));
    return newProduct;
}

function updateProductLocal(productId, updates) {
    const localProducts = JSON.parse(localStorage.getItem('skintalk_products') || '[]');
    const index = localProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
        localProducts[index] = { ...localProducts[index], ...updates };
        localStorage.setItem('skintalk_products', JSON.stringify(localProducts));
    }
}

// =============================================
// Notes for Implementation:
// =============================================
/*
1. This is an example file showing how to integrate Supabase into script.js
2. Key changes:
   - Check for Supabase availability
   - Use async/await for Supabase operations
   - Implement fallback to localStorage when Supabase is unavailable
   - Update data structures to match Supabase schema
   - Add authentication handling
3. Actual implementation should:
   - Replace existing script.js gradually
   - Test each feature after migration
   - Keep fallback working during transition
*/