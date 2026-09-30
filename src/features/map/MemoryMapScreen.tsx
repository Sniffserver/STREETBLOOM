import React, { useState } from 'react';
import { gameEngine } from '../../game/engine/gameEngine';
import { StreetMemory, StreetMemoryItemType } from '../../game/world/StreetMemory';
import { BookOpen, MapPin, Sparkles, Filter, Heart, Award, ArrowLeft, Star, Compass } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface MemoryMapScreenProps {
  onBack?: () => void;
}

type MemoryFilter = 'ALL' | 'FIRST_DISCOVERY' | 'NPC_MEETING' | 'QUEST' | 'IMPORTANT';

export const MemoryMapScreen: React.FC<MemoryMapScreenProps> = ({ onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState<MemoryFilter>('ALL');
  const [selectedStreetId, setSelectedStreetId] = useState<string | null>(null);

  // Get all street memories recorded by player
  const allMemories = gameEngine.streetMemoryEngine.getAllMemories();

  // Selected memory details
  const activeMemory = allMemories.find((m) => m.streetId === selectedStreetId) || allMemories[0];

  // Helper filter logic
  const filteredMemories = allMemories.filter((mem) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'FIRST_DISCOVERY') return mem.firstDiscoveredAt;
    if (selectedFilter === 'NPC_MEETING') return mem.keyMemories.some((k) => k.type === 'NPC_MEETING');
    if (selectedFilter === 'QUEST') return mem.keyMemories.some((k) => k.type === 'QUEST_COMPLETED');
    if (selectedFilter === 'IMPORTANT') return mem.keyMemories.some((k) => k.type === 'COMPANION_EVOLUTION' || k.type === 'SECRET_FOUND');
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-24 flex flex-col gap-4 animate-fade-in max-w-lg mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                soundManager.playTap();
                onBack();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              Sinu Isiklik Linnapäevik
            </span>
            <h1 className="text-xl font-black text-white flex items-center gap-2 leading-tight">
              📖 Sinu Linn
            </h1>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
          {allMemories.length} tänavat mälus
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => {
            soundManager.playTap();
            setSelectedFilter('ALL');
          }}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
            selectedFilter === 'ALL'
              ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          Kõik
        </button>
        <button
          onClick={() => {
            soundManager.playTap();
            setSelectedFilter('FIRST_DISCOVERY');
          }}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border flex items-center gap-1 ${
            selectedFilter === 'FIRST_DISCOVERY'
              ? 'bg-orange-500 text-white border-orange-400'
              : 'bg-slate-900 text-orange-400/80 border-orange-500/20 hover:text-orange-300'
          }`}
        >
          🟠 Esmaavastused
        </button>
        <button
          onClick={() => {
            soundManager.playTap();
            setSelectedFilter('NPC_MEETING');
          }}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border flex items-center gap-1 ${
            selectedFilter === 'NPC_MEETING'
              ? 'bg-purple-600 text-white border-purple-400'
              : 'bg-slate-900 text-purple-400/80 border-purple-500/20 hover:text-purple-300'
          }`}
        >
          🟣 Mälestused
        </button>
        <button
          onClick={() => {
            soundManager.playTap();
            setSelectedFilter('QUEST');
          }}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border flex items-center gap-1 ${
            selectedFilter === 'QUEST'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-slate-900 text-emerald-400/80 border-emerald-500/20 hover:text-emerald-300'
          }`}
        >
          🟢 Ülesanded
        </button>
        <button
          onClick={() => {
            soundManager.playTap();
            setSelectedFilter('IMPORTANT');
          }}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border flex items-center gap-1 ${
            selectedFilter === 'IMPORTANT'
              ? 'bg-cyan-600 text-white border-cyan-400'
              : 'bg-slate-900 text-cyan-400/80 border-cyan-500/20 hover:text-cyan-300'
          }`}
        >
          ⭐ Olulised hetked
        </button>
      </div>

      {/* Main Memory Street Grid & Selected Detail */}
      {allMemories.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col items-center gap-3">
          <Compass className="w-12 h-12 text-slate-600 animate-pulse" />
          <h3 className="text-base font-bold text-slate-300">Sinu linnapäevik on veel tühi</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Alusta kõndimist ja avasta tänavamaastikku! Iga kohtumine, Pip-i reaktsioon ja täitmist leidnud ülesanne talletatakse siia.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Active Street Diary Card */}
          {activeMemory && (
            <div className="p-5 rounded-3xl game-glass-panel border border-amber-500/30 flex flex-col gap-3 shadow-xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    {activeMemory.district}
                  </span>
                  <h2 className="text-lg font-black text-white leading-tight">
                    {activeMemory.streetName}
                  </h2>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold">
                  {activeMemory.visitCount} külastust
                </div>
              </div>

              {/* Quick Stats bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                  <span className="block text-slate-400">Avastatud</span>
                  <span className="text-orange-300 font-mono">
                    {new Date(activeMemory.firstDiscoveredAt).toLocaleDateString('et-EE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                  <span className="block text-slate-400">Kohtumisi</span>
                  <span className="text-purple-300 font-mono">{activeMemory.encountersCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                  <span className="block text-slate-400">Ülesandeid</span>
                  <span className="text-emerald-300 font-mono">{activeMemory.questsCompletedCount}</span>
                </div>
              </div>

              {/* Memory Entries Timeline */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Mälestuste ajalugu:
                </span>

                {activeMemory.keyMemories.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {activeMemory.keyMemories.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/20 text-xs flex items-start gap-2.5 shadow-sm"
                      >
                        <span className="text-base shrink-0">
                          {m.type === 'NPC_MEETING'
                            ? '🟣'
                            : m.type === 'QUEST_COMPLETED'
                            ? '🟢'
                            : m.type === 'COMPANION_EVOLUTION'
                            ? '⭐'
                            : '🟠'}
                        </span>
                        <div>
                          <div className="font-bold text-amber-200">{m.title}</div>
                          <div className="text-[11px] text-slate-300 mt-0.5">{m.description}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-1">
                            {new Date(m.timestamp).toLocaleTimeString('et-EE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 italic">
                    "Siia tänavale on taltunud vaiksed jalajäljed. Teekond jätkub."
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List of Street Memories to select */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vali tänav mälukaardilt ({filteredMemories.length})
            </span>

            <div className="grid grid-cols-1 gap-2">
              {filteredMemories.map((mem) => {
                const isSelected = mem.streetId === activeMemory?.streetId;
                return (
                  <button
                    key={mem.streetId}
                    onClick={() => {
                      soundManager.playTap();
                      setSelectedStreetId(mem.streetId);
                    }}
                    className={`p-3.5 rounded-2xl text-left transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                        : 'bg-slate-900/80 border-white/5 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold">
                        🗺️
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{mem.streetName}</div>
                        <div className="text-[10px] text-slate-400">
                          {mem.district} • {mem.keyMemories.length} mälestust
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] text-amber-300/80">
                      {mem.visitCount}x külastatud
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
