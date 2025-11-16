import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import VoiceInterface from '@/components/VoiceInterface';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();


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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl font-bold tracking-tight">
              Talk to Your AI Fashion Assistant
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a natural conversation with Mira! Ask for fashion advice, outfit suggestions,
              color coordination tips, and styling recommendations - all through voice.
            </p>
          </div>

          {/* Conversation Indicator */}
          <div className="text-center py-12">
            {isSpeaking ? (
              <div className="space-y-4 animate-fade-in">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-fashion flex items-center justify-center shadow-glow animate-pulse">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <p className="text-xl font-medium">Mira is speaking...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-xl font-medium text-muted-foreground">
                  Click below to start chatting
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-fashion/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice Conversation</h3>
              <p className="text-muted-foreground">
                Talk naturally with Mira and get instant fashion advice through voice.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-fashion/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalized Tips</h3>
              <p className="text-muted-foreground">
                Get tailored fashion recommendations based on your questions and preferences.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-fashion/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Help</h3>
              <p className="text-muted-foreground">
                Get immediate responses to your fashion questions in a natural conversation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Voice Interface */}
      <VoiceInterface onSpeakingChange={setIsSpeaking} />
    </div>
  );
};

export default Index;
