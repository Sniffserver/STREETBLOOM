import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Sparkles, MapPin, Footprints, Flame, Trophy, Award, User } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { CompanionAvatar } from '../companion/CompanionAvatar';

export const ProfileScreen: React.FC = () => {
  const { profile, companion, streets, achievements, settings } = useGameStore();
  const t = getTranslation(settings.language);

  const kmWalked = (profile.totalDistanceMeters / 1000).toFixed(2);
  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-y-auto pb-24 px-4 pt-16">
      <div className="max-w-md mx-auto w-full flex flex-col gap-4">
        {/* Profile Card */}
        <div className="p-5 rounded-3xl game-glass-panel border-cyan-500/20 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
            🧭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">{profile.name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                Tase {profile.level}
              </span>
            </div>
            <p className="text-xs text-slate-400">Linnauurija & rajaleidja</p>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{profile.explorationXP} XP</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Footprints className="w-4 h-4 text-cyan-400" />
              Läbitud distants
            </span>
            <span className="text-xl font-mono font-extrabold text-white">{kmWalked} km</span>
          </div>

          <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Avastatud tänavaid
            </span>
            <span className="text-xl font-mono font-extrabold text-white">
              {profile.streetsDiscovered} / {streets.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Flame className="w-4 h-4 text-orange-400" />
              Aktiivne seeria
            </span>
            <span className="text-xl font-mono font-extrabold text-white">
              {profile.explorationStreak} päeva
            </span>
          </div>

          <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Trophy className="w-4 h-4 text-amber-400" />
              Saavutused
            </span>
            <span className="text-xl font-mono font-extrabold text-white">
              {unlockedAchievementsCount} / {achievements.length}
            </span>
          </div>
        </div>

        {/* Companion Mini Card */}
        <div className="p-4 rounded-3xl game-glass-panel border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CompanionAvatar companion={companion} size={64} interactive={false} />
            <div>
              <h3 className="text-sm font-bold text-white">{companion.name}</h3>
              <p className="text-xs text-orange-300 font-semibold">{companion.evolutionForm}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Kiindumus: {companion.affection}% • Rõõm: {companion.happiness}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
