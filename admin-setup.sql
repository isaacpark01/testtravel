-- ============================================================
-- PinTrip Admin Setup
-- Run this ONCE in Supabase SQL Editor → New Query
-- ============================================================

-- ── 1. Add admin + ban columns to profiles ──────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Helper functions (SECURITY DEFINER bypasses RLS) ─────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_banned FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ── 3. Drop old policies that need replacing ────────────────
DROP POLICY IF EXISTS "Update own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Delete own board"     ON public.boards;
DROP POLICY IF EXISTS "Insert board"         ON public.boards;
DROP POLICY IF EXISTS "Insert idea"          ON public.ideas;
DROP POLICY IF EXISTS "Delete own idea"      ON public.ideas;
DROP POLICY IF EXISTS "Update vote score"    ON public.ideas;
DROP POLICY IF EXISTS "Cast vote"            ON public.votes;
DROP POLICY IF EXISTS "Remove vote"          ON public.votes;

-- ── 4. Profiles policies ─────────────────────────────────────

-- Users can update only their own non-privileged fields.
-- Prevents self-granting admin or removing own ban.
CREATE POLICY "Update own profile (restricted)"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_admin  = (SELECT is_admin  FROM public.profiles WHERE id = auth.uid())
  AND is_banned = (SELECT is_banned FROM public.profiles WHERE id = auth.uid())
);

-- Admin can update any profile (for toggling ban / admin status).
CREATE POLICY "Admin update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- Admin can delete any profile row.
CREATE POLICY "Admin delete any profile"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- ── 5. Boards policies ───────────────────────────────────────

-- Non-banned users can create boards.
CREATE POLICY "Insert board (not banned)"
ON public.boards FOR INSERT
WITH CHECK (auth.uid() = created_by AND NOT public.is_banned());

-- Owner or admin can delete any board.
CREATE POLICY "Delete board (owner or admin)"
ON public.boards FOR DELETE
USING (auth.uid() = created_by OR public.is_admin());

-- ── 6. Ideas policies ────────────────────────────────────────

-- Non-banned users can insert ideas.
CREATE POLICY "Insert idea (not banned)"
ON public.ideas FOR INSERT
WITH CHECK (auth.uid() = created_by AND NOT public.is_banned());

-- Owner or admin can delete any idea.
CREATE POLICY "Delete idea (owner or admin)"
ON public.ideas FOR DELETE
USING (auth.uid() = created_by OR public.is_admin());

-- Anyone (auth) can update vote_score; admin can update anything.
CREATE POLICY "Update idea score"
ON public.ideas FOR UPDATE
USING (TRUE);

-- ── 7. Votes policies ────────────────────────────────────────

-- Non-banned users can cast votes.
CREATE POLICY "Cast vote (not banned)"
ON public.votes FOR INSERT
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned());

-- Owner or admin can remove any vote.
CREATE POLICY "Remove vote (owner or admin)"
ON public.votes FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- ── 8. Bootstrap: make yourself admin ───────────────────────
-- Uncomment and replace with your username, then run:
-- UPDATE public.profiles SET is_admin = TRUE WHERE username = 'YourUsernameHere';
