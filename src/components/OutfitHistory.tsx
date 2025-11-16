import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SuggestionPanel } from './SuggestionPanel';

interface OutfitAnalysis {
  id: string;
  image_url: string;
  analysis: string;
  created_at: string;
}

interface Suggestion {
  item_type: string;
  suggestion_text: string;
  image_url?: string;
}

export const OutfitHistory = () => {
  const [history, setHistory] = useState<OutfitAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
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

  const handleOutfitClick = (outfit: OutfitAnalysis) => {
    setSelectedOutfit(outfit);
    setSuggestions([]);
  };

  const handleGetSuggestions = async () => {
    if (!selectedOutfit) return;

    setIsGeneratingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-outfit-suggestions', {
        body: {
          imageUrl: selectedOutfit.image_url,
          currentAnalysis: selectedOutfit.analysis
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        
        // Save suggestions to database
        const suggestionRecords = data.suggestions.map((s: Suggestion) => ({
          outfit_analysis_id: selectedOutfit.id,
          suggestion_text: s.suggestion_text,
          item_type: s.item_type,
          search_term: s.item_type,
          image_url: s.image_url
        }));

        await supabase.from('outfit_suggestions').insert(suggestionRecords);

        toast({
          title: "Suggestions Ready!",
          description: `Mira has ${data.suggestions.length} ideas for you.`
        });
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSuggestions(false);
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
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Your Outfit History</h2>
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
            {history.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-elegant transition-shadow cursor-pointer"
                onClick={() => handleOutfitClick(item)}
              >
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

      <Dialog open={!!selectedOutfit} onOpenChange={(open) => !open && setSelectedOutfit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Outfit Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedOutfit && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedOutfit.image_url}
                    alt="Selected outfit"
                    className="w-full rounded-lg object-cover"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(selectedOutfit.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Original Analysis</h3>
                    <p className="text-sm text-muted-foreground">{selectedOutfit.analysis}</p>
                  </div>
                  <Button 
                    onClick={handleGetSuggestions} 
                    disabled={isGeneratingSuggestions}
                    className="w-full"
                  >
                    {isGeneratingSuggestions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Ideas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get New Outfit Ideas
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {(suggestions.length > 0 || isGeneratingSuggestions) && (
                <SuggestionPanel 
                  suggestions={suggestions} 
                  isLoading={isGeneratingSuggestions}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
