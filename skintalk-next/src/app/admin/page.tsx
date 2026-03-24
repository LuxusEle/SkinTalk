'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faShoppingBag, faDollarSign, faBox, faChartLine, faSignOutAlt, faPlus, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { getSupabase, isAdminEmail, getAdminClient } from '@/lib/supabase';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    created_at: string;
}

interface Order {
    id: string;
    user_id: string;
    items: { name: string; price: number; image: string }[];
    total: number;
    status: string;
    created_at: string;
}

interface UserProfile {
    id: string;
    email: string;
    created_at: string;
    total_spent?: number;
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users'>('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 });
    
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('General');
    const [newProductImage, setNewProductImage] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    const checkAuth = async () => {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser({ id: user.id, email: user.email || '', created_at: '' });
            if (isAdminEmail(user.email)) {
                setIsAdmin(true);
            } else {
                router.push('/');
            }
        } else {
            router.push('/');
        }
        setLoading(false);
    };

    const loadData = async () => {
        const supabase = getSupabase();
        const adminClient = getAdminClient();

        const [productsRes, ordersRes, usersRes] = await Promise.all([
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            adminClient?.from('orders').select('*').order('created_at', { ascending: false }),
            supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
        ]);

        if (productsRes.data) setProducts(productsRes.data);
        if (ordersRes?.data) setOrders(ordersRes.data);
        
        if (usersRes.data && ordersRes?.data) {
            const usersWithSpent = usersRes.data.map(user => {
                const userOrders = ordersRes.data?.filter(o => o.user_id === user.id) || [];
                const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                return { ...user, total_spent: totalSpent };
            });
            setUsers(usersWithSpent);
        }

        const totalRevenue = ordersRes?.data?.reduce((sum, o) => sum + o.total, 0) || 0;
        setStats({
            totalRevenue,
            totalOrders: ordersRes?.data?.length || 0,
            totalUsers: usersRes.data?.length || 0,
            totalProducts: productsRes.data?.length || 0
        });
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleAddProduct = async () => {
        if (!newProductName || !newProductPrice) {
            alert('Please enter product name and price');
            return;
        }
        const adminClient = getAdminClient();
        if (!adminClient) {
            alert('Admin access not configured');
            return;
        }

        setUploading(true);
        let imageUrl = '/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg';

        if (newProductImage) {
            const fileExt = newProductImage.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const { error: uploadError } = await adminClient.storage
                .from('products')
                .upload(fileName, newProductImage);

            if (uploadError) {
                alert('Error uploading image: ' + uploadError.message);
                setUploading(false);
                return;
            }

            const { data: { publicUrl } } = adminClient.storage
                .from('products')
                .getPublicUrl(fileName);
            imageUrl = publicUrl;
        }

        const { error } = await adminClient.from('products').insert({
            name: newProductName,
            price: parseFloat(newProductPrice),
            image: imageUrl,
            category: newProductCategory
        });

        if (error) {
            alert('Error adding product: ' + error.message);
        } else {
            setNewProductName('');
            setNewProductPrice('');
            setNewProductImage(null);
            loadData();
            alert('Product added successfully!');
        }
        setUploading(false);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const adminClient = getAdminClient();
        if (!adminClient) return;
        
        const { error } = await adminClient.from('products').delete().eq('id', productId);
        if (!error) {
            loadData();
            alert('Product deleted!');
        }
    };

    const handleStatusChange = async (orderId: string, status: string) => {
        const adminClient = getAdminClient();
        if (!adminClient) return;
        
        const { error } = await adminClient.from('orders').update({ status }).eq('id', orderId);
        if (!error) loadData();
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!isAdmin) return null;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h2>SkinTalk Admin</h2>
                    <p>Merchant Dashboard</p>
                </div>
                <nav className="admin-nav">
                    <button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <FontAwesomeIcon icon={faChartLine} /> Dashboard
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        <FontAwesomeIcon icon={faBox} /> Products
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <FontAwesomeIcon icon={faShoppingBag} /> Orders
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <FontAwesomeIcon icon={faUsers} /> Users
                    </button>
                </nav>
                <div className="admin-sidebar-footer">
                    <button className="admin-nav-item" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Dashboard Overview</h1>
                        <div className="admin-stats-grid">
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faDollarSign} /></div>
                                <div className="stat-content">
                                    <h3>Total Revenue</h3>
                                    <p className="stat-value">${stats.totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faShoppingBag} /></div>
                                <div className="stat-content">
                                    <h3>Total Orders</h3>
                                    <p className="stat-value">{stats.totalOrders}</p>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
                                <div className="stat-content">
                                    <h3>Total Users</h3>
                                    <p className="stat-value">{stats.totalUsers}</p>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faBox} /></div>
                                <div className="stat-content">
                                    <h3>Total Products</h3>
                                    <p className="stat-value">{stats.totalProducts}</p>
                                </div>
                            </div>
                        </div>
                        
                        <h2 style={{ marginTop: '2rem' }}>Recent Orders</h2>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 5).map(order => (
                                        <tr key={order.id}>
                                            <td>{order.id.slice(0, 8)}...</td>
                                            <td>{order.items?.length || 0} items</td>
                                            <td>${order.total.toFixed(2)}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'products' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Product Management</h1>
                        
                        <div className="admin-card">
                            <h3><FontAwesomeIcon icon={faPlus} /> Add New Product</h3>
                            <div className="admin-form-grid">
                                <input type="text" placeholder="Product Name" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                                <input type="number" placeholder="Price" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                                <select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}>
                                    <option value="General">General</option>
                                    <option value="Serums">Serums</option>
                                    <option value="Moisturizers">Moisturizers</option>
                                    <option value="Cleansers">Cleansers</option>
                                </select>
                                <div className="file-input-wrapper">
                                    <label><FontAwesomeIcon icon={faImage} /> Upload Image</label>
                                    <input type="file" accept="image/*" onChange={(e) => setNewProductImage(e.target.files?.[0] || null)} />
                                </div>
                            </div>
                            <button className="admin-btn primary" onClick={handleAddProduct} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Add Product'}
                            </button>
                        </div>

                        <h2 style={{ marginTop: '2rem' }}>All Products</h2>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id}>
                                            <td><img src={product.image} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} /></td>
                                            <td>{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>${product.price.toFixed(2)}</td>
                                            <td>
                                                <button className="admin-btn danger" onClick={() => handleDeleteProduct(product.id)}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Orders Management</h1>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.id.slice(0, 8)}...</td>
                                            <td>{order.user_id.slice(0, 8)}...</td>
                                            <td>{order.items?.map((item, i) => <div key={i}>{item.name}</div>)}</td>
                                            <td>${order.total.toFixed(2)}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} style={{ padding: '4px' }}>
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>User Management</h1>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Joined</th>
                                        <th>Total Spent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.email}</td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>${(user.total_spent || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
