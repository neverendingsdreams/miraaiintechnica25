import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
}

const VoiceInterface = ({ onSpeakingChange }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const speechResult = event.results[0][0].transcript;
        console.log('User said:', speechResult);
        setTranscript(speechResult);
        setIsListening(false);
        
        // Process with AI
        await processUserInput(speechResult);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast({
            title: "No speech detected",
            description: "Please try speaking again.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to recognize speech. Please try again.",
            variant: "destructive"
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const processUserInput = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Call edge function for AI response
      const { data, error } = await supabase.functions.invoke('voice-chat', {
        body: { text }
      });

      if (error) throw error;

      const responseText = data.text;
      console.log('Mira says:', responseText);

      // Speak the response
      if (synthRef.current && responseText) {
        onSpeakingChange(true);
        
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a female voice
        const voices = synthRef.current.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen') ||
          voice.name.includes('Moira')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.onend = () => {
          onSpeakingChange(false);
          setIsProcessing(false);
        };

        utterance.onerror = () => {
          onSpeakingChange(false);
          setIsProcessing(false);
          toast({
            title: "Playback Error",
            description: "Failed to speak response.",
            variant: "destructive"
          });
        };

        synthRef.current.speak(utterance);
      } else {
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Error processing input:', error);
      setIsProcessing(false);
      onSpeakingChange(false);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get response from Mira.",
        variant: "destructive"
      });
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsListening(true);
      setTranscript('');
      recognitionRef.current.start();
      
      toast({
        title: "Listening...",
        description: "Speak your fashion question!",
      });
    } catch (error: any) {
      console.error('Error starting recognition:', error);
      
      let errorMessage = "Failed to start listening.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone access denied. Please allow microphone access.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsListening(false);
    setIsProcessing(false);
    onSpeakingChange(false);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      {!isListening && !isProcessing ? (
        <Button
          onClick={startListening}
          size="lg"
          className="rounded-full px-8 py-6 shadow-elegant hover:shadow-glow transition-all duration-300 bg-gradient-fashion hover:scale-105"
        >
          <Mic className="mr-2 h-5 w-5" />
          Talk to Mira
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className={`rounded-full p-4 ${isListening ? 'bg-red-500/20 animate-pulse' : 'bg-accent'} transition-all duration-300`}>
            {isProcessing ? (
              <Loader2 className="h-8 w-8 text-accent-foreground animate-spin" />
            ) : (
              <Mic className="h-8 w-8 text-accent-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {isListening ? 'Listening...' : isProcessing ? 'Mira is thinking...' : 'Processing...'}
          </p>
          {transcript && (
            <p className="text-xs text-muted-foreground text-center max-w-xs italic">
              "{transcript}"
            </p>
          )}
          <Button
            onClick={stopListening}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            <MicOff className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
