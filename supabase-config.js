// Supabase Configuration
// Replace with your actual Supabase project credentials

const SUPABASE_CONFIG = {
  // Get these from your Supabase project settings
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-anon-key-here',
  
  // Storage configuration
  storage: {
    bucket: 'product-images',
    folder: 'products'
  },
  
  // Table names
  tables: {
    products: 'products',
    users: 'user_profiles',
    cart: 'cart_items',
    orders: 'orders',
    orderItems: 'order_items',
    promoCodes: 'promo_codes',
    reviews: 'reviews'
  },
  
  // Auth configuration
  auth: {
    redirectUrl: window.location.origin,
    storageKey: 'skintalk-auth'
  }
}

// Initialize Supabase client
let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient && typeof createClient !== 'undefined') {
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: SUPABASE_CONFIG.auth.storageKey
      }
    })
  }
  return supabaseClient
}

// Check if Supabase is configured
function isSupabaseConfigured() {
  return SUPABASE_CONFIG.url && 
         SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co' &&
         SUPABASE_CONFIG.anonKey && 
         SUPABASE_CONFIG.anonKey !== 'your-anon-key-here'
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_CONFIG,
    getSupabaseClient,
    isSupabaseConfigured
  }
}

// For browser usage
if (typeof window !== 'undefined') {
  window.SkinTalkSupabase = {
    config: SUPABASE_CONFIG,
    getClient: getSupabaseClient,
    isConfigured: isSupabaseConfigured
  }
}