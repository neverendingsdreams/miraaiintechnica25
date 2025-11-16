import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
}

const VoiceInterface = ({ onSpeakingChange }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice conversation connected');
      toast({
        title: "Connected!",
        description: "Mira is ready to chat. Start talking!",
      });
    },
    onDisconnect: () => {
      console.log('Voice conversation disconnected');
      onSpeakingChange(false);
    },
    onMessage: (message) => {
      console.log('Received message:', message);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Mira. Please try again.",
        variant: "destructive"
      });
      setIsConnecting(false);
    },
  });

  useEffect(() => {
    onSpeakingChange(conversation.isSpeaking);
  }, [conversation.isSpeaking, onSpeakingChange]);

  const startConversation = async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-session');

      if (error) throw error;
      
      if (!data.signed_url) {
        throw new Error('No signed URL received');
      }

      // Start the conversation with the signed URL
      await conversation.startSession({
        url: data.signed_url,
      });

      setIsConnecting(false);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      setIsConnecting(false);
      
      let errorMessage = "Failed to start voice conversation.";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access denied. Please allow microphone access to chat with Mira.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const endConversation = async () => {
    await conversation.endSession();
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      {conversation.status === 'disconnected' ? (
        <Button
          onClick={startConversation}
          disabled={isConnecting}
          size="lg"
          className="rounded-full px-8 py-6 shadow-elegant hover:shadow-glow transition-all duration-300 bg-gradient-fashion hover:scale-105"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              Talk to Mira
            </>
          )}
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className={`rounded-full p-4 ${conversation.isSpeaking ? 'bg-accent animate-pulse' : 'bg-muted'} transition-all duration-300`}>
            <Mic className="h-8 w-8 text-accent-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {conversation.isSpeaking ? 'Mira is speaking...' : 'Listening...'}
          </p>
          <Button
            onClick={endConversation}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Chat
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
