import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OutfitAnalysis {
  id: string;
  image_url: string;
  analysis: string;
  created_at: string;
}

export const OutfitHistory = () => {
  const [history, setHistory] = useState<OutfitAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('outfit_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load outfit history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No outfit analyses yet. Capture your first outfit to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Your Outfit History</h2>
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-elegant transition-shadow">
              <div className="aspect-square relative bg-muted">
                <img
                  src={item.image_url}
                  alt="Outfit"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-4">{item.analysis}</p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
