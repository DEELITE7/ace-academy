
-- 1. Extend quiz_sets with marketplace fields
ALTER TABLE public.quiz_sets
  ADD COLUMN IF NOT EXISTS creator_id uuid,
  ADD COLUMN IF NOT EXISTS public_quiz_code text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_monetized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS owner_share_percent integer NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS platform_share_percent integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS total_plays integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_count integer NOT NULL DEFAULT 0;

-- Unique constraint on public_quiz_code
ALTER TABLE public.quiz_sets ADD CONSTRAINT quiz_sets_public_quiz_code_key UNIQUE (public_quiz_code);

-- Index for search
CREATE INDEX IF NOT EXISTS idx_quiz_sets_status ON public.quiz_sets (status);
CREATE INDEX IF NOT EXISTS idx_quiz_sets_public_quiz_code ON public.quiz_sets (public_quiz_code);
CREATE INDEX IF NOT EXISTS idx_quiz_sets_creator_id ON public.quiz_sets (creator_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sets_tags ON public.quiz_sets USING GIN (tags);

-- Function to generate unique quiz code
CREATE OR REPLACE FUNCTION public.generate_quiz_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code text;
  exists_already boolean;
BEGIN
  LOOP
    code := 'QZ-' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.quiz_sets WHERE public_quiz_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-generate quiz code on insert
CREATE OR REPLACE FUNCTION public.set_quiz_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_quiz_code IS NULL OR NEW.public_quiz_code = '' THEN
    NEW.public_quiz_code := public.generate_quiz_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_quiz_code
  BEFORE INSERT ON public.quiz_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quiz_code();

-- 2. Quiz purchases table
CREATE TABLE public.quiz_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_set_id uuid NOT NULL REFERENCES public.quiz_sets(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  creator_share numeric NOT NULL DEFAULT 0,
  platform_share numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_provider text,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.quiz_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own purchases" ON public.quiz_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin views all purchases" ON public.quiz_purchases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages purchases" ON public.quiz_purchases FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_quiz_purchases_user ON public.quiz_purchases (user_id);
CREATE INDEX idx_quiz_purchases_quiz ON public.quiz_purchases (quiz_set_id);

-- 3. Payment transactions table
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_set_id uuid NOT NULL REFERENCES public.quiz_sets(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.quiz_purchases(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  provider text,
  provider_reference text,
  status text NOT NULL DEFAULT 'pending',
  type text NOT NULL DEFAULT 'purchase',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin views all transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System creates transactions" ON public.payment_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Creator earnings ledger
CREATE TABLE public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  quiz_set_id uuid NOT NULL REFERENCES public.quiz_sets(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.quiz_purchases(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payout_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators view own earnings" ON public.creator_earnings FOR SELECT TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Admin views all earnings" ON public.creator_earnings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System creates earnings" ON public.creator_earnings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin manages earnings" ON public.creator_earnings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings (creator_id);

-- 5. Platform earnings ledger
CREATE TABLE public.platform_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_set_id uuid NOT NULL REFERENCES public.quiz_sets(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.quiz_purchases(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin views platform earnings" ON public.platform_earnings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System creates platform earnings" ON public.platform_earnings FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Update RLS on quiz_sets for public marketplace
-- Drop old restrictive policies and replace
DROP POLICY IF EXISTS "Quiz sets viewable by auth users" ON public.quiz_sets;
DROP POLICY IF EXISTS "Admins manage quiz sets" ON public.quiz_sets;

-- Anyone can view published quizzes (even anon)
CREATE POLICY "Published quizzes viewable by anyone" ON public.quiz_sets FOR SELECT TO public USING (status = 'published' AND is_visible = true);

-- Creators can view all their own quizzes
CREATE POLICY "Creators view own quizzes" ON public.quiz_sets FOR SELECT TO authenticated USING (auth.uid() = creator_id);

-- Creators can insert their own quizzes
CREATE POLICY "Creators insert own quizzes" ON public.quiz_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own quizzes
CREATE POLICY "Creators update own quizzes" ON public.quiz_sets FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- Creators can delete their own quizzes
CREATE POLICY "Creators delete own quizzes" ON public.quiz_sets FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Admin can do everything
CREATE POLICY "Admin manages all quizzes" ON public.quiz_sets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update existing quiz_sets data: set status to published for existing visible quizzes
UPDATE public.quiz_sets SET status = 'published' WHERE is_visible = true AND status = 'draft';

-- 8. Generate public codes for existing quizzes that don't have one
UPDATE public.quiz_sets SET public_quiz_code = public.generate_quiz_code() WHERE public_quiz_code IS NULL;
