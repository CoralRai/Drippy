
-- Clothing items table (individual pieces for dynamic outfit generation)
CREATE TABLE public.clothing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('top', 'bottom', 'footwear', 'outerwear', 'accessory')),
  subcategory text,
  gender text NOT NULL DEFAULT 'unisex',
  body_types text[] NOT NULL DEFAULT '{}'::text[],
  style_tags text[] NOT NULL DEFAULT '{}'::text[],
  color_palette text[] NOT NULL DEFAULT '{}'::text[],
  fit_type text,
  occasions text[] NOT NULL DEFAULT '{}'::text[],
  amazon_link text,
  myntra_link text,
  flipkart_link text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Item compatibility graph (weighted edges between items)
CREATE TABLE public.item_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_a_id uuid REFERENCES public.clothing_items(id) ON DELETE CASCADE NOT NULL,
  item_b_id uuid REFERENCES public.clothing_items(id) ON DELETE CASCADE NOT NULL,
  compatibility_score integer NOT NULL DEFAULT 50 CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_a_id, item_b_id)
);

-- User interactions for personalization
CREATE TABLE public.user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'like', 'dislike', 'purchase')),
  outfit_id uuid REFERENCES public.outfits(id) ON DELETE SET NULL,
  clothing_item_id uuid REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  style_tags text[] NOT NULL DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reddit fashion data cache
CREATE TABLE public.reddit_fashion_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subreddit text NOT NULL,
  post_title text,
  extracted_items text[] NOT NULL DEFAULT '{}'::text[],
  extracted_combinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  sentiment_score numeric(3,2) DEFAULT 0,
  raw_content text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Generated outfits cache (AI-generated dynamic combos)
CREATE TABLE public.generated_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occasion text NOT NULL,
  top_item_id uuid REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  bottom_item_id uuid REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  footwear_item_id uuid REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  outerwear_item_id uuid REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  accessory_item_id uuid REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  total_score integer NOT NULL DEFAULT 50,
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  styling_tip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_fashion_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_outfits ENABLE ROW LEVEL SECURITY;

-- Clothing items: public read
CREATE POLICY "Anyone can view clothing items" ON public.clothing_items FOR SELECT USING (true);

-- Item compatibility: public read
CREATE POLICY "Anyone can view compatibility" ON public.item_compatibility FOR SELECT USING (true);

-- User interactions: users manage own
CREATE POLICY "Users can insert own interactions" ON public.user_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Reddit data: public read
CREATE POLICY "Anyone can view reddit data" ON public.reddit_fashion_data FOR SELECT USING (true);

-- Generated outfits: users manage own
CREATE POLICY "Users can view own generated outfits" ON public.generated_outfits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated outfits" ON public.generated_outfits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated outfits" ON public.generated_outfits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_clothing_items_category ON public.clothing_items(category);
CREATE INDEX idx_clothing_items_gender ON public.clothing_items(gender);
CREATE INDEX idx_item_compat_items ON public.item_compatibility(item_a_id, item_b_id);
CREATE INDEX idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX idx_generated_outfits_user ON public.generated_outfits(user_id, occasion);
CREATE INDEX idx_reddit_data_subreddit ON public.reddit_fashion_data(subreddit);
