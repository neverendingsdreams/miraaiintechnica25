import { useRef, useCallback, useEffect } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

export const useBodySegmentation = () => {
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const initializeSegmenter = async () => {
      if (isInitializedRef.current) return;

      try {
        console.log('Initializing body segmenter...');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
        );

        segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
            delegate: "GPU"
          },
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });

        isInitializedRef.current = true;
        console.log('Body segmenter initialized');
      } catch (error) {
        console.error('Failed to initialize body segmenter:', error);
      }
    };

    initializeSegmenter();

    return () => {
      if (segmenterRef.current) {
        segmenterRef.current.close();
        segmenterRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  const segmentBody = useCallback(async (
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<ImageData | null> => {
    if (!segmenterRef.current || !videoElement || !canvasElement) {
      return null;
    }

    try {
      const segmentationResult = segmenterRef.current.segment(videoElement);
      
      if (!segmentationResult.categoryMask) {
        return null;
      }

      const ctx = canvasElement.getContext('2d');
      if (!ctx) return null;

      // Get the mask data
      const mask = segmentationResult.categoryMask.getAsUint8Array();
      const width = segmentationResult.categoryMask.width;
      const height = segmentationResult.categoryMask.height;

      // Create an ImageData object for the mask
      const imageData = ctx.createImageData(width, height);
      
      for (let i = 0; i < mask.length; i++) {
        // If mask value is 1 (person), make it visible, otherwise transparent
        const alpha = mask[i] === 1 ? 255 : 0;
        imageData.data[i * 4] = 255;     // R
        imageData.data[i * 4 + 1] = 255; // G
        imageData.data[i * 4 + 2] = 255; // B
        imageData.data[i * 4 + 3] = alpha; // A
      }

      return imageData;
    } catch (error) {
      console.error('Segmentation error:', error);
      return null;
    }
  }, []);

  return { segmentBody, isReady: isInitializedRef.current };
};