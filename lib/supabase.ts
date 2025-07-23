import { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// For server-side operations
export const createServerClient = () => {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
