import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Loader2 } from "lucide-react";
import { SplashScreen } from "@/components/SplashScreen";

// Lazy load pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const VigilSetup = lazy(() => import("./pages/VigilSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit per session AND only on root path
    if (typeof window !== "undefined") {
      const isRootPath = window.location.pathname === "/";
      const hasSeenSplash = sessionStorage.getItem("asterisk-splash-seen");
      return isRootPath && !hasSeenSplash;
    }
    return false;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("asterisk-splash-seen", "true");
    setShowSplash(false);
  };

  // Clear splash flag when testing - remove this line after testing
  useEffect(() => {
    // Uncomment below to reset splash for testing:
    // sessionStorage.removeItem("asterisk-splash-seen");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/vigil-setup" element={<VigilSetup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
