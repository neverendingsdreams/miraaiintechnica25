import { ScrollArea } from '@/components/ui/scroll-area';
import { OutfitSuggestionCard } from './OutfitSuggestionCard';
import { Sparkles, Loader2 } from 'lucide-react';

interface Suggestion {
  item_type: string;
  suggestion_text: string;
  image_url?: string;
}

interface SuggestionPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
}

export const SuggestionPanel = ({ suggestions, isLoading }: SuggestionPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating outfit suggestions...</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Mira's Suggestions</h2>
      </div>
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {suggestions.map((suggestion, index) => (
            <OutfitSuggestionCard
              key={index}
              itemType={suggestion.item_type}
              suggestionText={suggestion.suggestion_text}
              imageUrl={suggestion.image_url}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
