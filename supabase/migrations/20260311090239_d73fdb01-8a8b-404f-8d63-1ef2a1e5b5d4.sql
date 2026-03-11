-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can insert their own training progress" ON public.training_progress;
DROP POLICY IF EXISTS "Users can update their own training progress" ON public.training_progress;
DROP POLICY IF EXISTS "Users can view their own training progress" ON public.training_progress;

CREATE POLICY "Users can insert their own training progress"
  ON public.training_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training progress"
  ON public.training_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own training progress"
  ON public.training_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);