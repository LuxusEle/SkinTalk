-- SkinTalk E-commerce Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cost DECIMAL(10,2) CHECK (cost >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category VARCHAR(100),
  image_url TEXT,
  badge VARCHAR(50),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories Table (Optional, for better organization)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  address JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'ST' || to_char(NOW(), 'YYYYMMDD') || '-' || floor(random() * 10000)::text,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL CHECK (final_amount >= 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  code VARCHAR(50) PRIMARY KEY,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount >= 0),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expiry_date DATE NOT NULL,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- 9. Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 10. Inventory Log (for tracking stock changes)
CREATE TABLE IF NOT EXISTS inventory_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  change_type VARCHAR(50) CHECK (change_type IN ('purchase', 'restock', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_id UUID, -- order_id or adjustment_id
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- INDEXES for Performance
-- =============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Promo codes indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_expiry_date ON promo_codes(expiry_date);

-- =============================================
-- FUNCTIONS and TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock INTO current_stock 
  FROM products 
  WHERE id = p_product_id FOR UPDATE;
  
  -- Check if sufficient stock
  IF current_stock >= p_quantity THEN
    -- Update stock
    UPDATE products 
    SET stock = stock - p_quantity 
    WHERE id = p_product_id;
    
    -- Log inventory change
    INSERT INTO inventory_log (
      product_id, 
      change_type, 
      quantity_change, 
      previous_quantity, 
      new_quantity, 
      notes
    ) VALUES (
      p_product_id,
      'purchase',
      -p_quantity,
      current_stock,
      current_stock - p_quantity,
      'Stock reduced due to purchase'
    );
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment product stock
CREATE OR REPLACE FUNCTION increment_product_stock(
  p_product_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT 'Stock restocked'
)
RETURNS VOID AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock INTO current_stock 
  FROM products 
  WHERE id = p_product_id FOR UPDATE;
  
  -- Update stock
  UPDATE products 
  SET stock = stock + p_quantity 
  WHERE id = p_product_id;
  
  -- Log inventory change
  INSERT INTO inventory_log (
    product_id, 
    change_type, 
    quantity_change, 
    previous_quantity, 
    new_quantity, 
    notes
  ) VALUES (
    p_product_id,
    'restock',
    p_quantity,
    current_stock,
    current_stock + p_quantity,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ST' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Function to update promo code usage
CREATE OR REPLACE FUNCTION update_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.promo_code IS NOT NULL THEN
    UPDATE promo_codes 
    SET used_count = used_count + 1 
    WHERE code = NEW.promo_code 
      AND (max_uses IS NULL OR used_count < max_uses);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 1. Products policies
-- Everyone can view products
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT USING (true);

-- Only authenticated users with admin role can modify products
CREATE POLICY "Only admins can insert products" 
  ON products FOR INSERT 
  WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Only admins can update products" 
  ON products FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Only admins can delete products" 
  ON products FOR DELETE 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- 2. User profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Cart items policies
-- Users can manage their own cart
CREATE POLICY "Users can view own cart" 
  ON cart_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" 
  ON cart_items FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Orders policies
-- Users can view their own orders
CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" 
  ON orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" 
  ON orders FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Admins can update orders
CREATE POLICY "Admins can update orders" 
  ON orders FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- 5. Order items policies
-- Users can view items from their own orders
CREATE POLICY "Users can view own order items" 
  ON order_items FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

-- 6. Reviews policies
-- Everyone can view approved reviews
CREATE POLICY "Everyone can view approved reviews" 
  ON reviews FOR SELECT 
  USING (is_approved = true OR auth.uid() = user_id);

-- Users can create reviews for products they purchased
CREATE POLICY "Users can create reviews" 
  ON reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = reviews.product_id
    AND o.user_id = auth.uid()
    AND o.status = 'delivered'
  ));

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" 
  ON reviews FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" 
  ON reviews FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- 7. Wishlist policies
-- Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist" 
  ON wishlist FOR ALL 
  USING (auth.uid() = user_id);

-- 8. Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" 
  ON categories FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" 
  ON categories FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- 9. Promo codes policies (public read, admin write)
CREATE POLICY "Active promo codes are viewable by everyone" 
  ON promo_codes FOR SELECT 
  USING (is_active = true AND expiry_date >= CURRENT_DATE);

CREATE POLICY "Only admins can manage promo codes" 
  ON promo_codes FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
  ('Skincare', 'skincare', 'Face and body skincare products'),
  ('Makeup', 'makeup', 'Cosmetics and makeup products'),
  ('Fragrance', 'fragrance', 'Perfumes and scented products'),
  ('Accessories', 'accessories', 'Beauty tools and accessories')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products (optional - can be migrated from existing data)
-- Note: These will be inserted via the migration script

-- Insert sample promo code
INSERT INTO promo_codes (code, discount_percent, expiry_date, title, description) VALUES
  ('WELCOME10', 10, '2026-12-31', 'Welcome Discount', '10% off for new customers'),
  ('SPRING25', 25, '2026-04-30', 'Spring Sale', '25% off on all skincare products')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- COMMENTS for Documentation
-- =============================================

COMMENT ON TABLE products IS 'Stores all product information including pricing and inventory';
COMMENT ON TABLE categories IS 'Product categories for organization and filtering';
COMMENT ON TABLE user_profiles IS 'Extended user information beyond basic auth';
COMMENT ON TABLE cart_items IS 'Shopping cart items for each user';
COMMENT ON TABLE orders IS 'Customer orders with status and payment information';
COMMENT ON TABLE order_items IS 'Individual items within each order';
COMMENT ON TABLE promo_codes IS 'Discount codes and promotions';
COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';
COMMENT ON TABLE wishlist IS 'User wishlists/saved items';
COMMENT ON TABLE inventory_log IS 'Audit log for inventory changes';

-- =============================================
-- VIEWS for Reporting
-- =============================================

-- View for product sales report
CREATE OR REPLACE VIEW product_sales_report AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.quantity * oi.price_at_time) as total_revenue,
  COUNT(DISTINCT o.id) as order_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
GROUP BY p.id, p.name, p.category, p.price
ORDER BY total_revenue DESC;

-- View for customer orders summary
CREATE OR REPLACE VIEW customer_orders_summary AS
SELECT 
  u.id as user_id,
  u.email,
  up.full_name,
  COUNT(o.id) as total_orders,
  SUM(o.final_amount) as total_spent,
  MIN(o.created_at) as first_order_date,
  MAX(o.created_at) as last_order_date
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
GROUP BY u.id, u.email, up.full_name
ORDER BY total_spent DESC NULLS LAST;

-- View for low stock alerts
CREATE OR REPLACE VIEW low_stock_alerts AS
SELECT 
  id,
  name,
  stock,
  category,
  CASE 
    WHEN stock = 0 THEN 'Out of Stock'
    WHEN stock <= 5 THEN 'Critical'
    WHEN stock <= 10 THEN 'Low'
    ELSE 'Adequate'
  END as stock_level
FROM products
WHERE stock <= 10
ORDER BY stock ASC;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$ 
BEGIN
  RAISE NOTICE 'SkinTalk database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the migration script to import existing data';
  RAISE NOTICE '2. Configure Supabase authentication settings';
  RAISE NOTICE '3. Set up storage bucket for product images';
  RAISE NOTICE '4. Test the RLS policies with different user roles';
END $$;