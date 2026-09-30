import React from 'react';
import { Moon, Footprints, Sparkles, MapPin, Users, Heart, ArrowRight } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

export interface SessionSummaryData {
  distanceWalkedKm: number;
  streetsDiscoveredCount: number;
  metNPCNames: string[];
  itemsFoundNames: string[];
  favoriteDistrict: string;
  companionThought: string;
  unexplainedHookText?: string;
}

interface SessionSummaryModalProps {
  summary: SessionSummaryData;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ summary, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl game-glass-panel border border-amber-500/40 p-6 flex flex-col gap-4 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
            🌙
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-amber-300 uppercase">Tänane Rännak</h2>
            <p className="text-xs text-slate-300 font-medium">Sinu teekonna kokkuvõte</p>
          </div>
        </div>

        {/* Distance Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Footprints className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Läbitud vahemaa</span>
          </div>
          <span className="text-lg font-black font-mono text-emerald-300">
            {summary.distanceWalkedKm.toFixed(1)} km
          </span>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Avastatud tänavad</span>
            </div>
            <p className="text-base font-black text-white">{summary.streetsDiscoveredCount} tänavat</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-purple-400">
              <Users className="w-3.5 h-3.5" />
              <span>Kohatud tegelased</span>
            </div>
            <p className="text-base font-black text-white truncate">
              {summary.metNPCNames.length > 0 ? summary.metNPCNames.join(', ') : 'Vaikne tee'}
            </p>
          </div>
        </div>

        {/* Companion Sentiment */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <p className="text-[11px] text-amber-300 font-bold">Pipi lemmikpiirkond: {summary.favoriteDistrict}</p>
            <p className="text-xs text-slate-200 italic font-medium">"{summary.companionThought}"</p>
          </div>
        </div>

        {/* Unexplained Curiosity Hook */}
        {summary.unexplainedHookText && (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <p>{summary.unexplainedHookText}</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playTap();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
        >
          <span>Lõpeta rännak</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
