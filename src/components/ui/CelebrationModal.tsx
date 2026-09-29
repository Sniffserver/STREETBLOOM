import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../store/useGameStore';
import { Sparkles, MapPin, Gift } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

export const CelebrationModal: React.FC = () => {
  const { celebrationData, setCelebrationData } = useGameStore();

  useEffect(() => {
    if (!celebrationData) return;

    // Trigger juicy confetti explosion
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#22d3ee', '#f97316', '#a855f7', '#4ade80'],
      });
    } catch {
      // Ignore if canvas blocked
    }
  }, [celebrationData]);

  if (!celebrationData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl game-glass-panel border-2 border-cyan-400/50 p-6 flex flex-col items-center text-center gap-4 shadow-2xl shadow-cyan-500/20 animate-scale-up">
        {/* Glow Blossom Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/40 animate-bounce">
          ✨
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400">
            {celebrationData.type === 'street'
              ? 'Uus tänav avastatud!'
              : 'Salajane paik leitud!'}
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {celebrationData.title}
          </h2>
          <p className="text-xs text-slate-300 mt-1">{celebrationData.subtitle}</p>
        </div>

        {/* XP & Item Award */}
        <div className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>+{celebrationData.xp} XP</span>
          </div>

          {celebrationData.itemReward && (
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs pl-3 border-l border-white/10">
              <Gift className="w-4 h-4 text-purple-400" />
              <span>{celebrationData.itemReward}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            soundManager.playTap();
            setCelebrationData(null);
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/30 transition active:scale-95"
        >
          Jätka Avastamist
        </button>
      </div>
    </div>
  );
};
