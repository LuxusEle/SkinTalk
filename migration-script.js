// Migration Script for SkinTalk
// Migrates existing in-memory data to Supabase
// Run this in browser console after setting up Supabase

// Existing data from script.js
const existingProducts = [
  {
    id: 1,
    name: 'Glow Revival Serum',
    desc: 'Vitamin C & Hyaluronic Acid for radiant skin',
    price: 42.99,
    cost: 21.50,
    stock: 42,
    image: 'WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg',
    badge: 'BEST SELLER'
  },
  {
    id: 2,
    name: 'Barrier Repair Cream',
    desc: 'Ceramide-rich formula for skin barrier protection',
    price: 38.99,
    cost: 19.50,
    stock: 28,
    image: 'WhatsApp Image 2026-03-23 at 9.10.40 AM4.jpeg',
    badge: 'NEW'
  },
  {
    id: 3,
    name: 'Youthful Eyes Treatment',
    desc: 'Caffeine & peptides for brighter, firmer eye area',
    price: 52.99,
    cost: 26.50,
    stock: 15,
    image: 'WhatsApp Image 2026-03-23 at 9.10.39 AM2.jpeg',
    badge: null
  }
]

const existingPromoCodes = [
  {
    code: 'SPRING40',
    discount: 40,
    expiry: '2026-03-31',
    title: 'Spring Sale - Up to 40% Off'
  }
]

// Hardcoded product images mapping
const productImageMap = {
  1: 'WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg',
  2: 'WhatsApp Image 2026-03-23 at 9.10.40 AM4.jpeg',
  3: 'WhatsApp Image 2026-03-23 at 9.10.39 AM2.jpeg'
}

// Check if Supabase is available
function checkSupabase() {
  if (typeof window !== 'undefined' && window.SkinTalkSupabase) {
    const supabase = window.SkinTalkSupabase.getClient()
    if (supabase && window.SkinTalkSupabase.isConfigured()) {
      return supabase
    }
  }
  console.error('Supabase not configured. Please check your configuration.')
  return null
}

// Migrate products
async function migrateProducts() {
  const supabase = checkSupabase()
  if (!supabase) return
  
  console.log('Starting product migration...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const product of existingProducts) {
    try {
      // Prepare product data for Supabase
      const productData = {
        name: product.name,
        description: product.desc,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        image_url: product.image,
        badge: product.badge,
        category: 'skincare',
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
      
      if (error) {
        console.error(`Error migrating product "${product.name}":`, error)
        errorCount++
      } else {
        console.log(`✓ Migrated: ${product.name} (ID: ${data[0].id})`)
        successCount++
        
        // Store mapping from old ID to new UUID if needed
        if (typeof Storage !== 'undefined') {
          const idMap = JSON.parse(localStorage.getItem('product_id_map') || '{}')
          idMap[product.id] = data[0].id
          localStorage.setItem('product_id_map', JSON.stringify(idMap))
        }
      }
    } catch (error) {
      console.error(`Failed to migrate product ${product.name}:`, error)
      errorCount++
    }
  }
  
  console.log(`\nProduct migration complete!`)
  console.log(`Success: ${successCount}, Errors: ${errorCount}`)
  return { successCount, errorCount }
}

// Migrate promo codes
async function migratePromoCodes() {
  const supabase = checkSupabase()
  if (!supabase) return
  
  console.log('\nStarting promo code migration...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const promo of existingPromoCodes) {
    try {
      const promoData = {
        code: promo.code,
        discount_percent: promo.discount,
        expiry_date: promo.expiry,
        title: promo.title,
        is_active: new Date(promo.expiry) > new Date()
      }
      
      const { error } = await supabase
        .from('promo_codes')
        .insert([promoData])
      
      if (error) {
        console.error(`Error migrating promo code "${promo.code}":`, error)
        errorCount++
      } else {
        console.log(`✓ Migrated promo code: ${promo.code}`)
        successCount++
      }
    } catch (error) {
      console.error(`Failed to migrate promo ${promo.code}:`, error)
      errorCount++
    }
  }
  
  console.log(`\nPromo code migration complete!`)
  console.log(`Success: ${successCount}, Errors: ${errorCount}`)
  return { successCount, errorCount }
}

// Create sample categories
async function createSampleCategories() {
  const supabase = checkSupabase()
  if (!supabase) return
  
  const categories = [
    { name: 'Skincare', slug: 'skincare', description: 'Face and body skincare products' },
    { name: 'Makeup', slug: 'makeup', description: 'Cosmetics and makeup products' },
    { name: 'Fragrance', slug: 'fragrance', description: 'Perfumes and scented products' },
    { name: 'Accessories', slug: 'accessories', description: 'Beauty tools and accessories' }
  ]
  
  console.log('\nCreating sample categories...')
  
  for (const category of categories) {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([category])
        .select()
      
      if (error && !error.message.includes('duplicate key')) {
        console.error(`Error creating category "${category.name}":`, error)
      } else {
        console.log(`✓ Created category: ${category.name}`)
      }
    } catch (error) {
      console.error(`Failed to create category ${category.name}:`, error)
    }
  }
}

// Verify migration
async function verifyMigration() {
  const supabase = checkSupabase()
  if (!supabase) return
  
  console.log('\nVerifying migration...')
  
  try {
    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
    
    if (productsError) {
      console.error('Error verifying products:', productsError)
    } else {
      console.log(`Total products in database: ${products[0].count}`)
    }
    
    // Check promo codes
    const { data: promos, error: promosError } = await supabase
      .from('promo_codes')
      .select('count')
    
    if (promosError) {
      console.error('Error verifying promo codes:', promosError)
    } else {
      console.log(`Total promo codes in database: ${promos[0].count}`)
    }
    
  } catch (error) {
    console.error('Verification failed:', error)
  }
}

// Main migration function
async function runMigration() {
  console.log('========================================')
  console.log('SkinTalk Data Migration Tool')
  console.log('========================================\n')
  
  if (!confirm('This will migrate existing data to Supabase. Continue?')) {
    console.log('Migration cancelled by user.')
    return
  }
  
  try {
    // Run migrations in sequence
    await migrateProducts()
    await migratePromoCodes()
    await createSampleCategories()
    await verifyMigration()
    
    console.log('\n========================================')
    console.log('Migration completed successfully!')
    console.log('========================================\n')
    console.log('Next steps:')
    console.log('1. Update index.html to load products from Supabase')
    console.log('2. Modify script.js to use Supabase functions')
    console.log('3. Test the application thoroughly')
    
    // Show migration summary
    alert('Migration completed! Check console for details.')
    
  } catch (error) {
    console.error('Migration failed:', error)
    alert('Migration failed. Check console for errors.')
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runMigration,
    migrateProducts,
    migratePromoCodes,
    createSampleCategories,
    verifyMigration
  }
}

// For browser usage
if (typeof window !== 'undefined') {
  window.SkinTalkMigration = {
    run: runMigration,
    migrateProducts,
    migratePromoCodes,
    verify: verifyMigration
  }
  
  // Auto-run if requested via URL parameter
  if (window.location.search.includes('runMigration=true')) {
    setTimeout(runMigration, 1000)
  }
}

// Usage instructions
console.log(`
SkinTalk Migration Script
=========================

To run migration:
1. Make sure Supabase is configured in supabase-config.js
2. Open browser console (F12)
3. Paste: SkinTalkMigration.run()

Or add ?runMigration=true to URL and refresh.

Note: This only needs to be run once.
`)