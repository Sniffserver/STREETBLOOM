import React from 'react';
import { StreetSegment } from '../../types/game';
import { MapPin, Sparkles, Navigation, History, Layers, Heart, Shield, Award, Calendar, BookOpen } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';
import { gameEngine } from '../../game/engine/gameEngine';
import { DistrictResolver } from '../../game/world/DistrictIdentity';

interface StreetDetailsModalProps {
  street: StreetSegment;
  onClose: () => void;
}

export const StreetDetailsModal: React.FC<StreetDetailsModalProps> = ({ street, onClose }) => {
  const totalSubsegments = street.segments?.length || 1;
  const exploredSubsegments = street.segments?.filter((s) => s.explored).length || 0;
  const pct = street.discoveryPercent || 0;

  // Fetch Personal Memory Map for this street
  const memory = gameEngine.streetMemoryEngine.getMemory(street.id);

  // Fetch District Profile & Standing
  const districtProfile = DistrictResolver.getIdentity(street.district);
  const districtStanding = gameEngine.districtRepEngine.getStandingInfo(street.district);

  // Fetch Discovery Layers
  const discoveryProgress = gameEngine.discoveryLayerEngine.evaluateProgress(
    street.district,
    districtStanding.reputationPoints
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-3 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md my-auto rounded-3xl game-glass-panel border border-cyan-500/30 p-5 flex flex-col gap-3.5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                  {street.district}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
                  {districtStanding.perks.titleLabel} ({districtStanding.reputationPoints} p)
                </span>
              </div>
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

        {/* 5 Discovery Layers Bar */}
        <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-2 text-xs">
          <span className="font-bold text-purple-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Kihtide avastusprogress (5-kihi süsteem):
          </span>
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
            <div className={`p-1.5 rounded-xl border ${pct >= 1 ? 'bg-cyan-900/40 border-cyan-400/40 text-cyan-200' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
              K1: Tänav
            </div>
            <div className={`p-1.5 rounded-xl border ${discoveryProgress.layer2AreaUnderstood ? 'bg-indigo-900/40 border-indigo-400/40 text-indigo-200' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
              K2: Piirkond
            </div>
            <div className={`p-1.5 rounded-xl border ${discoveryProgress.layer3LandmarkCount > 0 ? 'bg-purple-900/40 border-purple-400/40 text-purple-200' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
              K3: Maamärk
            </div>
            <div className={`p-1.5 rounded-xl border ${discoveryProgress.layer4SecretsUnlocked > 0 ? 'bg-amber-900/40 border-amber-400/40 text-amber-200' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
              K4: Salapaik
            </div>
            <div className={`p-1.5 rounded-xl border ${discoveryProgress.layer5StoryNodesUnlocked > 0 ? 'bg-emerald-900/40 border-emerald-400/40 text-emerald-200' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
              K5: Looline
            </div>
          </div>
        </div>

        {/* Personal Memory Map Section */}
        <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
              Sinu isiklikud mälestused siin tänaval
            </span>
            {memory?.visitCount && (
              <span className="text-[10px] text-cyan-400 font-mono">
                Külastusi: {memory.visitCount}x
              </span>
            )}
          </div>

          {memory && memory.keyMemories.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {memory.keyMemories.map((m) => (
                <div key={m.id} className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-xs">
                  <div className="font-bold text-cyan-200">{m.title}</div>
                  <div className="text-[11px] text-slate-300">{m.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              See tänav ootab sinu ja Pipi esimest suurt kohtumist või sündmust.
            </p>
          )}
        </div>

        {/* District Simulation Breakdown */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col gap-2 text-xs">
          <span className="font-bold text-slate-200 flex items-center justify-between">
            <span>{street.district} piirkonna identiteet:</span>
            <span className="text-[10px] text-amber-400 font-mono">
              Ostu allahindlus: {districtStanding.perks.discountPercent}%
            </span>
          </span>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-white/5 flex flex-col">
              <span className="text-slate-400">Eluolu</span>
              <span className="font-bold text-cyan-300">Resid: {districtProfile.residential}/10</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-white/5 flex flex-col">
              <span className="text-slate-400">Äri/Kaubandus</span>
              <span className="font-bold text-amber-300">Äri: {districtProfile.commercial}/10</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-white/5 flex flex-col">
              <span className="text-slate-400">Ööelu</span>
              <span className="font-bold text-purple-300">Öö: {districtProfile.nightlife}/10</span>
            </div>
          </div>
        </div>

        {/* Historical note */}
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
