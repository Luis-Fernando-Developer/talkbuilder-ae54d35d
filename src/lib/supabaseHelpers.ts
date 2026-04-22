// Thin helpers around the runtime Supabase client. All functions throw
// a friendly error when Supabase is not configured so the UI can show a hint.

import { getSupabase, getSupabaseConfig } from "./supabaseClient";

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase não está configurado. Vá em Configurações → Integrações para conectar."
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

function requireClient() {
  const client = getSupabase();
  if (!client) throw new SupabaseNotConfiguredError();
  return client;
}

export function getEdgeFunctionUrl(functionName: string): string {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new SupabaseNotConfiguredError();
  return `${cfg.url}/functions/v1/${functionName}`;
}

export async function saveBotFlow(botId: string, flow: unknown) {
  const client = requireClient();
  return client
    .from("bot_flows")
    .upsert({ bot_id: botId, flow, updated_at: new Date().toISOString() });
}

export async function loadBotFlow(botId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("bot_flows")
    .select("flow")
    .eq("bot_id", botId)
    .maybeSingle();
  if (error) throw error;
  return data?.flow ?? null;
}

export async function publishBot(botId: string, payload: unknown) {
  const client = requireClient();
  return client.from("bot_publishes").insert({ bot_id: botId, payload });
}
