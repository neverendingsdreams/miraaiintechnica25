-- Create table for t-shirt designs
CREATE TABLE public.tshirt_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  color VARCHAR(50),
  pattern VARCHAR(50),
  style VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tshirt_designs ENABLE ROW LEVEL SECURITY;

-- Create policies for t-shirt designs (public read access)
CREATE POLICY "Anyone can view t-shirt designs" 
ON public.tshirt_designs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert t-shirt designs" 
ON public.tshirt_designs 
FOR INSERT 
WITH CHECK (true);

-- Insert some default t-shirt designs
INSERT INTO public.tshirt_designs (description, color, pattern, style, image_url) VALUES
  ('Classic white crew neck t-shirt', 'white', 'solid', 'casual', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'),
  ('Black v-neck t-shirt', 'black', 'solid', 'casual', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a'),
  ('Navy blue striped t-shirt', 'navy', 'striped', 'casual', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27'),
  ('Gray henley t-shirt', 'gray', 'solid', 'casual', 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34'),
  ('Red polo t-shirt', 'red', 'solid', 'casual', 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d');