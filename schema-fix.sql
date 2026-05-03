-- ============================================================
-- Dropped — Schema Fix
-- Run this in Supabase SQL Editor → New Query if signup fails
-- with "Database error saving new user"
-- ============================================================

-- 1. Create tables (IF NOT EXISTS is safe to re-run)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_color text DEFAULT '#0d9488',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.board_members (
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id   uuid REFERENCES public.boards(id)   ON DELETE CASCADE,
  city_id    text NOT NULL,
  city_name  text NOT NULL,
  note       text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  username   text NOT NULL,
  vote_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.votes (
  idea_id  uuid REFERENCES public.ideas(id)    ON DELETE CASCADE,
  user_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction text CHECK (direction IN ('up','down')),
  PRIMARY KEY (idea_id, user_id)
);

-- 2. Add admin/ban columns (safe to re-run)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Enable Row Level Security
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes         ENABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies so we can recreate cleanly
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 5. Helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- 6. Profiles policies
CREATE POLICY "profiles_select"    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert"    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE USING (public.is_admin());

-- 7. Boards policies
CREATE POLICY "boards_select"  ON public.boards FOR SELECT USING (true);
CREATE POLICY "boards_insert"  ON public.boards FOR INSERT WITH CHECK (auth.uid() = created_by AND NOT public.is_banned());
CREATE POLICY "boards_delete"  ON public.boards FOR DELETE USING (auth.uid() = created_by OR public.is_admin());

-- 8. Board members policies
CREATE POLICY "members_select" ON public.board_members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON public.board_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_delete" ON public.board_members FOR DELETE USING (auth.uid() = user_id);

-- 9. Ideas policies
CREATE POLICY "ideas_select"  ON public.ideas FOR SELECT USING (true);
CREATE POLICY "ideas_insert"  ON public.ideas FOR INSERT WITH CHECK (auth.uid() = created_by AND NOT public.is_banned());
CREATE POLICY "ideas_update"  ON public.ideas FOR UPDATE USING (true);
CREATE POLICY "ideas_delete"  ON public.ideas FOR DELETE USING (auth.uid() = created_by OR public.is_admin());

-- 10. Votes policies
CREATE POLICY "votes_select"  ON public.votes FOR SELECT USING (true);
CREATE POLICY "votes_insert"  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());
CREATE POLICY "votes_delete"  ON public.votes FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 11. Recreate the trigger that auto-creates a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. Realtime (safe to re-run — ignores "already member" error)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
EXCEPTION WHEN others THEN NULL;
END $$;
