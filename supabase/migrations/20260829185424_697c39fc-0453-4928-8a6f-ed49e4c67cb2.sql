
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('manager','team_lead','team_member');
CREATE TYPE public.submission_status AS ENUM ('draft','submitted','reviewed','needs_clarification');
CREATE TYPE public.severity_level AS ENUM ('P1','P2','P3','P4');
CREATE TYPE public.priority_level AS ENUM ('low','medium','high','critical');
CREATE TYPE public.task_status AS ENUM ('completed','in_progress','blocked','pending');
CREATE TYPE public.analysis_status AS ENUM ('started','in_progress','completed','needs_review');
CREATE TYPE public.incident_status AS ENUM ('open','investigating','monitoring','resolved','closed');

-- TEAMS
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid,
  team_lead_id uuid,
  working_hours numeric NOT NULL DEFAULT 8,
  cutoff_time time NOT NULL DEFAULT '20:00',
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  criticality text NOT NULL DEFAULT 'medium',
  support_hours text NOT NULL DEFAULT '24x7',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PROFILES (no FK to auth.users by design)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  employee_id text,
  avatar_url text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  primary_application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  shift text NOT NULL DEFAULT 'General',
  timezone text NOT NULL DEFAULT 'UTC',
  status text NOT NULL DEFAULT 'active',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.my_team_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.team_of(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT team_id FROM public.profiles WHERE id = _user_id;
$$;

-- true when caller may read records owned by _user_id
CREATE OR REPLACE FUNCTION public.can_view_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() = _user_id
      OR public.has_role(auth.uid(),'manager')
      OR (public.has_role(auth.uid(),'team_lead') AND public.team_of(_user_id) IS NOT DISTINCT FROM public.my_team_id());
$$;

-- DAILY UPDATES
CREATE TABLE public.daily_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  shift text NOT NULL DEFAULT 'General',
  location text NOT NULL DEFAULT 'Office',
  primary_application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  productive_hours numeric NOT NULL DEFAULT 0,
  meeting_hours numeric NOT NULL DEFAULT 0,
  incident_hours numeric NOT NULL DEFAULT 0,
  analysis_hours numeric NOT NULL DEFAULT 0,
  learning_hours numeric NOT NULL DEFAULT 0,
  support_hours numeric NOT NULL DEFAULT 0,
  summary text,
  submission_status public.submission_status NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date)
);

CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid NOT NULL REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'Production Support',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'completed',
  time_spent numeric NOT NULL DEFAULT 0,
  ticket_number text,
  ticket_url text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  incident_number text NOT NULL,
  title text NOT NULL,
  description text,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  severity public.severity_level NOT NULL DEFAULT 'P3',
  status public.incident_status NOT NULL DEFAULT 'open',
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer NOT NULL DEFAULT 0,
  business_impact text,
  root_cause text,
  resolution text,
  bridge_required boolean NOT NULL DEFAULT false,
  bridge_duration integer NOT NULL DEFAULT 0,
  rca_required boolean NOT NULL DEFAULT false,
  follow_up_required boolean NOT NULL DEFAULT false,
  problem_ticket text,
  notes text,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incident_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  participation_type text NOT NULL DEFAULT 'Participant',
  joined_at timestamptz,
  left_at timestamptz,
  UNIQUE (incident_id, user_id)
);

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  call_type text NOT NULL DEFAULT 'Internal Meeting',
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer NOT NULL DEFAULT 0,
  organizer text,
  participants text,
  purpose text,
  discussion text,
  action_items text,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Technical',
  technology text,
  source text,
  useful_for_team boolean NOT NULL DEFAULT true,
  share_with_team boolean NOT NULL DEFAULT true,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  problem_statement text,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  data_reviewed text,
  observations text,
  findings text,
  root_cause text,
  recommendation text,
  status public.analysis_status NOT NULL DEFAULT 'started',
  reference_ticket text,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  description text NOT NULL,
  impact text,
  waiting_on text,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  expected_resolution date,
  status text NOT NULL DEFAULT 'open',
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE public.tomorrow_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid NOT NULL REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  task text NOT NULL,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  expected_outcome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.manager_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_update_id uuid NOT NULL REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_du_user ON public.daily_updates(user_id);
CREATE INDEX idx_du_date ON public.daily_updates(work_date DESC);
CREATE INDEX idx_du_team ON public.daily_updates(team_id);
CREATE INDEX idx_tasks_update ON public.daily_tasks(daily_update_id);
CREATE INDEX idx_tasks_user ON public.daily_tasks(user_id);
CREATE INDEX idx_inc_app ON public.incidents(application_id);
CREATE INDEX idx_inc_sev ON public.incidents(severity);
CREATE INDEX idx_inc_status ON public.incidents(status);
CREATE INDEX idx_inc_date ON public.incidents(work_date DESC);
CREATE INDEX idx_calls_user ON public.calls(user_id);
CREATE INDEX idx_calls_date ON public.calls(work_date DESC);
CREATE INDEX idx_learn_date ON public.learnings(work_date DESC);
CREATE INDEX idx_ana_date ON public.analyses(work_date DESC);
CREATE INDEX idx_block_status ON public.blockers(status);
CREATE INDEX idx_act_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_notif_user ON public.notifications(user_id, read);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams, public.applications, public.profiles,
  public.daily_updates, public.daily_tasks, public.incidents, public.incident_participants,
  public.calls, public.learnings, public.analyses, public.blockers, public.tomorrow_plans,
  public.manager_comments, public.notifications, public.activity_logs TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.teams, public.applications, public.profiles, public.user_roles,
  public.daily_updates, public.daily_tasks, public.incidents, public.incident_participants,
  public.calls, public.learnings, public.analyses, public.blockers, public.tomorrow_plans,
  public.manager_comments, public.notifications, public.activity_logs TO service_role;

-- RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tomorrow_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams readable" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams managed by manager" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'manager'));

CREATE POLICY "apps readable" ON public.applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "apps managed by manager" ON public.applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'manager'));

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "manager manages profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'manager'));

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- generic per-user tables
CREATE POLICY "du select" ON public.daily_updates FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "du own write" ON public.daily_updates FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "du lead review" ON public.daily_updates FOR UPDATE TO authenticated
  USING (public.can_view_user(user_id)) WITH CHECK (public.can_view_user(user_id));

CREATE POLICY "tasks select" ON public.daily_tasks FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "tasks own" ON public.daily_tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "inc select" ON public.incidents FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "inc own" ON public.incidents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "incp select" ON public.incident_participants FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "incp own" ON public.incident_participants FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "calls select" ON public.calls FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "calls own" ON public.calls FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "learn select" ON public.learnings FOR SELECT TO authenticated
  USING (share_with_team OR public.can_view_user(user_id));
CREATE POLICY "learn own" ON public.learnings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "ana select" ON public.analyses FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "ana own" ON public.analyses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "block select" ON public.blockers FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "block own" ON public.blockers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "plan select" ON public.tomorrow_plans FOR SELECT TO authenticated USING (public.can_view_user(user_id));
CREATE POLICY "plan own" ON public.tomorrow_plans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments select" ON public.manager_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments write" ON public.manager_comments FOR ALL TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "notif own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "act select" ON public.activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "act insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- REALTIME
ALTER TABLE public.daily_updates REPLICA IDENTITY FULL;
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.blockers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blockers;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER t_du BEFORE UPDATE ON public.daily_updates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_inc BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_ana BEFORE UPDATE ON public.analyses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_prof BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bootstrap profile for a newly signed-up user
CREATE OR REPLACE FUNCTION public.ensure_profile(_full_name text, _role public.app_role DEFAULT 'team_member', _team_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _team uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  SELECT id INTO _team FROM public.teams WHERE _team_name IS NOT NULL AND name = _team_name LIMIT 1;
  IF _team IS NULL THEN SELECT id INTO _team FROM public.teams ORDER BY created_at LIMIT 1; END IF;
  INSERT INTO public.profiles (id, email, full_name, employee_id, team_id, shift)
  VALUES (_uid, COALESCE(_email,'unknown'), _full_name, 'EMP-' || substr(_uid::text,1,6), _team, 'General')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role) ON CONFLICT DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.ensure_profile(text, public.app_role, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, public.app_role, text) TO authenticated;

-- ============ SEED DEMO DATA ============
INSERT INTO public.teams (id, name, description) VALUES
 ('11111111-1111-1111-1111-111111111111','Application Support','Front-line production support for customer facing platforms'),
 ('22222222-2222-2222-2222-222222222222','Platform Operations','Infrastructure, monitoring and release operations');

INSERT INTO public.applications (id, name, description, owner_team_id, criticality) VALUES
 ('a1111111-0000-0000-0000-000000000001','Customer Portal','Self-service portal for retail customers','11111111-1111-1111-1111-111111111111','high'),
 ('a1111111-0000-0000-0000-000000000002','Payment Gateway','Card and wallet payment processing','11111111-1111-1111-1111-111111111111','critical'),
 ('a1111111-0000-0000-0000-000000000003','Order Management','Order capture, routing and fulfilment','22222222-2222-2222-2222-222222222222','high'),
 ('a1111111-0000-0000-0000-000000000004','Reporting Platform','Operational and finance reporting warehouse','22222222-2222-2222-2222-222222222222','medium'),
 ('a1111111-0000-0000-0000-000000000005','Notification Service','Email, SMS and push delivery service','22222222-2222-2222-2222-222222222222','medium');

