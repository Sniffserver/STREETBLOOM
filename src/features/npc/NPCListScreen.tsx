import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { NPC } from '../../types/game';
import { MessageSquare, Clock, Heart, MapPin, Sparkles, Network } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { soundManager } from '../../audio/soundManager';

interface NPCListScreenProps {
  onOpenChat: (npc: NPC) => void;
}

export const NPCListScreen: React.FC<NPCListScreenProps> = ({ onOpenChat }) => {
  const { npcs, settings, setSelectedNPCForChat } = useGameStore();
  const t = getTranslation(settings.language);

  const currentHour = new Date().getHours();

  const handleChat = (npc: NPC) => {
    soundManager.playTap();
    setSelectedNPCForChat(npc);
    onOpenChat(npc);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-y-auto pb-24 px-4 pt-16">
      <div className="max-w-md mx-auto w-full flex flex-col gap-4">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Linna Elanikud</h1>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
              {npcs.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Püsivad tegelased seotud teadmiste võrgustikuga (World Knowledge Graph).
          </p>
        </div>

        {/* NPC Cards */}
        <div className="flex flex-col gap-3">
          {npcs.map((npc) => {
            const currentSlot =
              npc.schedule.find((s) => currentHour >= s.startHour && currentHour < s.endHour) ||
              npc.schedule[0];

            const relLabel = t.npc.levels[npc.relationshipLevel] || 'Võõras';

            return (
              <div
                key={npc.id}
                className="p-4 rounded-3xl game-glass-panel border-purple-500/20 hover:border-purple-500/40 transition flex flex-col gap-3"
              >
                {/* Top: Avatar, Name, Relationship */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-600/30">
                      {npc.avatar}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">{npc.name}</h3>
                      <p className="text-xs text-slate-300">{npc.title}</p>
                      <p className="text-[11px] text-purple-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {npc.district}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-bold text-purple-300">
                      {relLabel} (Tase {npc.relationshipLevel})
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">
                      {npc.relationshipPoints} pts
                    </span>
                  </div>
                </div>

                {/* Current Schedule & Activity */}
                <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-amber-300 font-semibold">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Praegune asukoht: {currentSlot.locationName}
                    </span>
                    <span className="font-mono text-[10px]">
                      {currentSlot.startHour}:00 - {currentSlot.endHour}:00
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">
                    "{currentSlot.activityDescription}"
                  </p>
                </div>

                {/* World Knowledge Graph Links */}
                {npc.knowledge && npc.knowledge.length > 0 && (
                  <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-500/15 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                      <Network className="w-3 h-3" />
                      Teadmiste Võrgustik (Knowledge Graph):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {npc.knowledge.map((k) => (
                        <span
                          key={k.id}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300"
                          title={k.detail}
                        >
                          🔗 {k.target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personality & Action */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400 max-w-[65%] line-clamp-1">
                    {npc.personalityDesc}
                  </p>
                  <button
                    onClick={() => handleChat(npc)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md active:scale-95 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Räägi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
