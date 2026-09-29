import React from 'react';
import { StreetSegment } from '../../types/game';
import { MapPin, Sparkles, Navigation, History, Eye, Layers } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface StreetDetailsModalProps {
  street: StreetSegment;
  onClose: () => void;
}

export const StreetDetailsModal: React.FC<StreetDetailsModalProps> = ({ street, onClose }) => {
  const totalSubsegments = street.segments?.length || 1;
  const exploredSubsegments = street.segments?.filter((s) => s.explored).length || 0;
  const pct = street.discoveryPercent || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl game-glass-panel border border-cyan-500/30 p-5 flex flex-col gap-3.5 shadow-2xl animate-slide-up">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${
                pct >= 70
                  ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-md shadow-cyan-500/30'
                  : pct > 0
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              🧭
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                {street.district}
              </span>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {pct > 0 ? street.name : 'Uurimata tänavalõik'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Real Progress Bar */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-900/80 border border-white/5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Avastatuse tase</span>
            <span
              className={`font-mono ${
                pct >= 70 ? 'text-emerald-400' : pct > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {pct}%
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                pct >= 70
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
            <span>
              Läbitud: {street.exploredDistanceMeters || 0}m / {street.lengthMeters}m
            </span>
            <span>
              Lõike: {exploredSubsegments} / {totalSubsegments}
            </span>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-white/5 text-xs font-semibold text-slate-300">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pikkus {street.lengthMeters}m</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-white/5 text-xs font-semibold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{totalSubsegments} lõiku</span>
          </div>
        </div>

        {/* Description or Hint */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {pct > 0
            ? street.description || 'Põnev ja omanäoline tänav sinu linnas.'
            : 'See tänav asub veel udu taga. Jaluta piki seda tänavat, et selle lõigud kaardile kanda!'}
        </p>

        {street.historicalNote && pct >= 50 && (
          <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col gap-1 text-[11px] text-cyan-200">
            <span className="font-bold flex items-center gap-1 text-cyan-400">
              <History className="w-3.5 h-3.5" />
              Ajalooline märge:
            </span>
            <p className="italic">{street.historicalNote}</p>
          </div>
        )}

        <button
          onClick={() => {
            soundManager.playTap();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition mt-1"
        >
          Sulge
        </button>
      </div>
    </div>
  );
};
