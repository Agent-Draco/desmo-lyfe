import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Wifi, ShieldAlert, Cpu } from 'lucide-react';

const App = () => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  // Startup Sequence Stages
  // 0: Initializing Node VGL-043
  // 1: Privacy Protocol (Edge OCR Handshake)
  // 2: Database Sync (Supabase Vigil Client)
  // 3: Secure Status Achieved

  useEffect(() => {
    const sequence = async () => {
      // Stage 0: Init
      await new Promise(r => setTimeout(r, 800));
      setStage(1);
      
      // Stage 1: Progress simulation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 30);

      await new Promise(r => setTimeout(r, 2000));
      setStage(2);
      
      await new Promise(r => setTimeout(r, 1200));
      setStage(3);
    };

    sequence();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 font-sans overflow-hidden">
      {/* Background Refraction Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Industrial Glass Container */}
      <div className="relative w-80 h-[600px] bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[48px] shadow-2xl flex flex-col items-center justify-between p-8 overflow-hidden">
        
        {/* Top Status Bar Simulation */}
        <div className="w-full flex justify-between items-center opacity-40">
          <span className="text-[10px] text-white font-mono uppercase tracking-widest">Node VGL-043</span>
          <div className="flex gap-2">
            <Wifi size={10} className="text-white" />
            <Activity size={10} className="text-white" />
          </div>
        </div>

        {/* Central Logo/Status Node */}
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="relative group">
            {/* Pulsing Status Rings */}
            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
              stage < 3 ? 'bg-amber-500/30 animate-pulse' : 'bg-emerald-500/40 animate-none scale-125'
            }`} />
            
            {/* Main Visual Icon */}
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-700 ${
              stage < 3 
                ? 'bg-black/40 border-amber-500/50 text-amber-500' 
                : 'bg-emerald-500 text-black border-emerald-400'
            }`}>
              {stage < 3 ? (
                <Cpu size={40} className={stage > 0 ? 'animate-spin-slow' : ''} />
              ) : (
                <ShieldCheck size={48} className="animate-bounce-short" />
              )}
            </div>
          </div>

          {/* Title & Brand */}
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Aste<span className="text-amber-500">Risk</span>
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">
              Safety by Design
            </p>
          </div>
        </div>

        {/* Bottom Loading / Action Info */}
        <div className="w-full mb-8">
          <div className="flex flex-col gap-4">
            {/* Terminal Output Simulation */}
            <div className="font-mono text-[9px] h-12 flex flex-col justify-end text-white/50 space-y-1">
              {stage >= 0 && <div className="animate-in fade-in">{'>'} SYST: INIT VGL-043...</div>}
              {stage >= 1 && <div className="animate-in fade-in">{'>'} PROT: EDGE_OCR_READY</div>}
              {stage >= 2 && <div className="animate-in fade-in text-amber-400">{'>'} SYNC: VIGIL_SUPA_ACTIVE</div>}
              {stage >= 3 && <div className="animate-in fade-in text-emerald-400 font-bold">{'>'} STAT: DOMAIN SECURE</div>}
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${
                  stage < 3 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div className="text-[8px] text-white/20 uppercase tracking-widest text-center">
          Terra LLC. 2026 | AsteRISK Home 1.0.1
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out infinite;
        }
        .animate-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
