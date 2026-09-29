import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Heart, Zap, MapPin, Sparkles, ShieldAlert, Globe } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';

export const CompassHeader: React.FC = () => {
  const { profile, companion, streets, settings, setLanguage } = useGameStore();
  const t = getTranslation(settings.language);

  const totalStreets = streets.length || 1;
  const discoveredCount = streets.filter((s) => s.discovered).length;
  const percent = Math.round((discoveredCount / totalStreets) * 100);

  const xpProgress = Math.min(
    100,
    Math.round(((profile.explorationXP % 150) / 150) * 100)
  );

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 pb-2 pointer-events-none">
      <div className="max-w-md mx-auto flex flex-col gap-1.5 pointer-events-auto">
        {/* Main Status Pill Container */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl game-glass-panel shadow-lg shadow-black/40">
          {/* Left: Companion Vitals */}
          <div className="flex items-center gap-3">
            {/* Happiness / Affection */}
            <div className="flex items-center gap-1.5" title={`Kaaslase rõõm: ${companion.happiness}%`}>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/80 animate-pulse" />
              <span className="font-mono text-xs font-bold text-rose-200">
                {companion.happiness}
              </span>
            </div>

            {/* Energy */}
            <div className="flex items-center gap-1.5" title={`Kaaslase energia: ${companion.energy}%`}>
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/80" />
              <span className="font-mono text-xs font-bold text-amber-200">
                {companion.energy}
              </span>
            </div>

            {/* Exploration % */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10" title="Avastatud tänavaid">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-cyan-200">
                {percent}%
              </span>
            </div>
          </div>

          {/* Right: Level & Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(settings.language === 'et' ? 'en' : 'et')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 transition-colors"
              title="Vaheta keelt / Switch language"
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>{settings.language.toUpperCase()}</span>
            </button>

            {/* Player Level Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-extrabold text-orange-300">
                Tase {profile.level}
              </span>
            </div>
          </div>
        </div>

        {/* Small Sub-bar: Exploration XP Progress */}
        <div className="w-full px-2">
          <div className="w-full h-1 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.max(5, xpProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
