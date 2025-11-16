import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Loader2, Sparkles, Hand, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { VirtualTryOn } from './VirtualTryOn';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isAnalyzing: boolean;
  onStreamReady?: (stream: MediaStream) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isAnalyzing, onStreamReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [gestureDetected, setGestureDetected] = useState<string | null>(null);
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize gesture recognizer
  useEffect(() => {
    const initGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        gestureRecognizerRef.current = recognizer;
        console.log('Gesture recognizer initialized');
      } catch (error) {
        console.error('Failed to initialize gesture recognizer:', error);
      }
    };

    initGestureRecognizer();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Start countdown from 60 seconds
    setCountdown(60);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-close after 60 seconds
    timeoutRef.current = setTimeout(() => {
      toast({
        title: "Camera Timeout",
        description: "Camera closed due to inactivity",
      });
      stopCamera();
    }, 60000);
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setCountdown(null);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsCameraReady(false);
    setGestureDetected(null);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setCountdown(null);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
    }
  }, [onCapture, isCameraReady]);

  // Detect gestures from video
  const detectGestures = useCallback(() => {
    if (!videoRef.current || !gestureRecognizerRef.current || !isCameraReady || isAnalyzing) {
      return;
    }

    try {
      const results = gestureRecognizerRef.current.recognizeForVideo(
        videoRef.current,
        performance.now()
      );

      if (results.gestures && results.gestures.length > 0) {
        const gesture = results.gestures[0][0];
        
        if (gesture.categoryName === 'Thumb_Up' && gesture.score > 0.7) {
          setGestureDetected('Thumb_Up');
          console.log('Thumbs up detected!');
          
          setTimeout(() => {
            captureImage();
            setGestureDetected(null);
          }, 500);
          
          return;
        }
      }
    } catch (error) {
      console.error('Gesture detection error:', error);
    }

    animationFrameRef.current = requestAnimationFrame(detectGestures);
  }, [isCameraReady, isAnalyzing, captureImage]);

  // Start gesture detection when camera is ready
  useEffect(() => {
    if (isCameraReady && !isAnalyzing) {
      detectGestures();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraReady, isAnalyzing, detectGestures]);

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.",
          variant: "destructive"
        });
        return;
      }

      // First show the video element by setting streaming state
      setIsStreaming(true);
      
      // Wait for next frame to ensure video element is rendered
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      console.log('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      console.log('Camera stream obtained:', stream);
      
      // Check if video ref is available after rendering
      if (!videoRef.current) {
        console.error('Video ref is still null after rendering');
        // Try one more time with a longer delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (videoRef.current) {
        console.log('Setting stream to video element...');
        videoRef.current.srcObject = stream;
        
        // Notify parent about stream
        if (onStreamReady) {
          onStreamReady(stream);
        }

        // Start 60 second timeout
        resetTimeout();
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, playing video...');
          videoRef.current?.play().then(() => {
            console.log('Video playing successfully');
            setIsCameraReady(true);
          }).catch(playError => {
            console.error('Error playing video:', playError);
            toast({
              title: "Video Playback Error",
              description: "Failed to play camera feed. Please try again.",
              variant: "destructive"
            });
            setIsStreaming(false);
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          toast({
            title: "Video Error",
            description: "There was an error with the video element.",
            variant: "destructive"
          });
          setIsStreaming(false);
        };
      } else {
        console.error('Video ref is null - stopping stream');
        stream.getTracks().forEach(track => track.stop());
        setIsStreaming(false);
        toast({
          title: "Camera Setup Error",
          description: "Failed to initialize video element. Please refresh and try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsStreaming(false);
      
      let errorMessage = "Please allow camera access to use Mira AI.";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission was denied. Please allow camera access in your browser settings and try again.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera constraints could not be satisfied. Trying with default settings...";
        
        // Try again with minimal constraints
        try {
          console.log('Retrying with minimal constraints...');
          setIsStreaming(true);
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            await videoRef.current.play();
            setIsCameraReady(true);
            return;
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          setIsStreaming(false);
        }
      }
      
      toast({
        title: "Camera Access Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);


  if (showVirtualTryOn && isStreaming) {
    return <VirtualTryOn videoRef={videoRef} onClose={() => setShowVirtualTryOn(false)} />;
  }

  return (
    <Card className="overflow-hidden bg-gradient-subtle border-border/50 shadow-elegant">
      <div className="relative aspect-video bg-muted/30">
        {!isStreaming ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
            <div className="rounded-full bg-gradient-fashion p-6 shadow-elegant">
              <Camera className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Ready to Style You</h3>
            <p className="text-center text-muted-foreground max-w-md">
              Let Mira see your outfit to provide personalized fashion advice and styling tips
            </p>
            <Button 
              onClick={startCamera}
              size="lg"
              className="bg-gradient-fashion text-white hover:opacity-90 transition-opacity shadow-elegant"
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          {countdown !== null && countdown <= 10 && (
            <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-semibold animate-pulse shadow-glow">
              Camera closing in {countdown}s
            </div>
          )}
          {gestureDetected && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse shadow-glow">
                <Hand className="h-5 w-5" />
                <span className="font-semibold">Thumbs Up Detected!</span>
              </div>
            )}
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
              </div>
            )}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Hand className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Show 👍 to capture</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/95 to-transparent">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={captureImage}
                  disabled={isAnalyzing || !isCameraReady}
                  size="lg"
                  className="bg-gradient-fashion text-white hover:opacity-90 transition-opacity shadow-elegant"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze Outfit
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowVirtualTryOn(true)}
                  disabled={!isCameraReady || isAnalyzing}
                  size="lg"
                  variant="secondary"
                >
                  <Shirt className="mr-2 h-5 w-5" />
                  Try Different T-shirts
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="lg"
                  disabled={isAnalyzing}
                >
                  Stop Camera
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default WebcamCapture;
