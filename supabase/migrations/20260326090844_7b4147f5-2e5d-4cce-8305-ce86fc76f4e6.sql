
-- 1. User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2. Exam updates table (admin-uploaded CSV data)
CREATE TABLE public.exam_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name text NOT NULL,
  exam_short text NOT NULL,
  state text,
  type text,
  last_date date,
  status text DEFAULT 'Open',
  category text DEFAULT 'Safe',
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exam updates"
ON public.exam_updates FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can insert exam updates"
ON public.exam_updates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exam updates"
ON public.exam_updates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add percentage column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS percentage numeric DEFAULT NULL;

-- 4. User activity tracking table
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_seen timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upsert own activity"
ON public.user_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
ON public.user_activity FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all activity"
ON public.user_activity FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
