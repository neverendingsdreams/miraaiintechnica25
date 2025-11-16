import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, History, MessageCircle, Image as ImageIcon, Mic, Settings as SettingsIcon, LogOut, Loader2 } from 'lucide-react';
import { UnifiedChatInterface } from '@/components/UnifiedChatInterface';
import WebcamCapture from '@/components/WebcamCapture';
import { OutfitHistory } from '@/components/OutfitHistory';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import fashion1 from '@/assets/fashion-1.jpg';
import fashion2 from '@/assets/fashion-2.jpg';
import fashion3 from '@/assets/fashion-3.jpg';
import fashion4 from '@/assets/fashion-4.jpg';
import miraLogo from '@/assets/mira-logo.png';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const hasCompletedQuiz = localStorage.getItem('mira_user_preferences');
    if (!hasCompletedQuiz && user) {
      navigate('/quiz');
    }
  }, [navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          analysis,
          user_id: user!.id
        });

      if (dbError) {
        console.error('Error saving to database:', dbError);
      }

      // Auto-close camera after successful analysis
      stopCameraStream();
      setTimeout(() => setShowCamera(false), 500);

      // Speak the analysis using browser TTS
      setIsSpeaking(true);
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(analysis);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      utter.onend = () => setIsSpeaking(false);
      synth.cancel();
      synth.speak(utter);

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
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      {/* Fashion Photo Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 blur-[2px]">
        <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full p-4">
          <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-elegant">
            <img src={fashion2} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-elegant">
            <img src={fashion1} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-elegant">
            <img src={fashion4} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-elegant">
            <img src={fashion3} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
      {/* Floating Fashion Accents - Hidden on Mobile */}
      <div className="hidden lg:block absolute left-8 top-1/4 w-32 h-48 rounded-2xl overflow-hidden shadow-elegant opacity-30 blur-sm pointer-events-none animate-float">
        <img src={fashion4} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="hidden lg:block absolute right-8 top-1/3 w-40 h-56 rounded-2xl overflow-hidden shadow-elegant opacity-25 blur-sm pointer-events-none animate-float" style={{ animationDelay: '1s' }}>
        <img src={fashion2} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="hidden lg:block absolute left-12 bottom-1/4 w-36 h-24 rounded-2xl overflow-hidden shadow-elegant opacity-20 blur-sm pointer-events-none animate-float" style={{ animationDelay: '2s' }}>
        <img src={fashion3} alt="" className="w-full h-full object-cover" />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10">
      <ThemeSelector />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={miraLogo} 
                alt="Mira AI Logo" 
                className="h-16 w-16 object-contain animate-scale-in hover-scale drop-shadow-elegant"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-fashion bg-clip-text text-transparent">
                  Mira AI
                </h1>
                <p className="text-sm text-muted-foreground">Your Personal Fashion Stylist</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/settings')}
                variant="outline"
                className="gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Button>
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="outline"
                className="gap-2"
              >
                <History className="h-4 w-4" />
                {showHistory ? 'Hide' : 'History'}
              </Button>
              <Button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/auth');
                }}
                variant="outline"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Logo Hero Section */}
          <div className="flex flex-col items-center gap-6 animate-fade-in mb-8">
            <img 
              src={miraLogo} 
              alt="Mira AI Fashion Stylist" 
              className="h-72 w-72 object-contain animate-float hover-scale transition-all duration-500 drop-shadow-elegant"
            />
            <div className="text-center space-y-3 mb-56">
              <h1 className="text-5xl font-bold bg-gradient-spooky bg-clip-text text-transparent">
                MiraAI: Your Personal AI Fashion Stylist
              </h1>
              <p className="text-2xl text-muted-foreground font-light italic">
                Where Fashion Moves With You
              </p>
            </div>
          </div>
          
          {/* Introduction */}
          <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl font-semibold tracking-tight">
              Chat with Your AI Fashion Assistant
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a natural conversation with Mira! Type, speak, or share outfit photos for personalized fashion advice.
            </p>
          </div>

          {/* Unified Chat Interface */}
          <div className="max-w-4xl mx-auto h-[700px]">
      <UnifiedChatInterface 
        onShowCamera={handleShowCamera}
        onSpeakingChange={setIsSpeaking}
        onAnalyzeOutfit={handleCapture}
      />
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
    </div>
  );
};

export default Index;
