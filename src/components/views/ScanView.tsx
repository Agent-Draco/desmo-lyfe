import { useState, useRef, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Keyboard, X, Loader2, Check } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY as string | undefined;

const CATEGORY_OPTIONS = [
  "Dairy",
  "Eggs",
  "Gluten",
  "Wheat",
  "Peanuts",
  "Tree Nuts",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Vegan",
  "Vegetarian",
  "Halal",
  "Kosher",
  "Keto",
  "Low Carb",
  "Low Sugar",
  "Low Sodium",
  "Low FODMAP",
];

interface ScanViewProps {
  onAddItem: (item: {
    name: string;
    barcode?: string;
    quantity?: number;
    unit?: string;
    exp?: string;
    mfg?: string;
    item_type?: "food" | "medicine";
    category?: string;
    medicine_is_dosaged?: boolean;
    medicine_dose_amount?: number;
    medicine_dose_unit?: string;
    medicine_dose_times?: string[];
    medicine_timezone?: string;
    medicine_next_dose_at?: string;
  }) => Promise<boolean | null>;
}

export const ScanView = ({ onAddItem }: ScanViewProps) => {
  const [mode, setMode] = useState<"choice" | "manual" | "photo" | "cvScan">("choice");

  const [manualName, setManualName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualUnit, setManualUnit] = useState("pcs");
  const [manualMfgDate, setManualMfgDate] = useState("");
  const [manualExpiryDate, setManualExpiryDate] = useState("");
  const [manualItemType, setManualItemType] = useState<"food" | "medicine">("food");
  const [manualCategory, setManualCategory] = useState<string>("");
  const [manualMedicineIsDosaged, setManualMedicineIsDosaged] = useState(false);
  const [manualDoseAmount, setManualDoseAmount] = useState("");
  const [manualDoseUnit, setManualDoseUnit] = useState("tablet");
  const [manualDoseTimesRaw, setManualDoseTimesRaw] = useState("09:00, 21:00");
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [photoScanResult, setPhotoScanResult] = useState<{ name: string; mfg?: string; exp?: string } | null>(null);
  const [cvScanResult, setCvScanResult] = useState<{ name: string; mfg?: string; exp?: string } | null>(null);

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  const safeIsoDate = (raw: unknown) => {
    if (!raw || typeof raw !== "string") return undefined;
    const s = raw.trim();
    if (!s) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
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
    if (!GOOGLE_VISION_API_KEY) return { name: undefined as string | undefined, text: "" };

    const body = {
      requests: [
        {
          image: { content: base64Jpeg },
          features: [
            { type: "LABEL_DETECTION", maxResults: 5 },
            { type: "WEB_DETECTION", maxResults: 5 },
            { type: "LOGO_DETECTION", maxResults: 3 },
            { type: "TEXT_DETECTION", maxResults: 1 },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json();
    const first = json?.responses?.[0];

    const webBest = first?.webDetection?.bestGuessLabels?.[0]?.label as string | undefined;
    const logo = first?.logoAnnotations?.[0]?.description as string | undefined;
    const label = first?.labelAnnotations?.[0]?.description as string | undefined;
    const fullText = first?.textAnnotations?.[0]?.description as string | undefined;

    const name = webBest || logo || label;
    return { name, text: fullText || "" };
  };

  const runGeminiParse = useCallback(async (
    ocrTextInput: string,
    visionHint?: string
  ): Promise<{
    name?: string;
    mfg?: string;
    exp?: string;
    item_type?: "food" | "medicine";
    category?: string;
  }> => {
    if (!GEMINI_API_KEY) {
      return {
        name: undefined,
        mfg: undefined,
        exp: undefined,
        item_type: undefined,
        category: undefined,
      };
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract product info from OCR text. Return ONLY strict JSON with keys: name, mfg, exp, item_type, category.

Rules:
- mfg and exp must be YYYY-MM-DD if possible.
- If unknown, use null.
- item_type must be either "food" or "medicine".
- category should be one of: ${CATEGORY_OPTIONS.join(", ")}. If unsure, use null.

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
        item_type: parsed?.item_type === "medicine" ? "medicine" : (parsed?.item_type === "food" ? "food" : undefined),
        category: typeof parsed?.category === "string" ? parsed.category : undefined,
      };
    } catch {
      return { name: undefined, mfg: undefined, exp: undefined, item_type: undefined, category: undefined };
    }
  }, []);

  const runScan = useCallback(async () => {
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
      const base64 = canvas.toDataURL("image/jpeg", 0.9).split(",")[1] || "";

      let visionResult: { name?: string; text: string } = { text: "" };
      try {
        visionResult = await runGoogleVision(base64);
      } catch (e) {
        // ignore vision errors
        console.error("Google Vision API error", e);
      }

      setOcrText(visionResult.text);

      // Regex fallback extraction
      const extracted = extractDates(visionResult.text);

      let geminiParsed: { name?: string; mfg?: string; exp?: string; item_type?: "food" | "medicine"; category?: string } = {};
      try {
        geminiParsed = await runGeminiParse(visionResult.text, visionResult.name);
      } catch (e) {
        // ignore gemini errors
        console.error("Gemini API error", e);
      }

      const finalName =
        manualName.trim() ||
        geminiParsed.name?.trim() ||
        visionResult.name?.trim() ||
        (mode === "cvScan" ? "CV Scanned Item" : "Scanned Item");

      if (!manualName.trim() && finalName && finalName !== "Scanned Item" && finalName !== "CV Scanned Item") {
        setManualName(finalName);
      }

      if (geminiParsed?.item_type && geminiParsed.item_type !== manualItemType) {
        setManualItemType(geminiParsed.item_type);
        if (geminiParsed.item_type === "food") setManualMedicineIsDosaged(false);
      }

      if (typeof geminiParsed?.category === "string" && geminiParsed.category.trim()) {
        setManualCategory(geminiParsed.category.trim());
      }

      const result = {
        name: finalName,
        mfg: geminiParsed.mfg ?? extracted.mfg,
        exp: geminiParsed.exp ?? extracted.exp,
      };

      if (mode === "cvScan") {
        setCvScanResult(result);
      } else {
        setPhotoScanResult(result);
      }

    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setLoading(false);
    }
  }, [manualName, manualItemType, mode, runGeminiParse]);

  const stopCamera = useCallback(() => {
    const s = mediaStreamRef.current;
    if (s) {
      for (const t of s.getTracks()) t.stop();
    }
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (mediaStreamRef.current) return;
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (e) {
      console.error("Failed to start camera", e);
    }
  }, []);

  useEffect(() => {
    if (mode === "photo" || mode === "cvScan") {
      void startCamera();
      setOcrText("");
      setPhotoScanResult(null);
      setCvScanResult(null);

      // Auto scan every 5 seconds
      scanIntervalRef.current = window.setInterval(() => {
        void runScan();
      }, 5000);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      stopCamera();
    };
  }, [mode, runScan, startCamera, stopCamera]);

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
      category: manualCategory.trim() || undefined,
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
    setManualCategory("");
    setManualMedicineIsDosaged(false);
    setManualDoseAmount("");
    setManualDoseUnit("tablet");
    setManualDoseTimesRaw("09:00, 21:00");
    setCvScanResult(null);
    setPhotoScanResult(null);
    setMode("choice");
    setLoading(false);
  };

  const handleCloseScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopCamera();
    setMode("choice");
  };

  const handleCvSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    setLoading(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const doseTimes = manualItemType === "medicine" && manualMedicineIsDosaged ? parseDoseTimes(manualDoseTimesRaw) : [];
    const nextDoseAt = manualItemType === "medicine" && manualMedicineIsDosaged ? computeNextDoseAt(doseTimes) : undefined;

    await onAddItem({
      name: manualName.trim(),
      quantity: parseInt(manualQuantity) || 1,
      unit: manualUnit,
      mfg: manualMfgDate.trim() || undefined,
      exp: manualExpiryDate.trim() || undefined,
      item_type: manualItemType,
      category: manualCategory.trim() || undefined,
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
    setManualCategory("");
    setManualMedicineIsDosaged(false);
    setManualDoseAmount("");
    setManualDoseUnit("tablet");
    setManualDoseTimesRaw("09:00, 21:00");
    setCvScanResult(null);
    setPhotoScanResult(null);
    setMode("choice");
    setLoading(false);
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
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Add Items</h2>
              <p className="text-muted-foreground">Photo scan or enter manually</p>
            </div>

            <div className="w-full max-w-sm mx-auto space-y-4">
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

              <GlassCard
                onClick={() => setMode("photo")}
                className="flex items-center gap-4 cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Photo Scan</h3>
                  <p className="text-sm text-muted-foreground">Extracts name, dates, and category</p>
                </div>
              </GlassCard>

              <GlassCard
                onClick={() => setMode("cvScan")}
                className="flex items-center gap-4 cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-xl bg-green-10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">CV Scan</h3>
                  <p className="text-sm text-muted-foreground">CV object identification & OCR for dates</p>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {mode === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={manualItemType}
                    onChange={(e) => setManualItemType(e.target.value as "food" | "medicine")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="food">Food</option>
                    <option value="medicine">Medicine</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfg">Mfg</Label>
                  <Input
                    id="mfg"
                    type="date"
                    value={manualMfgDate}
                    onChange={(e) => setManualMfgDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp">Exp</Label>
                  <Input
                    id="exp"
                    type="date"
                    value={manualExpiryDate}
                    onChange={(e) => setManualExpiryDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                {manualItemType === "medicine" && (
                  <div className="space-y-2">
                    <Label htmlFor="dosaged">Medicine dosing</Label>
                    <select
                      id="dosaged"
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
                      <option value="mg">MG</option>
                      <option value="ml">ML</option>
                      <option value="l">Liters</option>
                      <option value="pack-small">Small Pack</option>
                      <option value="pack-medium">Medium Pack</option>
                      <option value="pack-large">Large Pack</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Add Item"
                  )}
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {(mode === "photo" || mode === "cvScan") && (
          <motion.div
            key="scan-interface"
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
                {cvScanResult && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">CV Detected:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cvScanResult.name}</span>
                    </div>
                  </div>
                )}

                {photoScanResult && mode === "photo" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Photo Scan Result:</p>
                    <div className="flex items-center gap-2">
                       {/* This could be enhanced to show more details */}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="scanName">Item name</Label>
                    <Input
                      id="scanName"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Product name"
                    />
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="scanCategory">Category</Label>
                    <select
                      id="scanCategory"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">None</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {manualItemType === "medicine" && (
                    <div className="space-y-2">
                      <Label htmlFor="scanMedicineDosaged">Medicine dosing</Label>
                      <select
                        id="scanMedicineDosaged"
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="scanMfg">Mfg</Label>
                      <Input
                        id="scanMfg"
                        value={(mode === "photo" ? photoScanResult?.mfg : cvScanResult?.mfg) ?? manualMfgDate}
                         onChange={(e) => {
                          const val = e.target.value;
                          setManualMfgDate(val);
                          if (mode === "photo") {
                            setPhotoScanResult((p) => ({ ...(p ?? { name: manualName || "Scanned Item" }), mfg: val }));
                          } else {
                            setCvScanResult((p) => ({ ...(p ?? { name: manualName || "CV Scanned Item" }), mfg: val }));
                          }
                        }}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scanExp">Exp</Label>
                      <Input
                        id="scanExp"
                         value={(mode === "photo" ? photoScanResult?.exp : cvScanResult?.exp) ?? manualExpiryDate}
                         onChange={(e) => {
                          const val = e.target.value;
                          setManualExpiryDate(val);
                          if (mode === "photo") {
                            setPhotoScanResult((p) => ({ ...(p ?? { name: manualName || "Scanned Item" }), exp: val }));
                          } else {
                            setCvScanResult((p) => ({ ...(p ?? { name: manualName || "CV Scanned Item" }), exp: val }));
                          }
                        }}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>

                  {/* Quantity and Unit - Added for CV/Photo scan too */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="scanQuantity">Quantity</Label>
                      <Input
                        id="scanQuantity"
                        type="number"
                        min="1"
                        value={manualQuantity}
                        onChange={(e) => setManualQuantity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scanUnit">Unit</Label>
                      <select
                        id="scanUnit"
                        value={manualUnit}
                        onChange={(e) => setManualUnit(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">KG</option>
                        <option value="g">Grams</option>
                        <option value="mg">MG</option>
                        <option value="ml">ML</option>
                        <option value="l">Liters</option>
                        <option value="pack-small">Small Pack</option>
                        <option value="pack-medium">Medium Pack</option>
                        <option value="pack-large">Large Pack</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void runScan()}
                      className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scanning...
                        </span>
                      ) : (
                        "Rescan"
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={loading || !manualName.trim()}
                      onClick={mode === "photo" ? handleManualSubmit : handleCvSubmit}
                      className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Add
                      </span>
                    </button>
                  </div>

                   {ocrText && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Detected Text</summary>
                      <pre className="mt-2 whitespace-pre-wrap">{ocrText}</pre>
                    </details>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
