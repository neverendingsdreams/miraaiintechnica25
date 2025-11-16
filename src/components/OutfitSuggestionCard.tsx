import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface OutfitSuggestionCardProps {
  itemType: string;
  suggestionText: string;
  imageUrl?: string;
}

export const OutfitSuggestionCard = ({ 
  itemType, 
  suggestionText, 
  imageUrl 
}: OutfitSuggestionCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300">
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={itemType}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground capitalize">{itemType}</h3>
        <p className="text-sm text-muted-foreground">{suggestionText}</p>
      </div>
    </Card>
  );
};
