-- ============================================================
-- 002_admin_rls.sql
-- Adds is_admin + dark_mode columns and proper admin RLS policies.
--
-- NOTE: Admin server actions must use a Supabase client created with the
-- service role key only (no user session/cookies). Otherwise requests use the
-- logged-in user's JWT and RLS applies — inserts on nodes can fail with
-- "violates row-level security policy".
--
-- These policies still help when using Studio as an authenticated admin
-- or any path that uses the user's JWT on purpose.
-- ============================================================

-- Add is_admin column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Add dark_mode column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS dark_mode boolean NOT NULL DEFAULT false;

-- Add updated_at column (used by saveSettings action)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- ============================================================
-- Admin RLS policies — questions
-- ============================================================
DROP POLICY IF EXISTS "questions_admin" ON public.questions;
CREATE POLICY "questions_admin" ON public.questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================
-- Admin RLS policies — nodes
-- ============================================================
DROP POLICY IF EXISTS "nodes_admin" ON public.nodes;
CREATE POLICY "nodes_admin" ON public.nodes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================
-- Admin RLS policies — chapters
-- ============================================================
DROP POLICY IF EXISTS "chapters_admin" ON public.chapters;
CREATE POLICY "chapters_admin" ON public.chapters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================
-- Grant admin to specific user (run manually, replacing the email)
-- ============================================================
-- UPDATE public.user_profiles
-- SET is_admin = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
