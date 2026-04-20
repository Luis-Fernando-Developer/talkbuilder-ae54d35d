import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Runtime Supabase configuration.
 *
 * The user connects their OWN Supabase project from the workspace
 * "Integrações" settings tab. Credentials (URL + anon key) are saved
 * in localStorage under the key below. We do NOT use Lovable Cloud
 * nor build-time env vars — the client is created lazily on first use.
 */
const STORAGE_KEY = "chatbot_supabase_config_v1";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseConfig;
    if (!parsed?.url || !parsed?.anonKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Reset cached client so next call uses the new credentials.
  cachedClient = null;
}

export function clearSupabaseConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns the user's Supabase client, or null if not yet configured.
 * Components should handle the null case gracefully (toast + open settings).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const config = getSupabaseConfig();
  if (!config) return null;
  cachedClient = createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cachedClient;
}

/**
 * Proxy that throws a friendly error if Supabase isn't configured.
 * Allows existing code that does `supabaseClient.from(...)` to keep working.
 */
function notConfigured(): never {
  throw new Error(
    "Supabase não configurado. Acesse Configurações → Integrações para conectar.",
  );
}

export const supabaseClient: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) notConfigured();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