INSERT INTO public.profiles (id, email, full_name, employee_id, team_id, primary_application_id, shift, is_demo) VALUES
 ('d0000000-0000-0000-0000-000000000001','priya.raman@teampulse.io','Priya Raman','EMP-1001','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000001','General',true),
 ('d0000000-0000-0000-0000-000000000002','marcus.hale@teampulse.io','Marcus Hale','EMP-1002','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000002','General',true),
 ('d0000000-0000-0000-0000-000000000003','anita.desai@teampulse.io','Anita Desai','EMP-1003','22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000003','General',true),
 ('d0000000-0000-0000-0000-000000000004','john.mercer@teampulse.io','John Mercer','EMP-1004','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000001','Morning',true),
 ('d0000000-0000-0000-0000-000000000005','sarah.klein@teampulse.io','Sarah Klein','EMP-1005','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000002','Morning',true),
 ('d0000000-0000-0000-0000-000000000006','david.otieno@teampulse.io','David Otieno','EMP-1006','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000002','Night',true),
 ('d0000000-0000-0000-0000-000000000007','emily.chen@teampulse.io','Emily Chen','EMP-1007','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000003','General',true),
 ('d0000000-0000-0000-0000-000000000008','mike.alvarez@teampulse.io','Mike Alvarez','EMP-1008','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000005','Afternoon',true),
 ('d0000000-0000-0000-0000-000000000009','fatima.noor@teampulse.io','Fatima Noor','EMP-1009','22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000003','General',true),
 ('d0000000-0000-0000-0000-000000000010','tom.becker@teampulse.io','Tom Becker','EMP-1010','22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000004','General',true),
 ('d0000000-0000-0000-0000-000000000011','laura.pinto@teampulse.io','Laura Pinto','EMP-1011','22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000004','Morning',true),
 ('d0000000-0000-0000-0000-000000000012','samir.gupta@teampulse.io','Samir Gupta','EMP-1012','22222222-2222-2222-2222-222222222222','a1111111-0000-0000-0000-000000000005','Night',true),
 ('d0000000-0000-0000-0000-000000000013','nora.svensson@teampulse.io','Nora Svensson','EMP-1013','11111111-1111-1111-1111-111111111111','a1111111-0000-0000-0000-000000000001','General',true);

INSERT INTO public.user_roles (user_id, role) VALUES
 ('d0000000-0000-0000-0000-000000000001','manager'),
 ('d0000000-0000-0000-0000-000000000002','team_lead'),
 ('d0000000-0000-0000-0000-000000000003','team_lead'),
 ('d0000000-0000-0000-0000-000000000004','team_member'),
 ('d0000000-0000-0000-0000-000000000005','team_member'),
 ('d0000000-0000-0000-0000-000000000006','team_member'),
 ('d0000000-0000-0000-0000-000000000007','team_member'),
 ('d0000000-0000-0000-0000-000000000008','team_member'),
 ('d0000000-0000-0000-0000-000000000009','team_member'),
 ('d0000000-0000-0000-0000-000000000010','team_member'),
 ('d0000000-0000-0000-0000-000000000011','team_member'),
 ('d0000000-0000-0000-0000-000000000012','team_member'),
 ('d0000000-0000-0000-0000-000000000013','team_member');

UPDATE public.teams SET manager_id='d0000000-0000-0000-0000-000000000001', team_lead_id='d0000000-0000-0000-0000-000000000002' WHERE id='11111111-1111-1111-1111-111111111111';
UPDATE public.teams SET manager_id='d0000000-0000-0000-0000-000000000001', team_lead_id='d0000000-0000-0000-0000-000000000003' WHERE id='22222222-2222-2222-2222-222222222222';

-- 30 days of updates for the 10 members (+2 leads)
DO $seed$
DECLARE
  u record; d date; upd uuid; i int; n int; sev public.severity_level; app uuid;
  apps uuid[] := ARRAY['a1111111-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000005']::uuid[];
  task_titles text[] := ARRAY['Cleared overnight batch failure queue','Patched retry logic for webhook consumer','Validated release candidate in staging','Reviewed alert noise in monitoring dashboard','Handled password reset escalations','Tuned slow reporting query','Updated runbook for payment reconciliation','Onboarded new alert rules','Investigated intermittent 502 responses','Completed change request rollout'];
  cats text[] := ARRAY['Production Support','Development','Monitoring','Bug Fix','Deployment','Analysis','Documentation','Change Request','Automation','Meeting'];
