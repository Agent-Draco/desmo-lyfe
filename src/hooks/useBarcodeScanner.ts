import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProductInfo {
  name: string;
  brand?: string;
  category?: string;
  image?: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  const lookupBarcode = async (barcode: string): Promise<ProductInfo | null> => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        return {
          name: data.product.product_name || data.product.product_name_en || `Product ${barcode}`,
          brand: data.product.brands,
          category: data.product.categories?.split(",")[0],
          image: data.product.image_small_url,
        };
      }
      return null;
    } catch (error) {
      console.error("Barcode lookup error:", error);
      return null;
    }
  };

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setHasPermission(true);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
    } catch (error: any) {
      console.error("Camera access error:", error);
      setHasPermission(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan barcodes",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const captureFrame = useCallback((): ImageData | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  return {
    isScanning,
    hasPermission,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    captureFrame,
    lookupBarcode,
  };
};
