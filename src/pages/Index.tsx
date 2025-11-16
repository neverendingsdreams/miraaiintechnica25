import { useState, useRef, useEffect } from 'react';
import { Sparkles, History, MessageCircle, Image as ImageIcon, Mic } from 'lucide-react';
import { UnifiedChatInterface } from '@/components/UnifiedChatInterface';
import WebcamCapture from '@/components/WebcamCapture';
import { OutfitHistory } from '@/components/OutfitHistory';
import { ThemeSelector } from '@/components/ThemeSelector';
import { PersonalizationQuiz, QuizAnswers } from '@/components/PersonalizationQuiz';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const { toast } = useToast();
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const hasCompletedQuiz = localStorage.getItem('mira_user_preferences');
    if (!hasCompletedQuiz) {
      setShowQuiz(true);
    }
  }, []);

  const handleQuizComplete = (answers: QuizAnswers) => {
    localStorage.setItem('mira_user_preferences', JSON.stringify(answers));
    setShowQuiz(false);
    toast({
      title: "Profile Saved!",
      description: "Mira will now provide personalized recommendations just for you.",
    });
  };

  const handleQuizSkip = () => {
    setShowQuiz(false);
    toast({
      title: "Skipped for Now",
      description: "You can always personalize your experience later from settings.",
    });
  };

  const handleShowCamera = () => {
    setShowCamera(true);
  };

  const handleCapture = async (imageData: string) => {
    setIsAnalyzing(true);
    
    try {
      console.log('Uploading image to storage...');
      
      // Convert base64 to blob
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();
      
      // Upload to Supabase Storage
      const fileName = `outfit-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('outfit-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('outfit-images')
        .getPublicUrl(fileName);

      console.log('Analyzing outfit...');
      const { data, error } = await supabase.functions.invoke('analyze-outfit', {
        body: { image: imageData }
      });

      if (error) throw error;

      const analysis = data.analysis;
      console.log('Analysis:', analysis);

      // Save to database
      const { error: dbError } = await supabase
        .from('outfit_analyses')
        .insert({
          image_url: publicUrl,
          analysis
        });

      if (dbError) {
        console.error('Error saving to database:', dbError);
      }

      // Auto-close camera after successful analysis
      stopCameraStream();
      setTimeout(() => setShowCamera(false), 500);

      // Speak the analysis
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(analysis);
      utterance.rate = 1.0;
      
      const voices = synth.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Moira')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synth.speak(utterance);

      toast({
        title: "Outfit Saved!",
        description: "Analysis saved to your history. Check it out in the History tab.",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      stopCameraStream();
      setShowCamera(false);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze outfit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      console.log('Camera stream stopped');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ThemeSelector />
      
      {showQuiz && (
        <PersonalizationQuiz 
          onComplete={handleQuizComplete}
          onSkip={handleQuizSkip}
        />
      )}
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
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
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              className="gap-2"
            >
              <History className="h-4 w-4" />
              {showHistory ? 'Hide' : 'History'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl font-bold tracking-tight">
              Chat with Your AI Fashion Assistant
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a natural conversation with Mira! Type, speak, or share outfit photos for personalized fashion advice.
            </p>
          </div>

          {/* Unified Chat Interface */}
          <div className="max-w-4xl mx-auto h-[700px]">
            <UnifiedChatInterface 
              onShowCamera={handleShowCamera}
              onSpeakingChange={setIsSpeaking}
            />
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-fashion/20 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice & Text Chat</h3>
              <p className="text-muted-foreground">
                Choose your preferred way to chat - speak naturally or type your questions.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-fashion/20 flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload & Analyze</h3>
              <p className="text-muted-foreground">
                Share outfit photos and get instant feedback from Mira's AI vision.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-fashion/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Visual Suggestions</h3>
              <p className="text-muted-foreground">
                Get AI-generated outfit images and personalized product recommendations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-3xl">
          <WebcamCapture 
            onCapture={handleCapture}
            isAnalyzing={isAnalyzing}
          />
        </DialogContent>
      </Dialog>

      {/* Outfit History Section */}
      {showHistory && (
        <div className="container mx-auto px-4 py-12">
          <OutfitHistory />
        </div>
      )}
    </div>
  );
};

export default Index;
