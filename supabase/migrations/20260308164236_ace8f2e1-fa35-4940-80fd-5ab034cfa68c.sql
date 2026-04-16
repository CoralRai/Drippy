CREATE TABLE public.saved_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  top_item_id UUID REFERENCES public.clothing_items(id),
  bottom_item_id UUID REFERENCES public.clothing_items(id),
  footwear_item_id UUID REFERENCES public.clothing_items(id),
  outerwear_item_id UUID REFERENCES public.clothing_items(id),
  accessory_item_id UUID REFERENCES public.clothing_items(id),
  total_score INTEGER NOT NULL DEFAULT 0,
  occasion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved outfits" ON public.saved_outfits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved outfits" ON public.saved_outfits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved outfits" ON public.saved_outfits FOR DELETE TO authenticated USING (auth.uid() = user_id);