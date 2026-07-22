-- Migration to add photos array to tour_comments
ALTER TABLE public.tour_comments 
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.tour_comments.photos IS 'Array of photo URLs or base64 data URLs uploaded by the tourist for this review';
