import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Keyboard, Barcode, X, Loader2, Check } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import Quagga from "@ericblade/quagga2";

interface ScanViewProps {
  onAddItem: (item: { name: string; barcode?: string; category?: string }) => Promise<any>;
}

export const ScanView = ({ onAddItem }: ScanViewProps) => {
  const [mode, setMode] = useState<"choice" | "scan" | "manual">("choice");
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{
    name: string;
    barcode: string;
    category?: string;
  } | null>(null);

  const { videoRef, lookupBarcode, startScanning, stopScanning, isScanning } =
    useBarcodeScanner();
  const scannerRef = useRef<HTMLDivElement>(null);

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      setLoading(true);
      stopScanning();
      Quagga.stop();

      const product = await lookupBarcode(barcode);

      if (product) {
        setScannedProduct({
          name: product.name,
          barcode,
          category: product.category,
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

  const startQuaggaScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      await Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader",
            ],
          },
          locate: true,
        },
        (err) => {
          if (err) {
            console.error("Quagga init error:", err);
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected((result) => {
        if (result.codeResult.code) {
          handleBarcodeDetected(result.codeResult.code);
        }
      });
    } catch (error) {
      console.error("Scanner error:", error);
    }
  }, [handleBarcodeDetected]);

  useEffect(() => {
    if (mode === "scan") {
      startQuaggaScanner();
    }

    return () => {
      Quagga.stop();
      stopScanning();
    };
  }, [mode, startQuaggaScanner, stopScanning]);

  const handleAddScannedProduct = async () => {
    if (!scannedProduct) return;

    setLoading(true);
    await onAddItem({
      name: scannedProduct.name,
      barcode: scannedProduct.barcode,
      category: scannedProduct.category,
    });
    setScannedProduct(null);
    setMode("choice");
    setLoading(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    setLoading(true);
    await onAddItem({
      name: manualName.trim(),
      category: manualCategory.trim() || undefined,
    });
    setManualName("");
    setManualCategory("");
    setMode("choice");
    setLoading(false);
  };

  const handleMockScan = async () => {
    setLoading(true);
    // Simulate scanning random product
    const mockBarcodes = ["3017620422003", "5449000000996", "8076809513753"];
    const barcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    await handleBarcodeDetected(barcode);
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh]">
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMockScan}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  "Mock Scan (Demo)"
                )}
              </motion.button>
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
              <div
                ref={scannerRef}
                className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black"
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              </div>

              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/3 border-2 border-primary rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>

              <button
                onClick={() => {
                  Quagga.stop();
                  stopScanning();
                  setMode("choice");
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-center text-muted-foreground mt-4">
              Point camera at barcode
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
              {scannedProduct.category && (
                <p className="text-sm text-muted-foreground mb-4">
                  Category: {scannedProduct.category}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setScannedProduct(null)}
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
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    type="text"
                    placeholder="e.g., Dairy"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
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
                    disabled={loading || !manualName.trim()}
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
