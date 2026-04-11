
-- Creator bank details table
CREATE TABLE public.creator_bank_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators view own bank details"
ON public.creator_bank_details FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Creators insert own bank details"
ON public.creator_bank_details FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators update own bank details"
ON public.creator_bank_details FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin views all bank details"
ON public.creator_bank_details FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_creator_bank_details_updated_at
BEFORE UPDATE ON public.creator_bank_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow authenticated users to insert courses (for auto-creation)
CREATE POLICY "Authenticated users can create courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (true);