BEGIN
FOR u IN SELECT id, team_id FROM public.profiles WHERE is_demo AND id <> 'd0000000-0000-0000-0000-000000000001' LOOP
  FOR i IN 0..29 LOOP
    d := CURRENT_DATE - i;
    CONTINUE WHEN extract(isodow from d) > 5;
    -- some members miss some days (~12%)
    CONTINUE WHEN (abs(hashtext(u.id::text || d::text)) % 100) < 12;
    INSERT INTO public.daily_updates (user_id, team_id, work_date, shift, location, primary_application_id,
      total_hours, productive_hours, meeting_hours, incident_hours, analysis_hours, learning_hours, support_hours,
      summary, submission_status, submitted_at)
    VALUES (u.id, u.team_id, d, 'General',
      CASE WHEN (abs(hashtext(u.id::text||d::text))%3)=0 THEN 'Remote' ELSE 'Office' END,
      apps[1 + abs(hashtext(u.id::text))%5],
      8, 5 + (abs(hashtext(u.id::text||d::text))%3), 1 + (abs(hashtext(d::text||u.id::text))%2),
      (abs(hashtext(u.id::text||d::text))%3), (abs(hashtext(d::text))%2), 0.5, 2 + (abs(hashtext(u.id::text))%3),
      'Steady support day with routine monitoring and ticket handling.',
      CASE WHEN i = 0 AND (abs(hashtext(u.id::text))%4)=0 THEN 'draft'::public.submission_status ELSE 'submitted'::public.submission_status END,
      d + time '18:30')
    RETURNING id INTO upd;

    n := 2 + abs(hashtext(u.id::text||d::text))%4;
    FOR i IN 1..n LOOP
      INSERT INTO public.daily_tasks (daily_update_id, user_id, title, description, application_id, category, priority, status, time_spent, ticket_number)
      VALUES (upd, u.id, task_titles[1 + (abs(hashtext(u.id::text||d::text||i::text))%10)],
        'Completed as part of the daily support rotation.',
        apps[1 + abs(hashtext(u.id::text||i::text))%5],
        cats[1 + (abs(hashtext(d::text||i::text))%10)],
        (ARRAY['low','medium','high','critical']::public.priority_level[])[1 + (abs(hashtext(u.id::text||i::text))%4)],
        CASE WHEN (abs(hashtext(u.id::text||d::text||i::text))%10) < 8 THEN 'completed'::public.task_status ELSE 'in_progress'::public.task_status END,
        1 + (abs(hashtext(i::text||d::text))%3),
        'SR' || (100000 + abs(hashtext(u.id::text||d::text||i::text))%89999)::text);
    END LOOP;

    -- incidents ~30% of update days
    IF (abs(hashtext(u.id::text||d::text||'inc')) % 100) < 30 THEN
      n := abs(hashtext(u.id::text||d::text))%100;
      sev := CASE WHEN n < 4 THEN 'P1' WHEN n < 20 THEN 'P2' WHEN n < 60 THEN 'P3' ELSE 'P4' END::public.severity_level;
      app := apps[1 + abs(hashtext(d::text||u.id::text))%5];
      INSERT INTO public.incidents (daily_update_id, user_id, team_id, incident_number, title, description, application_id,
        severity, status, start_time, end_time, duration_minutes, business_impact, root_cause, resolution,
        bridge_required, bridge_duration, rca_required, follow_up_required, work_date)
      VALUES (upd, u.id, u.team_id, 'INC' || (1000000 + abs(hashtext(u.id::text||d::text))%899999)::text,
        CASE sev WHEN 'P1' THEN 'Checkout transactions failing for all regions'
                 WHEN 'P2' THEN 'Elevated latency on customer API'
                 WHEN 'P3' THEN 'Delayed notification delivery'
                 ELSE 'Cosmetic error banner on account page' END,
        'Detected via monitoring alert and confirmed with application logs.', app, sev,
        CASE WHEN (abs(hashtext(u.id::text||d::text))%10) < 7 THEN 'resolved'::public.incident_status
             WHEN i = 0 THEN 'investigating'::public.incident_status ELSE 'closed'::public.incident_status END,
        d + time '09:15', d + time '11:05', 45 + abs(hashtext(d::text||u.id::text))%180,
        CASE sev WHEN 'P1' THEN 'Revenue impacting - payments unavailable' WHEN 'P2' THEN 'Degraded customer experience' ELSE 'Minimal customer impact' END,
        'Connection pool exhaustion under peak load.', 'Restarted affected pods and increased pool size.',
        sev IN ('P1','P2'), CASE WHEN sev IN ('P1','P2') THEN 40 ELSE 0 END, sev = 'P1', sev IN ('P1','P2'), d);
    END IF;

    -- calls
    IF (abs(hashtext(u.id::text||d::text||'call')) % 100) < 70 THEN
      INSERT INTO public.calls (daily_update_id, user_id, team_id, title, call_type, start_time, end_time, duration_minutes, organizer, purpose, discussion, work_date)
      VALUES (upd, u.id, u.team_id, 'Daily Standup', 'Daily Standup', d + time '09:30', d + time '09:45', 15, 'Marcus Hale',
        'Sync on overnight incidents and priorities', 'Reviewed open tickets and shared blockers.', d);
    END IF;

    -- learnings ~25%
    IF (abs(hashtext(u.id::text||d::text||'learn')) % 100) < 25 THEN
      INSERT INTO public.learnings (daily_update_id, user_id, team_id, title, description, category, technology, source, work_date)
      VALUES (upd, u.id, u.team_id,
        (ARRAY['Using pg_stat_statements to find slow queries','Kafka consumer lag troubleshooting','Grafana alert routing basics','Safe rollback strategy for blue-green deploys','Reading TLS handshake failures in logs'])[1 + abs(hashtext(u.id::text||d::text))%5],
        'Documented the steps so the rest of the team can reuse them during on-call.',
        (ARRAY['Technical','Database','Monitoring','DevOps','Production Support'])[1 + abs(hashtext(d::text||u.id::text))%5],
        (ARRAY['PostgreSQL','Kafka','Grafana','Kubernetes','OpenSSL'])[1 + abs(hashtext(u.id::text||d::text))%5],
        'Hands-on troubleshooting', d);
    END IF;

    -- analyses ~18%
    IF (abs(hashtext(u.id::text||d::text||'ana')) % 100) < 18 THEN
      INSERT INTO public.analyses (daily_update_id, user_id, team_id, title, problem_statement, application_id, data_reviewed, observations, findings, root_cause, recommendation, status, reference_ticket, work_date)
      VALUES (upd, u.id, u.team_id, 'Recurring timeout pattern review',
        'Customers report intermittent timeouts during peak hours.',
        apps[1 + abs(hashtext(u.id::text)) % 5], 'Application logs, APM traces, database wait events',
        'Timeouts cluster between 10:00 and 11:00 on weekdays.',
        'Connection pool saturates when batch jobs overlap with peak traffic.',
        'Batch schedule overlaps peak window.',
        'Move the reconciliation batch to 04:00 and raise pool size to 60.',
        (ARRAY['completed','in_progress','needs_review']::public.analysis_status[])[1 + abs(hashtext(d::text||u.id::text))%3],
        'PRB' || (2000 + abs(hashtext(u.id::text||d::text))%7999)::text, d);
    END IF;

    -- blockers ~10%
    IF (abs(hashtext(u.id::text||d::text||'blk')) % 100) < 10 THEN
      INSERT INTO public.blockers (daily_update_id, user_id, team_id, description, impact, waiting_on, priority, expected_resolution, status, work_date)
      VALUES (upd, u.id, u.team_id, 'Awaiting firewall rule approval for the new monitoring agent',
        'Monitoring coverage gap on two nodes', 'Network security team',
        (ARRAY['medium','high','critical']::public.priority_level[])[1 + abs(hashtext(u.id::text||d::text))%3],
        d + 4, CASE WHEN i < 6 THEN 'open' ELSE 'resolved' END, d);
    END IF;

    INSERT INTO public.tomorrow_plans (daily_update_id, user_id, task, priority, expected_outcome)
    VALUES (upd, u.id, 'Complete pending ticket backlog and verify overnight batch', 'medium', 'Backlog under 5 open tickets');
  END LOOP;
END LOOP;
END $seed$;

-- activity log from recent records
INSERT INTO public.activity_logs (actor_id, team_id, action, entity_type, entity_id, description, created_at)
SELECT user_id, team_id, 'submitted_update', 'daily_update', id,
       'submitted the daily update', COALESCE(submitted_at, created_at)
FROM public.daily_updates WHERE work_date >= CURRENT_DATE - 2;

INSERT INTO public.activity_logs (actor_id, team_id, action, entity_type, entity_id, description, created_at)
SELECT user_id, team_id, 'incident_logged', 'incident', id,
       'logged incident ' || incident_number || ' (' || severity || ')', created_at
FROM public.incidents WHERE work_date >= CURRENT_DATE - 2;
