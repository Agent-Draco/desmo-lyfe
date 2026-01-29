import { useState, useRef, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Keyboard, Barcode, X, Loader2, Check } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import jsQR from "jsqr";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY as string | undefined;

const PHOTO_SCAN_BETA = import.meta.env.VITE_PHOTO_SCAN_BETA === "true";

interface ScanViewProps {
  onAddItem: (item: {
    name: string;
    barcode?: string;
    quantity?: number;
    unit?: string;
    exp?: string;
    mfg?: string;
    item_type?: "food" | "medicine";
    medicine_is_dosaged?: boolean;
    medicine_dose_amount?: number;
    medicine_dose_unit?: string;
    medicine_dose_times?: string[];
    medicine_timezone?: string;
    medicine_next_dose_at?: string;
  }) => Promise<any>;
}

export const ScanView = ({ onAddItem }: ScanViewProps) => {
  const [mode, setMode] = useState<"choice" | "scan" | "manual" | "photo">("choice");
  const [manualName, setManualName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualUnit, setManualUnit] = useState("pcs");
  const [manualMfgDate, setManualMfgDate] = useState("");
  const [manualExpiryDate, setManualExpiryDate] = useState("");
  const [manualItemType, setManualItemType] = useState<"food" | "medicine">("food");
  const [manualMedicineIsDosaged, setManualMedicineIsDosaged] = useState(false);
  const [manualDoseAmount, setManualDoseAmount] = useState("");
  const [manualDoseUnit, setManualDoseUnit] = useState("tablet");
  const [manualDoseTimesRaw, setManualDoseTimesRaw] = useState("09:00, 21:00");
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [photoResult, setPhotoResult] = useState<{ name: string; mfg?: string; exp?: string } | null>(null);
  const [scannedProduct, setScannedProduct] = useState<{
    name: string;
    barcode: string;
  } | null>(null);

  const parseDoseTimes = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // Keep only basic HH:MM
    return parts.filter((t) => /^\d{1,2}:\d{2}$/.test(t));
  };

  const computeNextDoseAt = (times: string[], now = new Date()) => {
    if (!times.length) return undefined;
    const sorted = [...times].sort();

    for (const t of sorted) {
      const [hh, mm] = t.split(":").map((n) => parseInt(n, 10));
      const candidate = new Date(now);
      candidate.setSeconds(0, 0);
      candidate.setHours(hh, mm, 0, 0);
      if (candidate.getTime() > now.getTime()) return candidate.toISOString();
    }

    // Next day at first time
    const [hh, mm] = sorted[0].split(":").map((n) => parseInt(n, 10));
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setSeconds(0, 0);
    next.setHours(hh, mm, 0, 0);
    return next.toISOString();
  };

  const guessItemType = (name: string): "food" | "medicine" => {
    const n = name.toLowerCase();
    if (
      n.includes("tablet") ||
      n.includes("capsule") ||
      n.includes("syrup") ||
      n.includes("ointment") ||
      n.includes("cream") ||
      n.includes("mg") ||
      n.includes("ml") ||
      n.includes("paracetam") ||
      n.includes("ibuprofen") ||
      n.includes("amox")
    ) {
      return "medicine";
    }
    return "food";
  };

  const { videoRef, lookupBarcode, startScanning, stopScanning } = useBarcodeScanner();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const photoIntervalRef = useRef<number | null>(null);
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
        const guessed = guessItemType(product.name);
        setManualItemType(guessed);
        setManualMedicineIsDosaged(false);
        setScannedProduct({
          name: product.name,
          barcode,
        });
      } else {
        setManualItemType("food");
        setManualMedicineIsDosaged(false);
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

  const extractDates = (text: string) => {
    const normalized = text.replace(/\s+/g, " ").trim();

    const dateLike = (label: string) => {
      const re = new RegExp(`${label}[^0-9]*(\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2})`, "i");
      const m = normalized.match(re);
      if (m?.[1]) {
        return m[1].replace(/\./g, "-").replace(/\//g, "-");
      }
      return undefined;
    };

    const exp = dateLike("(exp|expiry|expires)");
    const mfg = dateLike("(mfg|mfd|manufactured)");

    return { exp, mfg };
  };

  const canvasToBase64 = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return dataUrl.split(",")[1] || "";
  };

  const safeIsoDate = (raw: any) => {
    if (!raw || typeof raw !== "string") return undefined;
    const s = raw.trim();
    if (!s) return undefined;
    // Basic YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Attempt to normalize YYYY/M/D or YYYY.M.D
    const m = s.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (m) {
      const yyyy = m[1];
      const mm = String(m[2]).padStart(2, "0");
      const dd = String(m[3]).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return undefined;
  };

  const runGoogleVision = async (base64Jpeg: string) => {
    if (!GOOGLE_VISION_API_KEY) return { name: undefined as string | undefined };

    const body = {
      requests: [
        {
          image: { content: base64Jpeg },
          features: [
            { type: "LABEL_DETECTION", maxResults: 5 },
            { type: "WEB_DETECTION", maxResults: 5 },
            { type: "LOGO_DETECTION", maxResults: 3 },
          ],
        },
      ],
    };

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(GOOGLE_VISION_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error(`Google Vision error: ${res.status}`);
    const json: any = await res.json();
    const first = json?.responses?.[0];

    const webBest = first?.webDetection?.bestGuessLabels?.[0]?.label as string | undefined;
    const logo = first?.logoAnnotations?.[0]?.description as string | undefined;
    const label = first?.labelAnnotations?.[0]?.description as string | undefined;

    const name = webBest || logo || label;
    return { name };
  };

  const runGeminiParse = async (ocrTextInput: string, visionHint?: string) => {
    if (!GEMINI_API_KEY) return { name: undefined as string | undefined, mfg: undefined as string | undefined, exp: undefined as string | undefined };
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract product info from OCR text. Return ONLY strict JSON with keys: name, mfg, exp.

Rules:
- mfg and exp must be YYYY-MM-DD if possible.
- If unknown, use null.

Vision hint (may be null): ${visionHint ?? "null"}

OCR text:\n${ocrTextInput}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Try to parse JSON from model output (strip code fences if present)
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        name: typeof parsed?.name === "string" ? parsed.name : undefined,
        mfg: safeIsoDate(parsed?.mfg),
        exp: safeIsoDate(parsed?.exp),
      };
    } catch {
      return { name: undefined, mfg: undefined, exp: undefined };
    }
  };

  const runPhotoOcrOnce = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setLoading(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const text = data?.text ?? "";
      setOcrText(text);

      const extracted = extractDates(text);

      const base64 = canvasToBase64(canvas);
      let visionName: string | undefined;
      try {
        const vision = await runGoogleVision(base64);
        visionName = vision.name;
      } catch (e) {
        // ignore vision errors
      }

      let geminiParsed: { name?: string; mfg?: string; exp?: string } = {};
      try {
        geminiParsed = await runGeminiParse(text, visionName);
      } catch (e) {
        // ignore gemini errors
      }

      const finalName =
        manualName.trim() ||
        geminiParsed.name?.trim() ||
        visionName?.trim() ||
        "Scanned Item";

      if (!manualName.trim() && finalName && finalName !== "Scanned Item") {
        setManualName(finalName);
      }

      setPhotoResult({
        name: finalName,
        mfg: geminiParsed.mfg ?? extracted.mfg,
        exp: geminiParsed.exp ?? extracted.exp,
      });
    } catch (err) {
      console.error("Photo OCR failed:", err);
    } finally {
      setLoading(false);
    }
  }, [manualName, videoRef]);

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

  useEffect(() => {
    if (mode === "scan" && !scannedProduct) {
      startJsQRScanner();
    }

    if (mode === "photo") {
      void startScanning();
      setOcrText("");
      setPhotoResult(null);

      photoIntervalRef.current = window.setInterval(() => {
        void runPhotoOcrOnce();
      }, 5000);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
        photoIntervalRef.current = null;
      }
      stopScanning();
    };
  }, [mode, scannedProduct, startJsQRScanner, stopScanning, startScanning, runPhotoOcrOnce]);

  const handleAddScannedProduct = async () => {
    if (!scannedProduct) return;

    setLoading(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const doseTimes = manualItemType === "medicine" && manualMedicineIsDosaged ? parseDoseTimes(manualDoseTimesRaw) : [];
    const nextDoseAt = manualItemType === "medicine" && manualMedicineIsDosaged ? computeNextDoseAt(doseTimes) : undefined;

    await onAddItem({
      name: scannedProduct.name,
      barcode: scannedProduct.barcode,
      item_type: manualItemType,
      medicine_is_dosaged: manualItemType === "medicine" ? manualMedicineIsDosaged : false,
      medicine_dose_amount: manualItemType === "medicine" && manualMedicineIsDosaged ? Number(manualDoseAmount) || 1 : undefined,
      medicine_dose_unit: manualItemType === "medicine" && manualMedicineIsDosaged ? manualDoseUnit : undefined,
      medicine_dose_times: manualItemType === "medicine" && manualMedicineIsDosaged ? doseTimes : undefined,
      medicine_timezone: manualItemType === "medicine" && manualMedicineIsDosaged ? tz : undefined,
      medicine_next_dose_at: manualItemType === "medicine" && manualMedicineIsDosaged ? nextDoseAt : undefined,
    });
    setScannedProduct(null);
    setMode("choice");
    lastScannedRef.current = null;
    scanCountRef.current.clear();
    setLoading(false);
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualMfgDate.trim() || !manualExpiryDate.trim()) return;

    setLoading(true);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const doseTimes = manualItemType === "medicine" && manualMedicineIsDosaged ? parseDoseTimes(manualDoseTimesRaw) : [];
    const nextDoseAt = manualItemType === "medicine" && manualMedicineIsDosaged ? computeNextDoseAt(doseTimes) : undefined;

    await onAddItem({
      name: manualName.trim(),
      quantity: parseInt(manualQuantity) || 1,
      unit: manualUnit,
      mfg: manualMfgDate.trim(),
      exp: manualExpiryDate.trim(),
      item_type: manualItemType,
      medicine_is_dosaged: manualItemType === "medicine" ? manualMedicineIsDosaged : false,
      medicine_dose_amount: manualItemType === "medicine" && manualMedicineIsDosaged ? Number(manualDoseAmount) || 1 : undefined,
      medicine_dose_unit: manualItemType === "medicine" && manualMedicineIsDosaged ? manualDoseUnit : undefined,
      medicine_dose_times: manualItemType === "medicine" && manualMedicineIsDosaged ? doseTimes : undefined,
      medicine_timezone: manualItemType === "medicine" && manualMedicineIsDosaged ? tz : undefined,
      medicine_next_dose_at: manualItemType === "medicine" && manualMedicineIsDosaged ? nextDoseAt : undefined,
    });

    setManualName("");
    setManualQuantity("1");
    setManualUnit("pcs");
    setManualMfgDate("");
    setManualExpiryDate("");
    setManualItemType("food");
    setManualMedicineIsDosaged(false);
    setManualDoseAmount("");
    setManualDoseUnit("tablet");
    setManualDoseTimesRaw("09:00, 21:00");
    setMode("choice");
    setLoading(false);
  };

  const handleCloseScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (photoIntervalRef.current) {
      clearInterval(photoIntervalRef.current);
      photoIntervalRef.current = null;
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
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Scan Barcode</h3>
                  <p className="text-sm text-muted-foreground">Use camera to scan product</p>
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

              {PHOTO_SCAN_BETA && (
                <GlassCard
                  onClick={() => setMode("photo")}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Photo Scan (Beta)</h3>
                    <p className="text-sm text-muted-foreground">Captures a photo every 5s and extracts dates</p>
                  </div>
                </GlassCard>
              )}
            </div>
          </motion.div>
        )}

        {mode === "photo" && (
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

            <GlassCard className="p-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="photoName">Item name</Label>
                  <Input
                    id="photoName"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Type item name (OCR doesn’t reliably detect names yet)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoItemType">Type</Label>
                  <select
                    id="photoItemType"
                    value={manualItemType}
                    onChange={(e) => setManualItemType(e.target.value as "food" | "medicine")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="food">Food</option>
                    <option value="medicine">Medicine</option>
                  </select>
                </div>

                {manualItemType === "medicine" && (
                  <div className="space-y-2">
                    <Label htmlFor="photoMedicineDosaged">Medicine dosing</Label>
                    <select
                      id="photoMedicineDosaged"
                      value={manualMedicineIsDosaged ? "dosaged" : "non"}
                      onChange={(e) => setManualMedicineIsDosaged(e.target.value === "dosaged")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="non">Non-dosaged medicine</option>
                      <option value="dosaged">Dosaged medicine</option>
                    </select>
                  </div>
                )}

                {manualItemType === "medicine" && manualMedicineIsDosaged && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="photoDoseAmount">Dose amount</Label>
                        <Input
                          id="photoDoseAmount"
                          type="number"
                          min="0"
                          step="0.5"
                          value={manualDoseAmount}
                          onChange={(e) => setManualDoseAmount(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photoDoseUnit">Dose unit</Label>
                        <Input
                          id="photoDoseUnit"
                          value={manualDoseUnit}
                          onChange={(e) => setManualDoseUnit(e.target.value)}
                          placeholder="tablet / ml"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photoDoseTimes">Dose times (HH:MM, comma-separated)</Label>
                      <Input
                        id="photoDoseTimes"
                        value={manualDoseTimesRaw}
                        onChange={(e) => setManualDoseTimesRaw(e.target.value)}
                        placeholder="09:00, 21:00"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="photoMfg">Mfg</Label>
                    <Input
                      id="photoMfg"
                      value={photoResult?.mfg ?? ""}
                      onChange={(e) => setPhotoResult((p) => ({ ...(p ?? { name: manualName || "Scanned Item" }), mfg: e.target.value }))}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoExp">Exp</Label>
                    <Input
                      id="photoExp"
                      value={photoResult?.exp ?? ""}
                      onChange={(e) => setPhotoResult((p) => ({ ...(p ?? { name: manualName || "Scanned Item" }), exp: e.target.value }))}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void runPhotoOcrOnce()}
                    className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
                  >
                    Re-scan
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={async () => {
                      const name = manualName.trim();
                      if (!name) return;
                      setLoading(true);
                      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      const doseTimes = manualItemType === "medicine" && manualMedicineIsDosaged ? parseDoseTimes(manualDoseTimesRaw) : [];
                      const nextDoseAt = manualItemType === "medicine" && manualMedicineIsDosaged ? computeNextDoseAt(doseTimes) : undefined;
                      await onAddItem({
                        name,
                        mfg: photoResult?.mfg,
                        exp: photoResult?.exp,
                        item_type: manualItemType,
                        medicine_is_dosaged: manualItemType === "medicine" ? manualMedicineIsDosaged : false,
                        medicine_dose_amount: manualItemType === "medicine" && manualMedicineIsDosaged ? Number(manualDoseAmount) || 1 : undefined,
                        medicine_dose_unit: manualItemType === "medicine" && manualMedicineIsDosaged ? manualDoseUnit : undefined,
                        medicine_dose_times: manualItemType === "medicine" && manualMedicineIsDosaged ? doseTimes : undefined,
                        medicine_timezone: manualItemType === "medicine" && manualMedicineIsDosaged ? tz : undefined,
                        medicine_next_dose_at: manualItemType === "medicine" && manualMedicineIsDosaged ? nextDoseAt : undefined,
                      });
                      setLoading(false);
                      setMode("choice");
                      setManualName("");
                      setManualItemType("food");
                      setManualMedicineIsDosaged(false);
                      setManualDoseAmount("");
                      setManualDoseUnit("tablet");
                      setManualDoseTimesRaw("09:00, 21:00");
                      setPhotoResult(null);
                      setOcrText("");
                    }}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Add Item"}
                  </motion.button>
                </div>

                {ocrText && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">OCR text</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{ocrText}</pre>
                  </details>
                )}
              </div>
            </GlassCard>
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

              <div className="space-y-3 text-left mb-4">
                <div className="space-y-2">
                  <Label htmlFor="scanType">Type</Label>
                  <select
                    id="scanType"
                    value={manualItemType}
                    onChange={(e) => setManualItemType(e.target.value as "food" | "medicine")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="food">Food</option>
                    <option value="medicine">Medicine</option>
                  </select>
                </div>

                {manualItemType === "medicine" && (
                  <div className="space-y-2">
                    <Label htmlFor="scanDosaged">Medicine dosing</Label>
                    <select
                      id="scanDosaged"
                      value={manualMedicineIsDosaged ? "dosaged" : "non"}
                      onChange={(e) => setManualMedicineIsDosaged(e.target.value === "dosaged")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="non">Non-dosaged medicine</option>
                      <option value="dosaged">Dosaged medicine</option>
                    </select>
                  </div>
                )}

                {manualItemType === "medicine" && manualMedicineIsDosaged && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="scanDoseAmount">Dose amount</Label>
                        <Input
                          id="scanDoseAmount"
                          type="number"
                          min="0"
                          step="0.5"
                          value={manualDoseAmount}
                          onChange={(e) => setManualDoseAmount(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scanDoseUnit">Dose unit</Label>
                        <Input
                          id="scanDoseUnit"
                          value={manualDoseUnit}
                          onChange={(e) => setManualDoseUnit(e.target.value)}
                          placeholder="tablet / ml"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scanDoseTimes">Dose times (HH:MM, comma-separated)</Label>
                      <Input
                        id="scanDoseTimes"
                        value={manualDoseTimesRaw}
                        onChange={(e) => setManualDoseTimesRaw(e.target.value)}
                        placeholder="09:00, 21:00"
                      />
                    </div>
                  </>
                )}
              </div>

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

                <div className="space-y-2">
                  <Label htmlFor="itemType">Type</Label>
                  <select
                    id="itemType"
                    value={manualItemType}
                    onChange={(e) => setManualItemType(e.target.value as "food" | "medicine")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="food">Food</option>
                    <option value="medicine">Medicine</option>
                  </select>
                </div>

                {manualItemType === "medicine" && (
                  <div className="space-y-2">
                    <Label htmlFor="medicineDosaged">Medicine dosing</Label>
                    <select
                      id="medicineDosaged"
                      value={manualMedicineIsDosaged ? "dosaged" : "non"}
                      onChange={(e) => setManualMedicineIsDosaged(e.target.value === "dosaged")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="non">Non-dosaged medicine</option>
                      <option value="dosaged">Dosaged medicine</option>
                    </select>
                  </div>
                )}

                {manualItemType === "medicine" && manualMedicineIsDosaged && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="doseAmount">Dose amount</Label>
                        <Input
                          id="doseAmount"
                          type="number"
                          min="0"
                          step="0.5"
                          value={manualDoseAmount}
                          onChange={(e) => setManualDoseAmount(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doseUnit">Dose unit</Label>
                        <Input
                          id="doseUnit"
                          value={manualDoseUnit}
                          onChange={(e) => setManualDoseUnit(e.target.value)}
                          placeholder="tablet / ml"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doseTimes">Dose times (HH:MM, comma-separated)</Label>
                      <Input
                        id="doseTimes"
                        value={manualDoseTimesRaw}
                        onChange={(e) => setManualDoseTimesRaw(e.target.value)}
                        placeholder="09:00, 21:00"
                      />
                    </div>
                  </>
                )}

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