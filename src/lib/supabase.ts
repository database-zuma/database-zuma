import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "branch_super_app_clawdbot",
  },
  global: {
    headers: {
      "Accept-Profile": "branch_super_app_clawdbot",
    },
  },
});
