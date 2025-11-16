import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TshirtDesign {
  id: string;
  image_url: string;
  description: string;
  color: string;
  pattern: string;
  style: string;
}

interface TshirtSelectorProps {
  onSelect: (design: TshirtDesign) => void;
  selectedId?: string;
}

export const TshirtSelector = ({ onSelect, selectedId }: TshirtSelectorProps) => {
  const [designs, setDesigns] = useState<TshirtDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('tshirt_designs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching t-shirt designs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewDesign = async () => {
    setIsGenerating(true);
    try {
      const colors = ['white', 'black', 'navy', 'gray', 'red', 'blue', 'green'];
      const patterns = ['solid', 'striped', 'graphic', 'minimalist'];
      const styles = ['casual', 'sporty', 'formal', 'vintage'];

      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];

      const { data, error } = await supabase.functions.invoke('generate-tshirt-designs', {
        body: { 
          color: randomColor,
          pattern: randomPattern,
          style: randomStyle
        }
      });

      if (error) throw error;

      if (data?.design) {
        setDesigns(prev => [data.design, ...prev]);
      }
    } catch (error) {
      console.error('Error generating design:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Select a T-shirt</h3>
        <Button
          onClick={generateNewDesign}
          disabled={isGenerating}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate New
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-2 gap-3 pr-4">
          {designs.map((design) => (
            <Card
              key={design.id}
              className={`cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
                selectedId === design.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(design)}
            >
              <div className="aspect-square relative bg-muted">
                <img
                  src={design.image_url}
                  alt={design.description}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  {design.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};