import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import WebcamCapture from '@/components/WebcamCapture';
import AnalysisResults from '@/components/AnalysisResults';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCapture = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // Call analyze-outfit edge function
      const { data, error } = await supabase.functions.invoke('analyze-outfit', {
        body: { image: imageData }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      toast({
        title: "Analysis Complete!",
        description: "Mira has reviewed your outfit. Check out the recommendations below!",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze outfit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeak = async () => {
    if (!analysis || isSpeaking) return;

    setIsSpeaking(true);

    try {
      // Stop current audio if playing
      if (currentAudioUrl) {
        const audio = document.querySelector('audio');
        if (audio) {
          audio.pause();
          audio.remove();
        }
        URL.revokeObjectURL(currentAudioUrl);
      }

      // Call text-to-speech edge function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: analysis,
          voice: 'Aria' // Using ElevenLabs Aria voice
        }
      });

      if (error) throw error;

      // Convert base64 to audio and play
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      setCurrentAudioUrl(audioUrl);

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudioUrl(null);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive"
        });
      };
      
      await audio.play();
    } catch (error: any) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      toast({
        title: "Speech Failed",
        description: error.message || "Failed to generate speech. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-fashion p-3 shadow-elegant">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-fashion bg-clip-text text-transparent">
                Mira AI
              </h1>
              <p className="text-sm text-muted-foreground">Your Personal Fashion Stylist</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8">
          {/* Intro Section */}
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold text-foreground">
              Let's Style Your Look
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Show me your outfit and I'll provide personalized fashion advice on colors, fit, 
              style, and occasion-based recommendations to help you look your absolute best.
            </p>
          </div>

          {/* Webcam Section */}
          <WebcamCapture onCapture={handleCapture} isAnalyzing={isAnalyzing} />

          {/* Analysis Results */}
          {analysis && (
            <div className="animate-in fade-in-50 duration-500">
              <AnalysisResults 
                analysis={analysis} 
                onSpeak={handleSpeak}
                isSpeaking={isSpeaking}
              />
            </div>
          )}

          {/* Features */}
          {!analysis && (
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              {[
                {
                  title: "Color Analysis",
                  description: "Get expert advice on color harmony and combinations",
                  icon: "🎨"
                },
                {
                  title: "Fit & Style",
                  description: "Receive personalized recommendations on fit and silhouette",
                  icon: "✨"
                },
                {
                  title: "Occasion Tips",
                  description: "Learn how to style your outfit for any event",
                  icon: "🌟"
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border/50 shadow-soft text-center space-y-3">
                  <div className="text-4xl">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
