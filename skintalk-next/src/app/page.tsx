'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingBag, faTimes, faBars, faMagic } from '@fortawesome/free-solid-svg-icons';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

const products = [
    { id: 1, name: "Radiance Vitamin C Serum", price: 45, img: "/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg", cat: "Serums" },
    { id: 2, name: "Silk Moisture Face Cream", price: 55, img: "/WhatsApp Image 2026-03-23 at 9.10.40 AM.jpeg", cat: "Moisturizers" },
    { id: 3, name: "Purifying Gel Cleanser", price: 28, img: "/WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg", cat: "Cleansers" },
    { id: 4, name: "Overnight Repair Mask", price: 62, img: "/WhatsApp Image 2026-03-23 at 9.10.40 AM4.jpeg", cat: "Masks" },
    { id: 5, name: "SPF 50 Daily Protection", price: 38, img: "/WhatsApp Image 2026-03-23 at 9.10.39 AM2.jpeg", cat: "Sunscreen" },
    { id: 6, name: "Balancing Facial Toner", price: 32, img: "/WhatsApp Image 2026-03-23 at 9.10.41 AM.jpeg", cat: "Toners" }
];

interface CartItem {
    id: number;
    name: string;
    price: number;
    img: string;
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, delay, ease: [0.25, 0.25, 0.25, 0.75] }}
        >
            {children}
        </motion.div>
    );
}

function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
    return (
        <motion.div ref={ref} style={{ y, width: '100%', height: '100%' }} className={className}>
            <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </motion.div>
    );
}

