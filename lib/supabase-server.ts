import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getReceiptsBucketName() {
  return process.env.SUPABASE_RECEIPTS_BUCKET ?? "receipts";
}

export function getCottagesBucketName() {
  return process.env.SUPABASE_COTTAGES_BUCKET ?? "cottages";
}
