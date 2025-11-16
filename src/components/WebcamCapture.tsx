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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use Mira AI.",
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
