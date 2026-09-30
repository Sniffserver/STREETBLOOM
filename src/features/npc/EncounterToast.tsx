import React from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { getArchetypeDefinition } from '../../game/npc/NPCArchetypes';
import { FACTIONS } from '../../game/npc/NPCFaction';
import { soundManager } from '../../audio/soundManager';

export const EncounterToast: React.FC = () => {
  const { companion, activeEncounterToast, setActiveEncounterToast, setSelectedSimulatedNPC } =
    useGameStore();

  if (!activeEncounterToast) return null;

  const def = getArchetypeDefinition(activeEncounterToast.archetype);
  const faction = FACTIONS[def.faction] || FACTIONS.LOCALS;

  // Companion detector voice lines based on archetype (Point 27 & 28)
  const getCompanionReaction = () => {
    switch (activeEncounterToast.archetype) {
      case 'RAVER':
        return 'Kuule, seal eespool mängib muusika!';
      case 'STREET_TOUGH':
      case 'SECURITY':
        return 'See tüüp paistab tõsine... vaatame ettevaatlikult.';
      case 'WORKER':
      case 'NIGHT_WORKER':
        return 'Tundub, et keegi teeb siin remonti või ehitust.';
      case 'VENDOR':
      case 'BLACK_MARKET_TRADER':
        return 'Oo, kas tal on meile midagi põnevat pakkuda?';
      case 'MYSTERY_STRANGER':
        return 'Miski tundub selles nurgas salapärane...';
      default:
        return 'Keegi kõnnib seal eespool!';
    }
  };

  const handleOpen = () => {
    soundManager.playTap();
    setSelectedSimulatedNPC(activeEncounterToast);
    setActiveEncounterToast(null);
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-bounce-in">
      <div className="bg-[#181d24]/95 border-2 border-amber-500/80 rounded-3xl p-3.5 shadow-2xl backdrop-blur-md flex flex-col gap-2 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Pip speech detector bubble */}
        <div className="flex items-center gap-2 bg-[#12151a] px-2.5 py-1.5 rounded-2xl border border-white/10 text-xs">
          <span className="text-base">🐾</span>
          <span className="text-slate-300">
            <strong className="text-amber-300 font-bold">{companion.name}:</strong> "{getCompanionReaction()}"
          </span>
        </div>

        {/* Encounter card */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0">
              {activeEncounterToast.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles size={11} /> Kohtumine
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded-full font-medium"
                  style={{ backgroundColor: `${faction.color}20`, color: faction.color }}
                >
                  {faction.icon} {faction.name.split(' ')[0]}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white truncate">
                {activeEncounterToast.name}
              </h4>
              <p className="text-[11px] text-gray-300 truncate">
                {activeEncounterToast.title} • {activeEncounterToast.distanceToPlayerMeters}m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleOpen}
              className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow-md transition active:scale-95"
            >
              <span>Kohtu</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => setActiveEncounterToast(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
