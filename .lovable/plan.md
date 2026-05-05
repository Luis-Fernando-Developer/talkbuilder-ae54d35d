# Deploy da `provision-account` no builder-flow-api

## Contexto
A function existe em `supabase/functions/provision-account/index.ts` mas o Flow-Appoint recebe **404** porque ela ainda não foi deployada no Supabase externo (`fwoescubnnagdvwasbjl`). Além disso, ao revisar o arquivo encontrei dois problemas que impedem o deploy:

1. **Arquivo duplicado** — o conteúdo inteiro (`Deno.serve`, helpers, imports) está repetido a partir da linha 375. Isso causa erro de redeclaração no Deno (`Identifier 'createClient' has already been declared`).
2. **Conflito de merge não resolvido** no `README.md` (`<<<<<<< HEAD ... >>>>>>>`) — não bloqueia deploy, mas está sujo.

## Plano

### 1. Limpar `supabase/functions/provision-account/index.ts`
Remover a segunda metade duplicada (linhas 375-746), deixando só uma definição do handler (linhas 1-373).

### 2. Limpar `supabase/functions/provision-account/README.md`
Remover os marcadores de conflito de merge do final do arquivo.

### 3. Garantir secret `EMBED_SHARED_SECRET` no Supabase externo
Listar os secrets atuais via `secrets--fetch_secrets` (essa tool acessa o Supabase do projeto). Se faltar `EMBED_SHARED_SECRET`, te peço pra adicionar via `add_secret` com **o mesmo valor** já cadastrado no Flow-Appoint.

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são auto-injetados pelo Supabase em edge functions — não precisa configurar.

### 4. Deploy via Supabase CLI
Rodar no sandbox:
```bash
supabase functions deploy provision-account \
  --project-ref fwoescubnnagdvwasbjl \
  --no-verify-jwt
```
- `--no-verify-jwt` porque a function valida o **nosso** JWT HS256 com `EMBED_SHARED_SECRET`, não o JWT do Supabase Auth.
- Vou precisar de um **Supabase access token** (`SUPABASE_ACCESS_TOKEN`) pra CLI autenticar não-interativa. Te peço via `add_secret` se não estiver disponível. Você gera em https://supabase.com/dashboard/account/tokens.

### 5. Smoke test
Depois do deploy, gero um JWT HS256 curtinho local com o mesmo secret e faço um `POST` de teste pra:
```
https://fwoescubnnagdvwasbjl.supabase.co/functions/v1/provision-account
```
com um email de teste, conferindo que a resposta é `200 { ok: true, created: true|false, user_id }`. Confirmo que a 404 sumiu e te aviso.

## O que preciso de você
- Confirmar que posso usar o **mesmo `EMBED_SHARED_SECRET`** já em produção (sem rotacionar agora).
- Um **Supabase access token** com permissão no projeto `fwoescubnnagdvwasbjl`, se eu não achar nos secrets.
