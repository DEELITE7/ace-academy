
-- Fix overly permissive INSERT on creator_earnings
DROP POLICY IF EXISTS "System creates earnings" ON public.creator_earnings;
CREATE POLICY "System creates earnings" ON public.creator_earnings FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- Fix overly permissive INSERT on platform_earnings  
DROP POLICY IF EXISTS "System creates platform earnings" ON public.platform_earnings;
CREATE POLICY "System creates platform earnings" ON public.platform_earnings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
