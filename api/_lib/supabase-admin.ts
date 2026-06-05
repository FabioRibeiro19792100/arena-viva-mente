import { createClient } from "@supabase/supabase-js";

let cachedAdmin: ReturnType<typeof createClient> | null = null;

const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const getServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseAdmin = () => {
  if (cachedAdmin) {
    return cachedAdmin;
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdmin;
};
