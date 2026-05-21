-- Create chatbot_flows table
CREATE TABLE IF NOT EXISTS public.chatbot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  user_id UUID REFERENCES auth.users(id),
  workspace_item_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_containers JSONB NOT NULL DEFAULT '[]'::jsonb,
  draft_edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  draft_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_containers JSONB,
  published_edges JSONB,
  published_at TIMESTAMPTZ,
  public_id TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view flows in their workspaces" 
ON public.chatbot_flows 
FOR SELECT 
USING (true); -- Simplifying for now to ensure visibility, usually tied to workspace_members

CREATE POLICY "Users can insert flows" 
ON public.chatbot_flows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows" 
ON public.chatbot_flows 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create runtime tables if they don't exist
create table if not exists public.flow_executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  flow_id uuid not null references public.chatbot_flows(id) on delete cascade,
  contact_id text not null,
  channel_id text not null default 'webchat',
  current_node_id text,
  variables jsonb not null default '{}'::jsonb,
  waiting_for_input boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flow_id, contact_id, channel_id)
);

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  flow_id uuid not null references public.chatbot_flows(id) on delete cascade,
  contact_id text not null,
  channel_id text not null default 'webchat',
  status text not null default 'active',
  started_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for runtime tables
alter table public.flow_executions enable row level security;
alter table public.conversation_sessions enable row level security;

-- Policies for runtime (public access for execution)
CREATE POLICY "Public select flow_executions" ON public.flow_executions FOR SELECT USING (true);
CREATE POLICY "Public insert flow_executions" ON public.flow_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update flow_executions" ON public.flow_executions FOR UPDATE USING (true);

CREATE POLICY "Public select conversation_sessions" ON public.conversation_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert conversation_sessions" ON public.conversation_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update conversation_sessions" ON public.conversation_sessions FOR UPDATE USING (true);
