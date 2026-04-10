
-- Add foreign key from quiz_sets.creator_id to profiles.user_id
ALTER TABLE public.quiz_sets
  ADD CONSTRAINT quiz_sets_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
