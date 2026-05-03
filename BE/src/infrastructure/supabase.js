const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const { url, serviceRoleKey } = config.supabase;

if (!url || !serviceRoleKey) {
  // We don't crash here because image upload might be optional for some flows, 
  // but we should log a warning if it's accessed.
}

/**
 * Supabase Admin Client — uses service_role key to bypass Row Level Security.
 * Used exclusively for server-side storage operations (file uploads).
 * NEVER expose this key to the client.
 */
const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
