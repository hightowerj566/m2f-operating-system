
-- Standard definitions: coach sets global defaults, can override per-client, clients can add their own
CREATE TABLE public.standard_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✅',
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  target_user_id UUID, -- NULL = global (all users), set = specific client
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.standard_definitions ENABLE ROW LEVEL SECURITY;

-- Coaches can do everything
CREATE POLICY "Coaches can manage all standard definitions"
  ON public.standard_definitions FOR ALL
  USING (has_role(auth.uid(), 'coach'::app_role));

-- Users can view global standards + their own
CREATE POLICY "Users can view applicable standards"
  ON public.standard_definitions FOR SELECT
  USING (
    (is_global = true AND target_user_id IS NULL)
    OR target_user_id = auth.uid()
    OR created_by = auth.uid()
  );

-- Users can insert their own personal standards
CREATE POLICY "Users can insert own standards"
  ON public.standard_definitions FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_global = false
    AND (target_user_id = auth.uid() OR target_user_id IS NULL)
  );

-- Users can update/delete their own personal standards only
CREATE POLICY "Users can update own standards"
  ON public.standard_definitions FOR UPDATE
  USING (auth.uid() = created_by AND is_global = false);

CREATE POLICY "Users can delete own standards"
  ON public.standard_definitions FOR DELETE
  USING (auth.uid() = created_by AND is_global = false);

-- Now restructure daily_standards to use JSONB for flexible tracking
-- Add a column for flexible standard completions
ALTER TABLE public.daily_standards
  ADD COLUMN completions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Seed default global standards (will be created by coach on first use)
