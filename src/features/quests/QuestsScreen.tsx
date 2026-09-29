import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Quest } from '../../types/game';
import { ScrollText, CheckCircle2, Clock, Gift, Sparkles, Award } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { soundManager } from '../../audio/soundManager';

export const QuestsScreen: React.FC = () => {
  const { quests, settings, startQuest, completeQuest } = useGameStore();
  const t = getTranslation(settings.language);

  const [filter, setFilter] = useState<'active' | 'available' | 'completed'>('active');

  const filteredQuests = quests.filter((q) => q.status === filter);

  const handleClaim = (q: Quest) => {
    soundManager.playQuestComplete();
    completeQuest(q.id);
  };

  const handleStart = (q: Quest) => {
    soundManager.playTap();
    startQuest(q.id);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-y-auto pb-24 px-4 pt-16">
      <div className="max-w-md mx-auto w-full flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Linna Ülesanded</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Asukohateadlikud otsingud, saladused ja elanike palved.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-white/5">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'active' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aktiivsed ({quests.filter((q) => q.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'available' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saadaval ({quests.filter((q) => q.status === 'available').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'completed' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Täidetud ({quests.filter((q) => q.status === 'completed').length})
          </button>
        </div>

        {/* Quest List */}
        <div className="flex flex-col gap-3">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-10 game-glass-panel rounded-3xl p-6">
              <ScrollText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Selles jaotises pole hetkel ülesandeid.</p>
            </div>
          ) : (
            filteredQuests.map((quest) => {
              const current = quest.currentCount || 0;
              const target = quest.targetCount || 1;
              const isReadyToClaim = quest.status === 'active' && current >= target;
              const progressPct = Math.min(100, Math.round((current / target) * 100));

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-3xl game-glass-panel border transition flex flex-col gap-3 ${
                    isReadyToClaim
                      ? 'border-emerald-400/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                      : 'border-white/10'
                  }`}
                >
                  {/* Top: Type Badge & Title */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                        {t.quests.types[quest.type] || quest.type}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1">{quest.title}</h3>
                    </div>

                    {quest.status === 'completed' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Täidetud
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{quest.description}</p>

                  {/* Hint */}
                  {quest.hint && (
                    <p className="text-[11px] text-cyan-300/90 bg-cyan-950/30 p-2 rounded-xl border border-cyan-500/20">
                      💡 {quest.hint}
                    </p>
                  )}

                  {/* Progress Bar (if active) */}
                  {quest.status === 'active' && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Edenemine</span>
                        <span className="font-mono text-cyan-300">
                          {current} / {target}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rewards & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>+{quest.rewards.xp} XP</span>
                      {quest.rewards.itemCount && (
                        <span className="text-purple-300 text-[11px]">+ Ese</span>
                      )}
                    </div>

                    {isReadyToClaim ? (
                      <button
                        onClick={() => handleClaim(quest)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-extrabold text-slate-950 animate-bounce transition active:scale-95 shadow-md shadow-emerald-500/30"
                      >
                        Võta tasu vastu!
                      </button>
                    ) : quest.status === 'available' ? (
                      <button
                        onClick={() => handleStart(quest)}
                        className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs font-bold text-white transition active:scale-95"
                      >
                        Võta vastu
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
