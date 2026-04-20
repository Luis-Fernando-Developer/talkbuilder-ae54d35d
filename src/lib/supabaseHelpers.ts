import { getSupabaseConfig } from "./supabaseClient";

/**
 * Build the URL for a Supabase Edge Function deployed in the user's project.
 * Reads URL from runtime config (localStorage) — no build-time env vars.
 */
export function getEdgeFunctionUrl(functionName: string): string {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase não configurado. Conecte seu projeto em Configurações → Integrações.",
    );
  }
  const baseUrl = config.url.replace(/\/$/, "");
  return `${baseUrl}/functions/v1/${functionName}`;
}

export function getSupabaseProjectUrl(): string | null {
  return getSupabaseConfig()?.url ?? null;
}
