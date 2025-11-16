import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Palette, TrendingUp, Star, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisResultsProps {
  analysis: string;
  onSpeak: () => void;
  isSpeaking: boolean;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, onSpeak, isSpeaking }) => {
  // Parse analysis sections (simple parsing)
  const sections = analysis.split('\n\n').filter(Boolean);

  return (
    <Card className="bg-gradient-subtle border-border/50 shadow-soft">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-fashion p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-2xl">Mira's Fashion Analysis</CardTitle>
          </div>
          <Button
            onClick={onSpeak}
            disabled={isSpeaking}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Volume2 className={`mr-2 h-4 w-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
            {isSpeaking ? 'Speaking...' : 'Hear Analysis'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border/50">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-6 w-6 fill-primary text-primary" />
            ))}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Style Score</p>
            <p className="text-lg font-semibold">Excellent Choice!</p>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const isColorSection = section.toLowerCase().includes('color');
            const isFitSection = section.toLowerCase().includes('fit');
            const isStyleSection = section.toLowerCase().includes('style');
            
            let icon = <Sparkles className="h-5 w-5" />;
            let iconBg = 'bg-primary/10 text-primary';
            
            if (isColorSection) {
              icon = <Palette className="h-5 w-5" />;
              iconBg = 'bg-secondary/10 text-secondary';
            } else if (isFitSection || isStyleSection) {
              icon = <TrendingUp className="h-5 w-5" />;
              iconBg = 'bg-accent/10 text-accent';
            }

            return (
              <div key={index} className="flex gap-3">
                <div className={`rounded-full p-2 h-fit ${iconBg}`}>
                  {icon}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {section}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confidence Badge */}
        <div className="flex justify-center pt-4">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            You're rocking this look!
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResults;