export default function Home() {
    const [scrolled, setScrolled] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [theme, setTheme] = useState('elegant');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<typeof products>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const addToCart = (product: typeof products[0]) => {
        setCart([...cart, product]);
        setCartOpen(true);
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

    useEffect(() => {
        if (theme === 'glow') {
            document.documentElement.style.setProperty('--bg-color', '#fffdfd');
            document.documentElement.style.setProperty('--accent', '#ff8fa3');
        } else {
            document.documentElement.style.setProperty('--bg-color', '#ffffff');
            document.documentElement.style.setProperty('--accent', '#e886a3');
        }
    }, [theme]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered);
            setShowSearch(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const closeSearch = () => {
        setShowSearch(false);
        setSearchQuery('');
    };

    return (
        <>
            {/* Header */}
            <motion.header 
                className={`header ${scrolled ? 'scrolled' : ''}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="container nav-content">
                    <div className="logo">
                        <img src="/Gemini_Generated_Image_al4h3ual4h3ual4h.png" alt="SkinTalk" style={{ height: 50, objectFit: 'contain' }} />
                        <div className="logo-tagline-container">
                            <span className="logo-tagline">PURE</span>
                            <span className="logo-tagline">CLEAN</span>
                            <span className="logo-tagline">ELEGANT</span>
                        </div>
                    </div>
                    <nav className="nav-links">
                        <a href="#home" className="nav-link">Home</a>
                        <a href="#shop" className="nav-link">Shop</a>
                        <a href="#collections" className="nav-link">Collections</a>
                        <a href="#about" className="nav-link">Our Story</a>
                    </nav>
                    <div className="nav-actions">
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Search products..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="search-input"
                            />
                            <button className="icon-btn search-trigger" onClick={handleSearch}>
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>
                        <button className="icon-btn cart-trigger" onClick={() => setCartOpen(true)}>
                            <FontAwesomeIcon icon={faShoppingBag} />
                            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                        </button>
                        <button className="icon-btn mobile-menu-trigger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <nav className="mobile-nav">
                    <a href="#home" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</a>
                    <a href="#shop" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Shop</a>
                    <a href="#collections" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Collections</a>
                    <a href="#about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Our Story</a>
                </nav>
            </div>

            {/* Hero */}
            <section className="hero" id="home">
                <div className="container" style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
                    <div className="hero-content">
                        <FadeIn>
                            <p className="hero-subtitle">Premium Skincare</p>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <h1 className="hero-title">Radiate<br />Confidence</h1>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2.5rem', maxWidth: 450 }}>
                                Experience the perfect blend of minimalist design and pure ingredients. Discover your glow with SkinTalk.
                            </p>
                        </FadeIn>
                        <FadeIn delay={0.3}>
                            <a href="#shop" className="hero-cta">Shop the Collection</a>
                        </FadeIn>
                    </div>
                    <div className="hero-image-pane">
                        <ParallaxImage src="/skintalk-hero.png" alt="Lady holding SkinTalk product" className="hero-img" />
                    </div>
                </div>
            </section>

            {/* Collections */}
            <section className="collections" id="collections">
                <div className="container">
                    <FadeIn>
                        <h2 className="section-title">Shop by Concern</h2>
                    </FadeIn>
                    <div className="collections-grid">
                        {[
                            { img: "/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg", title: "Serums", subtitle: "Targeted Treatment" },
                            { img: "/WhatsApp Image 2026-03-23 at 9.10.40 AM.jpeg", title: "Moisturizers", subtitle: "Deep Hydration" },
                            { img: "/WhatsApp Image 2026-03-23 at 9.10.40 AM2.jpeg", title: "Cleansers", subtitle: "Pure Reset" }
                        ].map((item, index) => (
                            <FadeIn key={index} delay={index * 0.15}>
                                <motion.div 
                                    className="collection-card"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <img src={item.img} alt={item.title} className="collection-img" />
                                    <div className="collection-overlay">
                                        <h2 className="collection-title">{item.title}</h2>
                                        <p>{item.subtitle}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="products" id="shop">
                <div className="container">
                    <FadeIn>
                        <h2 className="section-title">New Arrivals</h2>
                    </FadeIn>
                    <div className="products-grid">
                        {products.map((product, index) => (
                            <FadeIn key={product.id} delay={index * 0.1}>
                                <motion.div 
                                    className="product-card"
                                    whileHover={{ y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="product-image-container">
                                        <img src={product.img} alt={product.name} className="product-img" />
                                        <motion.button 
                                            className="quick-add" 
                                            onClick={() => addToCart(product)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Add to Bag
                                        </motion.button>
                                    </div>
                                    <div className="product-info">
                                        <h3>{product.name}</h3>
                                        <p className="product-price">${product.price.toFixed(2)}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* About */}
            <section className="about" id="about" style={{ padding: '120px 0', background: '#fffcfd', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: 800 }}>
                    <FadeIn>
                        <h2 className="section-title">The SkinTalk Promise</h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p style={{ fontSize: '1.1rem', color: '#777', marginBottom: '2rem' }}>
                            Derived from nature, perfected by science. SkinTalk is committed to providing clean, effective skincare that respects your skin and the planet. No fillers, no toxins—just pure results.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--accent)' }}>
                            "Your skin is your best accessory. Take care of it."
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <span className="logo-text">SkinTalk</span>
                            <span className="logo-tagline">Clean Beauty Ethics</span>
                        </div>
                        <p style={{ color: '#777', fontSize: '0.95rem', maxWidth: 350 }}>
                            Redefining the standard of clean beauty with products that deliver visible results without compromise.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Concerns</h4>
                        <ul>
                            <li><a href="#">Anti-Aging</a></li>
                            <li><a href="#">Brightening</a></li>
                            <li><a href="#">Hydration</a></li>
                            <li><a href="#">Acne-Prone</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#">Shipping Policy</a></li>
                            <li><a href="#">Sustainability</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Stockists</a></li>
                        </ul>
                    </div>
                    <div className="footer-newsletter">
                        <h4>Stay Radiant</h4>
                        <p>Sign up for exclusive beauty tips and early access to drops.</p>
                        <div className="newsletter-form">
                            <input type="email" placeholder="Email Address" />
                            <button className="hero-cta">Join</button>
                        </div>
                    </div>
                </div>
                <div className="container footer-bottom">
                    &copy; 2026 SkinTalk Cosmetics. Artfully Crafted.
                </div>
            </footer>

            {/* Cart Sidebar */}
            <div className={`sidebar-overlay ${cartOpen || adminOpen ? 'active' : ''}`} onClick={() => { setCartOpen(false); setAdminOpen(false); }}></div>
            <div className={`sidebar ${cartOpen ? 'active' : ''}`} id="cart-sidebar">
                <div className="sidebar-header">
                    <h3>Your Beauty Bag</h3>
                    <button className="icon-btn close-cart" onClick={() => setCartOpen(false)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="sidebar-content">
                    {cart.length === 0 ? (
                        <p className="empty-cart">Your bag is empty.</p>
                    ) : (
                        cart.map((item, index) => (
                            <div className="cart-item" key={index}>
                                <img src={item.img} alt={item.name} className="cart-item-img" />
                                <div className="cart-item-info">
                                    <h4>{item.name}</h4>
                                    <p>${item.price.toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(index)}>Remove</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="sidebar-footer">
                        <div className="cart-total">
                            <span>Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <button className="hero-cta" style={{ width: '100%' }}>Proceed to Checkout</button>
                    </div>
                )}
            </div>

            {/* Admin Panel */}
            <div className={`sidebar ${adminOpen ? 'active' : ''}`} id="admin-panel">
                <div className="sidebar-header">
                    <h3>Merchant Dashboard</h3>
                    <button className="icon-btn close-admin" onClick={() => setAdminOpen(false)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="sidebar-content">
                    <div className="admin-section">
                        <h4>Global Settings</h4>
                        <div className="form-group">
                            <label>Store Personality</label>
                            <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #eee' }}>
                                <option value="elegant">Elegant (Soft Rose)</option>
                                <option value="glow">Glow (Radiant Pink)</option>
                            </select>
                        </div>
                    </div>
                    <div className="admin-section">
                        <h4>Product Management</h4>
                        <div className="admin-product-form">
                            <p>Add a new skincare essential to the catalog.</p>
                            <input type="text" placeholder="Item Name" style={{ width: '100%', padding: '10px', border: '1px solid #eee', marginBottom: '0.5rem' }} />
                            <input type="number" placeholder="Price" style={{ width: '100%', padding: '10px', border: '1px solid #eee', marginBottom: '1rem' }} />
                            <button className="hero-cta" style={{ width: '100%', padding: '0.8rem', fontSize: '0.75rem' }}>Add Product</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Trigger */}
            <motion.button 
                className="admin-trigger" 
                id="admin-trigger" 
                onClick={() => setAdminOpen(true)}
                whileHover={{ rotate: 45, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <FontAwesomeIcon icon={faMagic} />
            </motion.button>

            {/* Search Results Modal */}
            {showSearch && (
                <div className="search-modal-overlay" onClick={closeSearch}>
                    <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="search-modal-header">
                            <h3>Search Results</h3>
                            <button className="icon-btn" onClick={closeSearch}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="search-results">
                            {searchResults.length > 0 ? (
                                <div className="products-grid">
                                    {searchResults.map((product) => (
                                        <div className="product-card" key={product.id}>
                                            <div className="product-image-container">
                                                <img src={product.img} alt={product.name} className="product-img" />
                                                <button className="quick-add" onClick={() => { addToCart(product); closeSearch(); }}>Add to Bag</button>
                                            </div>
                                            <div className="product-info">
                                                <h3>{product.name}</h3>
                                                <p className="product-price">${product.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No products found for "{searchQuery}"</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}