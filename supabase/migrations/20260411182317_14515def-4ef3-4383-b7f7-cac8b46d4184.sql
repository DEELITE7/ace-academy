
-- Drop the overly permissive policy and replace with a tighter one
DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;

CREATE POLICY "Authenticated users can create courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
