import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles, Mic, MicOff, Image as ImageIcon, X, Video, VideoOff, Camera, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  productLinks?: Array<{ title: string; url: string; price?: string }>;
}

interface UnifiedChatInterfaceProps {
  onShowCamera: () => void;
  onSpeakingChange: (speaking: boolean) => void;
  onAnalyzeOutfit?: (imageData: string) => Promise<void>;
}

export const UnifiedChatInterface = ({ onShowCamera, onSpeakingChange, onAnalyzeOutfit }: UnifiedChatInterfaceProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  // Load user preferences
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setInputText(speechResult);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast({
            title: "Speech Error",
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
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update speaking state
  useEffect(() => {
    onSpeakingChange(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  const startListening = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current?.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 20MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeLiveOutfit = async () => {
    if (!liveVideoRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    const video = liveVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      
      try {
        const { data, error } = await supabase.functions.invoke('analyze-outfit', {
          body: { image: imageData }
        });
        
        if (error) throw error;
        
        setLiveAnalysis(data.analysis);
        
        // Speak the analysis
        if (synthRef.current) {
          synthRef.current.cancel();
          const utterance = new SpeechSynthesisUtterance(data.analysis);
          utterance.rate = 1.0;
          
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
          
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          
          synthRef.current.speak(utterance);
        }
      } catch (error: any) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze outfit",
          variant: "destructive"
        });
      }
    }
    
    setIsAnalyzing(false);
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      // Stop monitoring
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      setIsMonitoring(false);
      setLiveAnalysis('');
      toast({
        title: "Monitoring Stopped",
        description: "Continuous outfit analysis has been stopped",
      });
    } else {
      // Start monitoring
      setIsMonitoring(true);
      analyzeLiveOutfit(); // Immediate first analysis
      
      // Then analyze every 10 seconds
      monitoringIntervalRef.current = setInterval(() => {
        analyzeLiveOutfit();
      }, 10000);
      
      toast({
        title: "Monitoring Started",
        description: "Mira will analyze your outfit every 10 seconds",
      });
    }
  };

  const toggleLiveCamera = async () => {
    if (isLiveCameraActive) {
      // Stop camera and monitoring
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      setIsMonitoring(false);
      setLiveAnalysis('');
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsLiveCameraActive(false);
    } else {
      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setCameraStream(stream);
        setIsLiveCameraActive(true);
        
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
        
        toast({
          title: "Camera Active",
          description: "Live feed is now visible to Mira",
        });
      } catch (error) {
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const captureLiveFrame = () => {
    if (!liveVideoRef.current || !isLiveCameraActive) return;
    
    const video = liveVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'live-capture.jpg', { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);
          setUploadedImage(imageUrl);
          setUploadedImageFile(file);
          
          toast({
            title: "Frame Captured",
            description: "Image ready to send",
          });
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Update video stream when ref changes
  useEffect(() => {
    if (liveVideoRef.current && cameraStream) {
      liveVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isLiveCameraActive]);

  const sendMessage = async () => {
    if ((!inputText.trim() && !uploadedImage) || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText.trim() || "What do you think of this outfit?",
      timestamp: new Date(),
      imageUrl: uploadedImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    const currentImage = uploadedImage;
    removeUploadedImage();
    setIsProcessing(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestBody: any = {
        text: userMessage.content,
        conversationHistory: [...conversationHistory, { role: 'user', content: userMessage.content }],
        userPreferences,
      };

      // If there's an image, include it
      if (currentImage) {
        requestBody.imageData = currentImage;
      }

      const { data, error } = await supabase.functions.invoke('voice-chat', {
        body: requestBody,
      });

      if (error) throw error;

      if (data.action === 'show_camera') {
        const confirmMessage: Message = {
          role: 'assistant',
          content: data.text || "Let me open the camera for you!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMessage]);
        setTimeout(() => onShowCamera(), 500);
        setIsProcessing(false);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
        imageUrl: data.imageUrl,
        productLinks: data.productLinks,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      if (synthRef.current && data.text) {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.rate = 1.0;
        
        const voices = synthRef.current.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        synthRef.current.speak(utterance);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-fashion rounded-t-lg">
        <Sparkles className="w-5 h-5 text-white" />
        <div>
          <h3 className="font-semibold text-white">Chat with Mira</h3>
          <p className="text-xs text-white/80">
            {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Type, speak, or upload an image"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary/50" />
              <p className="text-sm">Start a conversation with Mira!</p>
              <p className="text-xs mt-2">Type, speak, or share an outfit photo for personalized advice.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.imageUrl && msg.role === 'user' && (
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded outfit" 
                      className="mb-2 rounded-lg max-w-full h-auto max-h-64 object-cover"
                    />
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.imageUrl && msg.role === 'assistant' && (
                    <img 
                      src={msg.imageUrl} 
                      alt="Outfit suggestion" 
                      className="mt-2 rounded-lg max-w-full h-auto"
                    />
                  )}
                  
                  {msg.productLinks && msg.productLinks.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold opacity-80">Recommended Products:</p>
                      {msg.productLinks.map((product, pIdx) => (
                        <a
                          key={pIdx}
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-background/50 rounded border border-border hover:bg-background transition-colors"
                        >
                          <p className="text-sm font-medium">{product.title}</p>
                          {product.price && (
                            <p className="text-xs opacity-70">{product.price}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Live Camera Feed */}
      {isLiveCameraActive && (
        <div className="px-4 pb-2 bg-accent/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="relative rounded-lg overflow-hidden">
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  size="sm"
                  onClick={captureLiveFrame}
                  className="bg-gradient-fashion"
                  disabled={isAnalyzing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                {onAnalyzeOutfit && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!liveVideoRef.current) return;
                      
                      const video = liveVideoRef.current;
                      const canvas = document.createElement('canvas');
                      canvas.width = video.videoWidth;
                      canvas.height = video.videoHeight;
                      
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(video, 0, 0);
                        const imageData = canvas.toDataURL('image/jpeg');
                        await onAnalyzeOutfit(imageData);
                      }
                    }}
                    className="bg-gradient-fashion"
                    disabled={isAnalyzing}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={isMonitoring ? "default" : "outline"}
                  onClick={toggleMonitoring}
                  className={isMonitoring ? "bg-gradient-fashion" : ""}
                  disabled={isAnalyzing}
                >
                  {isMonitoring ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {isMonitoring ? "Monitoring" : "Monitor"}
                </Button>
              </div>
              
              {/* Analysis status indicator */}
              {isAnalyzing && (
                <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs font-medium">Analyzing...</span>
                </div>
              )}
            </div>
            
            {/* Live Analysis Panel */}
            {(isMonitoring || liveAnalysis) && (
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Live Feedback</h3>
                  {isMonitoring && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                
                {liveAnalysis ? (
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">{liveAnalysis}</p>
                    <p className="text-xs text-muted-foreground">
                      {isMonitoring ? 'Next analysis in 10 seconds...' : 'Start monitoring for continuous feedback'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground text-center">
                      {isMonitoring ? 'Analyzing your outfit...' : 'Click "Monitor" to start continuous analysis'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {uploadedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={uploadedImage} 
              alt="Upload preview" 
              className="max-h-32 rounded-lg border border-border"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeUploadedImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          
          <Button
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={isLiveCameraActive ? "default" : "outline"}
            onClick={toggleLiveCamera}
            disabled={isProcessing}
            className={isLiveCameraActive ? "bg-gradient-fashion" : ""}
          >
            {isLiveCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>

          <Button
            size="icon"
            variant={isListening ? "default" : "outline"}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1"
          />
          
          <Button
            onClick={sendMessage}
            disabled={(!inputText.trim() && !uploadedImage) || isProcessing}
            size="icon"
            className="bg-gradient-fashion hover:opacity-90"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
