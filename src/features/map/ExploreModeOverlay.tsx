import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { LookAheadTarget } from '../../game/world/LookAheadEngine';
import { Eye, Compass, X } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface ExploreModeOverlayProps {
  lookAheadTargets: LookAheadTarget[];
  onExitExploreMode: () => void;
}

export const ExploreModeOverlay: React.FC<ExploreModeOverlayProps> = ({
  lookAheadTargets,
  onExitExploreMode,
}) => {
  const { companion, currentLocation } = useGameStore();

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 animate-fade-in">
      {/* Top Floating Minimal Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold backdrop-blur-md shadow-lg">
          <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Avastusrežiim (Explore Mode)</span>
        </div>

        <button
          onClick={() => {
            soundManager.playTap();
            onExitExploreMode();
          }}
          className="p-2 rounded-full bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition"
          title="Välju avastusrežiimist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Direction & Look Ahead Indicators */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        {lookAheadTargets.map((target) => (
          <div
            key={target.id}
            className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/40 text-amber-200 text-xs font-bold backdrop-blur-md shadow-xl flex items-center gap-2 animate-bounce"
          >
            <span className="text-base">{target.icon}</span>
            <span>{target.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
              {target.distanceMeters}m
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Minimal Companion Pip Bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-3xl bg-slate-950/85 border border-white/10 backdrop-blur-md pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border border-amber-200 flex items-center justify-center text-lg shadow-md">
            🐾
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{companion.name}</span>
              <span className="text-[10px] text-amber-300 font-mono">({companion.happiness}%)</span>
            </div>
            <p className="text-[11px] text-slate-300 italic">
              "{companion.currentThought || 'Hoiame silmad tänaval!'}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>{Math.round(currentLocation.heading || 0)}°</span>
        </div>
      </div>
    </div>
  );
};
