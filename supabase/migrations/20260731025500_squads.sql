CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  leader text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can access squads" ON public.squads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  guardian_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(squad_id, guardian_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squad_members TO service_role;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can access squad members" ON public.squad_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
