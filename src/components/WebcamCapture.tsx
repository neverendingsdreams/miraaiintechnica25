import React, { useRef, useState, useCallback } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isAnalyzing: boolean;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const { toast } = useToast();

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

      console.log('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Stream set to video element');
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, playing video...');
          videoRef.current?.play().then(() => {
            console.log('Video playing successfully');
            setIsStreaming(true);
            setIsCameraReady(true);
          }).catch(playError => {
            console.error('Error playing video:', playError);
            toast({
              title: "Video Playback Error",
              description: "Failed to play camera feed. Please try again.",
              variant: "destructive"
            });
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          toast({
            title: "Video Error",
            description: "There was an error with the video element.",
            variant: "destructive"
          });
        };
      } else {
        console.error('Video ref is null');
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
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
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            videoRef.current.play();
            setIsStreaming(true);
            setIsCameraReady(true);
            return;
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      toast({
        title: "Camera Access Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setIsCameraReady(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !isCameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
    }
  }, [onCapture, isCameraReady]);

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
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/95 to-transparent">
              <div className="flex gap-3 justify-center">
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
                  onClick={stopCamera}
                  variant="secondary"
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
