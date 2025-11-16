-- Clear existing data since we're adding authentication
DELETE FROM public.outfit_suggestions;
DELETE FROM public.outfit_analyses;

-- Add user_id column to outfit_analyses table
ALTER TABLE public.outfit_analyses 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- Add user_id column to outfit_suggestions table
ALTER TABLE public.outfit_suggestions 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view outfit analyses" ON public.outfit_analyses;
DROP POLICY IF EXISTS "Anyone can insert outfit analyses" ON public.outfit_analyses;

DROP POLICY IF EXISTS "Anyone can view outfit suggestions" ON public.outfit_suggestions;
DROP POLICY IF EXISTS "Anyone can insert outfit suggestions" ON public.outfit_suggestions;
DROP POLICY IF EXISTS "Anyone can update outfit suggestions" ON public.outfit_suggestions;
DROP POLICY IF EXISTS "Anyone can delete outfit suggestions" ON public.outfit_suggestions;

-- Create new RLS policies for outfit_analyses
CREATE POLICY "Users can view their own outfit analyses" 
ON public.outfit_analyses 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfit analyses" 
ON public.outfit_analyses 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfit analyses" 
ON public.outfit_analyses 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create new RLS policies for outfit_suggestions
CREATE POLICY "Users can view their own outfit suggestions" 
ON public.outfit_suggestions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfit suggestions" 
ON public.outfit_suggestions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfit suggestions" 
ON public.outfit_suggestions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfit suggestions" 
ON public.outfit_suggestions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);