// Runtime Supabase client. Reads URL + anon key from localStorage so the user
// can plug in their own Supabase project from the Integrations settings page.
// Returns null when not configured — callers MUST guard against that.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY = "supabase_config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let cached: SupabaseClient | null = null;
let cachedKey: string | null = null;

export function getSupabaseConfig(): SupabaseConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
    if (!parsed.url || !parsed.anonKey) return null;
    return { url: parsed.url, anonKey: parsed.anonKey };
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  cached = null;
  cachedKey = null;
}

export function clearSupabaseConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cached = null;
  cachedKey = null;
}

export function getSupabase(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  const key = `${cfg.url}::${cfg.anonKey}`;
  if (cached && cachedKey === key) return cached;
  cached = createClient(cfg.url, cfg.anonKey);
  cachedKey = key;
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
