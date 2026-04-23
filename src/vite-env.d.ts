/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TALKMAP_SUPABASE_URL?: string;
  readonly VITE_TALKMAP_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
