-- Create storage bucket for outfit images
INSERT INTO storage.buckets (id, name, public)
VALUES ('outfit-images', 'outfit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create outfit_analyses table
CREATE TABLE IF NOT EXISTS public.outfit_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.outfit_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view outfit analyses (public app)
CREATE POLICY "Anyone can view outfit analyses"
  ON public.outfit_analyses
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert outfit analyses
CREATE POLICY "Anyone can insert outfit analyses"
  ON public.outfit_analyses
  FOR INSERT
  WITH CHECK (true);

-- Create storage policies for outfit images
CREATE POLICY "Anyone can view outfit images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'outfit-images');

CREATE POLICY "Anyone can upload outfit images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'outfit-images');

CREATE POLICY "Anyone can update outfit images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'outfit-images');

CREATE POLICY "Anyone can delete outfit images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'outfit-images');