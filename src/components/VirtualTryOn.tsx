import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TshirtSelector } from './TshirtSelector';
import { useBodySegmentation } from '@/hooks/useBodySegmentation';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TshirtDesign {
  id: string;
  image_url: string;
  description: string;
  color: string;
  pattern: string;
  style: string;
}

interface VirtualTryOnProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onClose: () => void;
}

export const VirtualTryOn = ({ videoRef, onClose }: VirtualTryOnProps) => {
  const [mode, setMode] = useState<'overlay' | 'ai'>('overlay');
  const [selectedDesign, setSelectedDesign] = useState<TshirtDesign | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const { segmentBody } = useBodySegmentation();
  const { toast } = useToast();

  // Overlay mode: Real-time rendering
  useEffect(() => {
    if (mode !== 'overlay' || !selectedDesign || !videoRef.current || !overlayCanvasRef.current) {
      return;
    }

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderOverlay = async () => {
      if (!videoRef.current || !overlayCanvasRef.current) return;

      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get body segmentation
      const maskData = await segmentBody(video, canvas);

      if (maskData && selectedDesign) {
        // Simple overlay: place t-shirt in the center-top area
        const tshirtImg = new Image();
        tshirtImg.crossOrigin = 'anonymous';
        tshirtImg.src = selectedDesign.image_url;

        tshirtImg.onload = () => {
          const tshirtWidth = canvas.width * 0.4;
          const tshirtHeight = (tshirtImg.height / tshirtImg.width) * tshirtWidth;
          const x = (canvas.width - tshirtWidth) / 2;
          const y = canvas.height * 0.15;

          ctx.globalAlpha = 0.7;
          ctx.drawImage(tshirtImg, x, y, tshirtWidth, tshirtHeight);
          ctx.globalAlpha = 1.0;
        };
      }

      animationFrameId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [mode, selectedDesign, videoRef, segmentBody]);

  const captureImage = (): string => {
    if (!videoRef.current) return '';
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.9);
    }
    
    return '';
  };

  const handleAITryOn = async () => {
    if (!selectedDesign) {
      toast({
        title: "No T-shirt Selected",
        description: "Please select a t-shirt design first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const imageData = captureImage();
      setOriginalImage(imageData);

      console.log('Generating AI virtual try-on...');
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          userImage: imageData,
          tshirtDescription: selectedDesign.description
        }
      });

      if (error) throw error;

      if (data?.generatedImage) {
        setGeneratedImage(data.generatedImage);
        toast({
          title: "Virtual Try-on Complete!",
          description: "Check out how the t-shirt looks on you.",
        });
      }
    } catch (error: any) {
      console.error('AI try-on error:', error);
      toast({
        title: "Try-on Failed",
        description: error.message || "Failed to generate virtual try-on.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">Virtual Try-On</h2>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'overlay' | 'ai')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overlay">Quick Preview</TabsTrigger>
          <TabsTrigger value="ai">AI Realistic</TabsTrigger>
        </TabsList>

        <TabsContent value="overlay" className="space-y-4">
          <TshirtSelector
            onSelect={setSelectedDesign}
            selectedId={selectedDesign?.id}
          />

          <div className="relative rounded-lg overflow-hidden bg-muted">
            <canvas
              ref={overlayCanvasRef}
              className="w-full h-auto"
            />
            {!selectedDesign && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <p className="text-muted-foreground">Select a t-shirt to see preview</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Real-time preview with selected t-shirt overlay
          </p>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <TshirtSelector
            onSelect={setSelectedDesign}
            selectedId={selectedDesign?.id}
          />

          <Button
            onClick={handleAITryOn}
            disabled={!selectedDesign || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Realistic Preview'
            )}
          </Button>

          {(generatedImage || originalImage) && (
            <div className="grid grid-cols-2 gap-4">
              {originalImage && (
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">Original</p>
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
              {generatedImage && (
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">With New T-shirt</p>
                  <img
                    src={generatedImage}
                    alt="Virtual try-on result"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            AI-powered realistic virtual try-on (takes a few seconds)
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
};