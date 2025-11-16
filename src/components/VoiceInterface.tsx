import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
  onShowCamera: () => void;
}

const VoiceInterface = ({ onSpeakingChange, onShowCamera }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Load user preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mira_user_preferences');
    if (saved) {
      try {
        setUserPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load user preferences');
      }
    }
  }, []);

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

        // Local keyword fallback to open camera immediately
        const lower = (speechResult || '').toLowerCase();
        const cameraPhrases = [
          /\bsee (my|me) outfit\b/,
          /\bopen (the )?camera\b/,
          /\bshow (me )?camera\b/,
          /\b(analyze|analyse|check|look at) (my|this) outfit\b/,
          /\bsee my look\b/,
          /\bcheck my look\b/,
          /\bcamera\b.*\boutfit\b/,
        ];
        if (cameraPhrases.some((r) => r.test(lower))) {
          try {
            // Speak confirmation using ElevenLabs
            const { data: audioData } = await supabase.functions.invoke('text-to-speech', {
              body: { text: "Opening the camera. Stand about 2 steps back so I can see your outfit.", voice: 'Aria' }
            });
            if (audioData?.audioContent) {
              const audio = new Audio(`data:audio/mpeg;base64,${audioData.audioContent}`);
              audio.play();
            }
          } catch {}
          onShowCamera();
          return;
        }
        
        // Otherwise, process with AI (which may also trigger camera via tool)
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

  const processUserInput = async (text: string, isProactive = false) => {
    setIsProcessing(true);
    
    try {
      // Add user message to history if not proactive
      if (!isProactive && text) {
        setConversationHistory(prev => [...prev, { role: 'user', content: text }]);
      }

      // Call edge function for AI response
      const { data, error } = await supabase.functions.invoke('voice-chat', {
        body: { 
          text,
          conversationHistory,
          isProactive
        }
      });

      if (error) throw error;

      // Check if AI wants to show camera
      if (data.action === 'show_camera') {
        console.log('Opening camera for outfit analysis');
        
        // Speak the message first using ElevenLabs
        if (data.text) {
          try {
            const { data: audioData } = await supabase.functions.invoke('text-to-speech', {
              body: { text: data.text, voice: 'Aria' }
            });
            
            if (audioData?.audioContent) {
              const audio = new Audio(`data:audio/mpeg;base64,${audioData.audioContent}`);
              audio.onended = () => {
                onShowCamera();
                setIsProcessing(false);
              };
              await audio.play();
            } else {
              onShowCamera();
              setIsProcessing(false);
            }
          } catch {
            onShowCamera();
            setIsProcessing(false);
          }
        } else {
          onShowCamera();
          setIsProcessing(false);
        }
        return;
      }

      const responseText = data.text;
      console.log('Mira says:', responseText);

      // Add assistant response to conversation history
      if (responseText) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      }

      // Speak the response using ElevenLabs
      if (responseText) {
        onSpeakingChange(true);
        setIsSpeaking(true);
        
        try {
          const { data: audioData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
            body: { text: responseText, voice: 'Aria' }
          });

          if (ttsError) throw ttsError;

          if (audioData?.audioContent) {
            const audio = new Audio(`data:audio/mpeg;base64,${audioData.audioContent}`);
            audio.onended = () => {
              onSpeakingChange(false);
              setIsSpeaking(false);
              setIsProcessing(false);
            };
            audio.onerror = () => {
              onSpeakingChange(false);
              setIsSpeaking(false);
              setIsProcessing(false);
              toast({
                title: "Playback Error",
                description: "Failed to play audio.",
                variant: "destructive"
              });
            };
            await audio.play();
          } else {
            onSpeakingChange(false);
            setIsSpeaking(false);
            setIsProcessing(false);
          }
        } catch (error: any) {
          console.error('TTS error:', error);
          onSpeakingChange(false);
          setIsSpeaking(false);
          setIsProcessing(false);
          toast({
            title: "Audio Error",
            description: "Failed to generate speech.",
            variant: "destructive"
          });
        }
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
    setIsSpeaking(false);
    onSpeakingChange(false);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    setIsProcessing(false);
    onSpeakingChange(false);
    
    toast({
      title: "Stopped",
      description: "Mira stopped speaking.",
    });
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
      {!isListening && !isProcessing && !isSpeaking ? (
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
          <div className={`rounded-full p-4 ${isListening ? 'bg-red-500/20 animate-pulse' : isSpeaking ? 'bg-green-500/20 animate-pulse' : 'bg-accent'} transition-all duration-300`}>
            {isProcessing ? (
              <Loader2 className="h-8 w-8 text-accent-foreground animate-spin" />
            ) : (
              <Mic className="h-8 w-8 text-accent-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {isListening ? 'Listening...' : isSpeaking ? 'Mira is speaking...' : isProcessing ? 'Mira is thinking...' : 'Processing...'}
          </p>
          {transcript && (
            <p className="text-xs text-muted-foreground text-center max-w-xs italic">
              "{transcript}"
            </p>
          )}
          <div className="flex gap-2 mt-2">
            {isSpeaking && (
              <Button
                onClick={stopSpeaking}
                variant="destructive"
                size="sm"
                className="animate-pulse"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Mira
              </Button>
            )}
            {!isSpeaking && (
              <Button
                onClick={stopListening}
                variant="secondary"
                size="sm"
              >
                <MicOff className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
