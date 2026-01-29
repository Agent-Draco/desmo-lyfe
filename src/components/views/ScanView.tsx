import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Keyboard, Barcode, X, Loader2, Check, Image } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import jsQR from "jsqr";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { createWorker } from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageAnnotatorClient } from "@google-cloud/vision";

interface ScanViewProps {
  onAddItem: (item: { name: string; barcode?: string; quantity?: number; unit?: string; exp?: string; mfg?: string; batch?: string }) => Promise<any>;
}

export const ScanView = ({ onAddItem }: ScanViewProps) => {
  const [mode, setMode] = useState<"choice" | "scan" | "photo" | "manual">("choice");
  const [manualName, setManualName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualUnit, setManualUnit] = useState("pcs");
  const [manualMfgDate, setManualMfgDate] = useState("");
  const [manualBatchNumber, setManualBatchNumber] = useState("");
  const [manualExpiryDate, setManualExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{
    name: string;
    barcode: string;
  } | null>(null);
  const [photoIntervalRef, setPhotoIntervalRef] = useState<number | null>(null);
  const [capturedData, setCapturedData] = useState<{
    name: string;
    mfg?: string;
    batch?: string;
    exp?: string;
  } | null>(null);

  const { videoRef, lookupBarcode, startScanning, stopScanning } = useBarcodeScanner();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanCountRef = useRef<Map<string, number>>(new Map());

  const barcodeDetectorRef = useRef<any | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isDecodingRef = useRef(false);

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      // Prevent duplicate scans
      if (lastScannedRef.current === barcode) return;
      
      // Require multiple consistent reads for accuracy
      const count = (scanCountRef.current.get(barcode) || 0) + 1;
      scanCountRef.current.set(barcode, count);
      
      // Only accept after 3 consistent reads
      if (count < 3) return;
      
      lastScannedRef.current = barcode;
      setLoading(true);
      stopScanning();
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      const product = await lookupBarcode(barcode);

      if (product) {
        setScannedProduct({
          name: product.name,
          barcode,
        });
      } else {
        setScannedProduct({
          name: `Product ${barcode}`,
          barcode,
        });
      }
      setLoading(false);
    },
    [lookupBarcode, stopScanning]
  );

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (isDecodingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    isDecodingRef.current = true;

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1) Native BarcodeDetector (best when available)
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (BarcodeDetectorCtor) {
        if (!barcodeDetectorRef.current) {
          barcodeDetectorRef.current = new BarcodeDetectorCtor({
            formats: [
              "qr_code",
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "code_93",
              "itf",
              "data_matrix",
              "pdf417",
              "aztec",
            ],
          });
        }

        const detections = await barcodeDetectorRef.current.detect(canvas);
        const raw = detections?.[0]?.rawValue;
        if (raw) {
          await handleBarcodeDetected(String(raw));
          return;
        }
      }

      // 2) ZXing fallback (supports 1D + 2D)
      if (!zxingReaderRef.current) {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.PDF_417,
          BarcodeFormat.AZTEC,
        ]);
        zxingReaderRef.current = new BrowserMultiFormatReader(hints);
      }

      try {
        const result = await zxingReaderRef.current.decodeFromCanvas(canvas);
        const text = result?.getText?.();
        if (text) {
          await handleBarcodeDetected(text);
          return;
        }
      } catch {
        // ignore not-found frames
      }

      // 3) jsQR fallback (QR-only, but very reliable for QR)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (qr?.data) {
        await handleBarcodeDetected(qr.data);
      }
    } finally {
      isDecodingRef.current = false;
    }
  }, [videoRef, handleBarcodeDetected]);

  const startJsQRScanner = useCallback(async () => {
    try {
      await startScanning();

      // Reset scan tracking
      lastScannedRef.current = null;
      scanCountRef.current.clear();

      // Start scanning loop
      scanIntervalRef.current = window.setInterval(() => {
        void scanFrame();
      }, 200);
    } catch (error) {
      console.error("Scanner error:", error);
    }
  }, [startScanning, scanFrame]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    // OCR with Tesseract.js
    const worker = await createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();

    // Gemini API for extracting dates and batch numbers
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Extract product name, manufacturing date, expiry date, and batch number from this text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const extractedText = response.text();

    // Google Vision API for product identification
    const visionClient = new ImageAnnotatorClient();
    const [resultVision] = await visionClient.textDetection(imageData);
    const detections = resultVision.textAnnotations;

    // Parse extracted data
    const lines = extractedText.split("\n");
    const name = lines.find(line => line.includes("name"))?.split(":")[1]?.trim() || "Unknown Product";
    const mfg = lines.find(line => line.includes("manufacturing"))?.split(":")[1]?.trim();
    const exp = lines.find(line => line.includes("expiry"))?.split(":")[1]?.trim();
    const batch = lines.find(line => line.includes("batch"))?.split(":")[1]?.trim();

    setCapturedData({
      name,
      mfg,
      batch,
      exp,
    });
  }, [videoRef]);

  const startPhotoCapture = useCallback(async () => {
    try {
      await startScanning();
      const interval = window.setInterval(() => {
        void capturePhoto();
      }, 5000); // Capture every 5 seconds
      setPhotoIntervalRef(interval);
    } catch (error) {
      console.error("Photo capture error:", error);
    }
  }, [startScanning, capturePhoto]);

  useEffect(() => {
    if (mode === "scan" && !scannedProduct) {
      startJsQRScanner();
    } else if (mode === "photo" && !capturedData) {
      startPhotoCapture();
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (photoIntervalRef) {
        clearInterval(photoIntervalRef);
        setPhotoIntervalRef(null);
      }
      stopScanning();
    };
  }, [mode, scannedProduct, capturedData, startJsQRScanner, startPhotoCapture, stopScanning, photoIntervalRef]);

  const handleAddScannedProduct = async () => {
    if (!scannedProduct) return;

    setLoading(true);
    await onAddItem({
      name: scannedProduct.name,
      barcode: scannedProduct.barcode,
    });
    setScannedProduct(null);
    setMode("choice");
    lastScannedRef.current = null;
    scanCountRef.current.clear();
    setLoading(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualMfgDate.trim() || !manualExpiryDate.trim()) return;

    setLoading(true);
    await onAddItem({
      name: manualName.trim(),
      quantity: parseInt(manualQuantity) || 1,
      unit: manualUnit,
      mfg: manualMfgDate.trim(),
      batch: manualBatchNumber.trim() || "-",
      exp: manualExpiryDate.trim(),
    });
    setManualName("");
    setManualQuantity("1");
    setManualUnit("pcs");
    setManualMfgDate("");
    setManualBatchNumber("");
    setManualExpiryDate("");
    setMode("choice");
    setLoading(false);
  };

  const handleAddCapturedData = async () => {
    if (!capturedData) return;

    setLoading(true);
    await onAddItem({
      name: capturedData.name,
      quantity: 1,
      unit: "pcs",
      mfg: capturedData.mfg,
      batch: capturedData.batch,
      exp: capturedData.exp,
    });
    setCapturedData(null);
    setMode("choice");
    setLoading(false);
  };

  const handleCloseScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (photoIntervalRef) {
      clearInterval(photoIntervalRef);
      setPhotoIntervalRef(null);
    }
    stopScanning();
    lastScannedRef.current = null;
    scanCountRef.current.clear();
    setMode("choice");
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      <AnimatePresence mode="wait">
        {mode === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Barcode className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Add Items</h2>
              <p className="text-muted-foreground">Scan a barcode or enter manually</p>
            </div>

            <div className="w-full max-w-sm mx-auto space-y-4">
              <GlassCard
                onClick={() => setMode("scan")}
                className="flex items-center gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Barcode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Scan Barcode</h3>
                  <p className="text-sm text-muted-foreground">Use camera to scan product</p>
                </div>
              </GlassCard>

              <GlassCard
                onClick={() => setMode("photo")}
                className="flex items-center gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Image className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Photo Capture</h3>
                  <p className="text-sm text-muted-foreground">Take photos to extract details</p>
                </div>
              </GlassCard>

              <GlassCard
                onClick={() => setMode("manual")}
                className="flex items-center gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Keyboard className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Manual Entry</h3>
                  <p className="text-sm text-muted-foreground">Add item details by hand</p>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {mode === "scan" && !scannedProduct && (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="relative">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              </div>

              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/3 border-2 border-primary rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              <button
                onClick={handleCloseScanner}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-center text-muted-foreground mt-4">
              Point camera at barcode or QR code
            </p>
          </motion.div>
        )}

        {mode === "photo" && !capturedData && (
          <motion.div
            key="photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="relative">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              </div>

              {/* Photo capture overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/3 border-2 border-primary rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              <button
                onClick={handleCloseScanner}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-center text-muted-foreground mt-4">
              Taking photos every 5 seconds to extract product details
            </p>
          </motion.div>
        )}

        {scannedProduct && (
          <motion.div
            key="scanned"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <GlassCard className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {scannedProduct.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Barcode: {scannedProduct.barcode}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setScannedProduct(null);
                    lastScannedRef.current = null;
                    scanCountRef.current.clear();
                  }}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddScannedProduct}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Add Item"}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {capturedData && (
          <motion.div
            key="captured"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <GlassCard className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {capturedData.name}
              </h3>
              <div className="text-sm text-muted-foreground mb-4 space-y-1">
                {capturedData.mfg && <p>Mfg: {capturedData.mfg}</p>}
                {capturedData.batch && <p>Batch: {capturedData.batch}</p>}
                {capturedData.exp && <p>Exp: {capturedData.exp}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCapturedData(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddCapturedData}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Add Item"}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {mode === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                Add Item Manually
              </h3>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Organic Milk"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">KG</option>
                      <option value="g">Grams</option>
                      <option value="ml">ML</option>
                      <option value="l">Liters</option>
                      <option value="pack-small">Small Pack</option>
                      <option value="pack-medium">Medium Pack</option>
                      <option value="pack-large">Large Pack</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfg">Manufacturing Date</Label>
                  <Input
                    id="mfg"
                    type="date"
                    value={manualMfgDate}
                    onChange={(e) => setManualMfgDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Number (Optional)</Label>
                  <Input
                    id="batch"
                    type="text"
                    placeholder="e.g., LOT123"
                    value={manualBatchNumber}
                    onChange={(e) => setManualBatchNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp">Expiry Date</Label>
                  <Input
                    id="exp"
                    type="date"
                    value={manualExpiryDate}
                    onChange={(e) => setManualExpiryDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("choice")}
                    className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !manualName.trim() || !manualMfgDate.trim() || !manualExpiryDate.trim()}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Add Item"}
                  </motion.button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};