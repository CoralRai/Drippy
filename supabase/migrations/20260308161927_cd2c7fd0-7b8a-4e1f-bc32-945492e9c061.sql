
-- User wardrobe table
CREATE TABLE public.user_wardrobe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('top', 'bottom', 'footwear', 'outerwear', 'accessory')),
  color text,
  style_tags text[] NOT NULL DEFAULT '{}'::text[],
  image_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_wardrobe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wardrobe" ON public.user_wardrobe FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wardrobe" ON public.user_wardrobe FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wardrobe" ON public.user_wardrobe FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wardrobe" ON public.user_wardrobe FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_user_wardrobe_user ON public.user_wardrobe(user_id);

-- Add color metadata to clothing_items
ALTER TABLE public.clothing_items ADD COLUMN IF NOT EXISTS primary_color text;
ALTER TABLE public.clothing_items ADD COLUMN IF NOT EXISTS color_hex text;
