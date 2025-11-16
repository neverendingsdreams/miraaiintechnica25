import { useEffect, useRef, useState } from 'react';

interface UseWakeWordOptions {
  wakeWords: string[];
  onWakeWordDetected: () => void;
  enabled?: boolean;
}

export const useWakeWord = ({ wakeWords, onWakeWordDetected, enabled = true }: UseWakeWordOptions) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Initialize Web Speech API for wake word detection
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        
        console.log('Wake word listening:', transcript);
        
        // Check if any wake word is detected
        const wakeWordDetected = wakeWords.some(word => 
          transcript.includes(word.toLowerCase())
        );

        if (wakeWordDetected) {
          console.log('Wake word detected!');
          onWakeWordDetected();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Wake word recognition error:', event.error);
        // Auto-restart on error (except for specific errors)
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setTimeout(() => {
            if (enabled && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart wake word detection:', e);
              }
            }
          }, 1000);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart to keep listening for wake word
        if (enabled && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.error('Failed to restart wake word detection:', e);
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Wake word detection started');
      } catch (error) {
        console.error('Failed to start wake word detection:', error);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enabled, wakeWords, onWakeWordDetected]);

  return { isListening };
};
