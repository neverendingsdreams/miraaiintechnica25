-- Create outfit_suggestions table to store AI-generated suggestions
CREATE TABLE IF NOT EXISTS public.outfit_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_analysis_id UUID REFERENCES public.outfit_analyses(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  item_type TEXT NOT NULL,
  search_term TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outfit_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for outfit_suggestions
CREATE POLICY "Anyone can view outfit suggestions"
ON public.outfit_suggestions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert outfit suggestions"
ON public.outfit_suggestions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update outfit suggestions"
ON public.outfit_suggestions
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete outfit suggestions"
ON public.outfit_suggestions
FOR DELETE
USING (true);