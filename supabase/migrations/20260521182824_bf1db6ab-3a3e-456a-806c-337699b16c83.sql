-- Dropping overly permissive policies
DROP POLICY IF EXISTS "Public update flow_executions" ON public.flow_executions;
DROP POLICY IF EXISTS "Public insert flow_executions" ON public.flow_executions;
DROP POLICY IF EXISTS "Public update conversation_sessions" ON public.conversation_sessions;
DROP POLICY IF EXISTS "Public insert conversation_sessions" ON public.conversation_sessions;

-- Creating more restrictive policies
CREATE POLICY "Authenticated users can insert flow_executions" 
ON public.flow_executions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update flow_executions" 
ON public.flow_executions FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert conversation_sessions" 
ON public.conversation_sessions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update conversation_sessions" 
ON public.conversation_sessions FOR UPDATE 
USING (auth.role() = 'authenticated');
