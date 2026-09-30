import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Footprints, Volume2, Sparkles, X, MessageSquare, Compass } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface WalkModeOverlayProps {
  onExitWalkMode: () => void;
}

export const WalkModeOverlay: React.FC<WalkModeOverlayProps> = ({ onExitWalkMode }) => {
  const { companion, currentLocation, simulatedNPCs, setSelectedSimulatedNPC } = useGameStore();

  const nearbyNPC = simulatedNPCs.find((n) => n.distanceToPlayerMeters <= 30);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/95 p-6 flex flex-col justify-between text-white animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center text-2xl font-black shadow-lg">
            🚶
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Kõnni-režiim (Walk Mode)</h1>
            <p className="text-xs text-amber-300 font-bold">Suurendatud nupud & turvaline kaardistus</p>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playTap();
            onExitWalkMode();
          }}
          className="p-3 rounded-2xl bg-slate-900 border border-white/20 text-slate-300 hover:text-white"
          aria-label="Sulge kõnnirežiim"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Large Companion Thought Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 flex flex-col gap-3 text-center shadow-2xl">
        <div className="text-5xl animate-bounce">🐾</div>
        <h2 className="text-lg font-black text-amber-200">{companion.name} teeb teed</h2>
        <p className="text-base text-slate-200 font-bold italic">
          "{companion.currentThought || 'Jätkame kõndimist, linn avaneb igal sammul!'}"
        </p>
      </div>

      {/* Large Contextual Interaction Button if NPC Nearby */}
      {nearbyNPC ? (
        <button
          onClick={() => {
            soundManager.playTap();
            setSelectedSimulatedNPC(nearbyNPC);
          }}
          className="w-full py-6 px-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition"
          aria-label={`Räägi kohaliku tegelasega ${nearbyNPC.name}`}
        >
          <MessageSquare className="w-8 h-8" />
          <span>Räägi tegelasega {nearbyNPC.name} ({nearbyNPC.distanceToPlayerMeters}m)</span>
        </button>
      ) : (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 text-center text-sm font-bold text-slate-400">
          📍 Kõnni edasi – tegelasi ja salapaiku märgatakse automaatselt haptilise impulsiga
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-2">
        <span className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          {Math.round(currentLocation.heading || 0)}° Suund
        </span>
        <span className="flex items-center gap-2 text-emerald-400">
          <Volume2 className="w-4 h-4" /> Heli & Haptika SEES
        </span>
      </div>
    </div>
  );
};
