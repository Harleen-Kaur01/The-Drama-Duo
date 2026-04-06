
-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create classroom_members table
CREATE TABLE public.classroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;

-- Classrooms policies
CREATE POLICY "Anyone authenticated can view classrooms they are a member of"
ON public.classrooms FOR SELECT TO authenticated
USING (
  id IN (SELECT classroom_id FROM public.classroom_members WHERE user_id = auth.uid())
  OR created_by = auth.uid()
);

CREATE POLICY "Authenticated users can create classrooms"
ON public.classrooms FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their classrooms"
ON public.classrooms FOR UPDATE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their classrooms"
ON public.classrooms FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Allow anyone authenticated to read a classroom by code (for joining)
CREATE POLICY "Anyone can read classroom by code for joining"
ON public.classrooms FOR SELECT TO authenticated
USING (true);

-- Classroom members policies
CREATE POLICY "Members can view classroom members"
ON public.classroom_members FOR SELECT TO authenticated
USING (
  classroom_id IN (SELECT classroom_id FROM public.classroom_members WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can join classrooms"
ON public.classroom_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can leave classrooms"
ON public.classroom_members FOR DELETE TO authenticated
USING (user_id = auth.uid());
