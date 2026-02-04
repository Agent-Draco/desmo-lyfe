import { useState, useEffect } from "react";
import { Loader2, Wifi, Battery, Signal } from "lucide-react";

const BOOT_LINES = [
  { text: "Connecting to Vigil Cloud...", delay: 500 },
  { text: "Establishing secure handshake...", delay: 1500 },
  { text: "Loading inventory modules...", delay: 2500 },
  { text: "Syncing expiry data...", delay: 3500 },
  { text: "Initializing safety protocols...", delay: 4500 },
  { text: "Node VGL-043 online", delay: 5500, type: "amber" },
  { text: "System Ready", delay: 6200, type: "green" },
];

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [visibleLines, setVisibleLines] = useState<typeof BOOT_LINES>([]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 100 / 70; // 7 seconds = 70 intervals at 100ms
      });
    }, 100);

    // Terminal lines animation
    BOOT_LINES.forEach((line) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
      }, line.delay);
    });

    // Complete after 7 seconds
    const completeTimeout = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 500); // Fade out delay
    }, 7000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        isComplete ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "#0a0a0a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background blobs */}
        <div
          className="absolute w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{
            top: "-10%",
            right: "-10%",
            background: "rgba(245, 158, 11, 0.10)",
            filter: "blur(120px)",
            animation: "splash-pulse 2s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{
            bottom: "-10%",
            left: "-10%",
            background: "rgba(16, 185, 129, 0.06)",
            filter: "blur(120px)",
          }}
        />

        {/* Glass card */}
        <div
          className="relative overflow-hidden flex flex-col justify-between"
          style={{
            width: "320px",
            height: "600px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "48px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            padding: "32px",
          }}
        >
          {/* Status bar */}
          <div className="flex justify-between items-center opacity-40">
            <span
              className="text-white"
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              }}
            >
              Node VGL-043
            </span>
            <div className="flex gap-2">
              <Signal className="w-3 h-3 text-white" />
              <Wifi className="w-3 h-3 text-white" />
              <Battery className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Center content */}
          <div className="flex-grow flex flex-col items-center justify-center">
            {/* Node ring */}
            <div className="relative w-24 h-24">
              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  background: isComplete
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(245, 158, 11, 0.25)",
                  filter: "blur(18px)",
                }}
              />
              {/* Node circle */}
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700"
                style={{
                  border: isComplete
                    ? "1px solid rgba(16, 185, 129, 0.7)"
                    : "1px solid rgba(245, 158, 11, 0.55)",
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                {isComplete ? (
                  <svg
                    className="w-11 h-11"
                    style={{ color: "#10b981" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <Loader2
                    className="w-11 h-11 animate-spin"
                    style={{ color: "#f59e0b" }}
                  />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="mt-8 text-center">
              <h1 className="text-white text-[26px] font-extrabold tracking-tight m-0">
                Aste<span style={{ color: "#f59e0b" }}>Risk</span>
              </h1>
              <p
                className="text-white mt-1.5 m-0"
                style={{
                  fontSize: "10px",
                  opacity: 0.4,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  fontWeight: 600,
                }}
              >
                Safety by Design
              </p>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mb-8">
            {/* Terminal */}
            <div
              className="flex flex-col justify-end gap-1"
              style={{
                fontSize: "11px",
                height: "48px",
                color: "rgba(255,255,255,0.55)",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              }}
            >
              {visibleLines.slice(-2).map((line, index) => (
                <div
                  key={index}
                  className="animate-fade-in"
                  style={{
                    color:
                      line.type === "amber"
                        ? "rgba(245,158,11,0.95)"
                        : line.type === "green"
                          ? "rgba(16,185,129,0.95)"
                          : undefined,
                    fontWeight: line.type === "green" ? 800 : undefined,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div
              className="mt-3 w-full overflow-hidden relative"
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.10)",
                borderRadius: "999px",
              }}
            >
              <div
                className="absolute left-0 top-0 h-full transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: isComplete ? "#10b981" : "#f59e0b",
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="text-white text-center"
            style={{
              fontSize: "9px",
              opacity: 0.2,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Terra LLC. 2026 | AsteRISK Home 1.0.1
          </div>
        </div>
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};
