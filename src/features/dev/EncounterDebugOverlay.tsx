import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { NPCArchetype } from '../../game/npc/NPCArchetypes';
import { npcManager } from '../../game/npc/NPCManager';
import { defaultEncounterDirector } from '../../game/encounters/EncounterDirector';
import { Sparkles, RefreshCw, X, ShieldAlert, Users, Zap, Bug } from 'lucide-react';

export const EncounterDebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    worldTime,
    currentDistrict,
    simulatedNPCs,
    currentLocation,
    syncWithEngine,
  } = useGameStore();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/90 hover:bg-amber-400 text-black font-mono font-bold text-xs shadow-lg shadow-amber-500/30 transition backdrop-blur-md active:scale-95"
        title="Ava tasakaalustamise silur"
      >
        <Bug className="w-4 h-4" />
        <span>DEV BUG</span>
      </button>
    );
  }

  const activeCount = simulatedNPCs.filter((n) => n.state !== 'DESPAWNED').length;
  const lastNPC = simulatedNPCs[simulatedNPCs.length - 1];

  const handleSpawnSpecific = (archetype: NPCArchetype, groupCount = 1) => {
    npcManager.spawnProceduralNPC(
      archetype,
      currentLocation.latitude + (Math.random() * 0.0004 - 0.0002),
      currentLocation.longitude + (Math.random() * 0.0004 - 0.0002),
      currentDistrict,
      Math.floor(Math.random() * 360),
      groupCount
    );
    syncWithEngine();
  };

  const handleForceRare = () => {
    handleSpawnSpecific('MYSTERY_STRANGER', 1);
  };

  const handleForceGroup = () => {
    handleSpawnSpecific('RAVER', 3);
  };

  const handleClearNPCs = () => {
    simulatedNPCs.forEach((npc) => {
      npcManager.setNPCState(npc.id, 'DESPAWNED');
    });
    syncWithEngine();
  };

  return (
    <div className="fixed top-16 left-4 z-50 w-80 max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-950/95 border border-amber-500/40 text-slate-200 p-4 shadow-2xl font-mono text-xs backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Zap className="w-4 h-4" />
          <span>ENCOUNTERS DEBUG</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* State Overview */}
      <div className="space-y-1.5 mb-4 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex justify-between">
          <span className="text-slate-400">Päevafaas:</span>
          <span className="text-amber-300 font-bold">{worldTime.phaseLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Kohtumiste tihedus:</span>
          <span className="text-emerald-400">0.85 (norm)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Aktiivsed NPC-d:</span>
          <span className="text-cyan-300 font-bold">{activeCount} / 3</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Viimane tegelane:</span>
          <span className="text-purple-300">{lastNPC ? lastNPC.name : 'Puudub'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Linnajagu:</span>
          <span className="text-slate-200">{currentDistrict}</span>
        </div>
      </div>

      {/* Candidate Weights Table */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-amber-400/90 mb-1.5 uppercase tracking-wider">
          Tõenäosuse kandidaadid
        </div>
        <div className="grid grid-cols-2 gap-1 bg-slate-900/50 p-2 rounded-xl text-[10px]">
          <div className="flex justify-between">
            <span>RAVER</span>
            <span className="text-amber-300">22%</span>
          </div>
          <div className="flex justify-between">
            <span>DRIFTER</span>
            <span className="text-amber-300">18%</span>
          </div>
          <div className="flex justify-between">
            <span>WORKER</span>
            <span className="text-amber-300">14%</span>
          </div>
          <div className="flex justify-between">
            <span>VENDOR</span>
            <span className="text-amber-300">12%</span>
          </div>
          <div className="flex justify-between">
            <span>SECURITY</span>
            <span className="text-amber-300">10%</span>
          </div>
          <div className="flex justify-between">
            <span>MYSTERY</span>
            <span className="text-amber-300">4%</span>
          </div>
        </div>
      </div>

      {/* Debug Controls */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-amber-400/90 mb-1 uppercase tracking-wider">
          Käsitsi käivitused
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSpawnSpecific('CIVILIAN')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
          >
            [Spawn Civilian]
          </button>
          <button
            onClick={() => handleSpawnSpecific('RAVER')}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800 active:scale-95 transition"
          >
            [Spawn Raver]
          </button>
          <button
            onClick={() => handleSpawnSpecific('WORKER')}
            className="px-2.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800 active:scale-95 transition"
          >
            [Spawn Worker]
          </button>
          <button
            onClick={handleForceRare}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 active:scale-95 transition"
          >
            [Force Rare]
          </button>
        </div>

        <button
          onClick={handleForceGroup}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-800 active:scale-95 transition mt-1"
        >
          <Users className="w-3.5 h-3.5" />
          <span>[Force Group] (3+ Reivarit)</span>
        </button>

        <button
          onClick={handleClearNPCs}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 active:scale-95 transition mt-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>[Clear All NPCs]</span>
        </button>
      </div>
    </div>
  );
};
