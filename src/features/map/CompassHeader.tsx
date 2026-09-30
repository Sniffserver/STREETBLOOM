import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Heart, Zap, MapPin, Sparkles, ShieldAlert, Globe, BookOpen, Eye, Activity } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { soundManager } from '../../audio/soundManager';
import { CityPulseEngine } from '../../game/world/CityPulseEngine';

interface CompassHeaderProps {
  onToggleExploreMode?: () => void;
  isExploreMode?: boolean;
}

export const CompassHeader: React.FC<CompassHeaderProps> = ({
  onToggleExploreMode,
  isExploreMode = false,
}) => {
  const { profile, companion, streets, settings, setLanguage, setActiveScreen } = useGameStore();
  const t = getTranslation(settings.language);

  const hour = new Date().getHours();
  const pulse = CityPulseEngine.calculateCityPulse(hour, hour >= 22 || hour <= 5, 120);

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
          <div className="flex items-center gap-2">
            {/* Happiness / Affection */}
            <div className="flex items-center gap-1" title={`Kaaslase rõõm: ${companion.happiness}%`}>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/80 animate-pulse" />
              <span className="font-mono text-xs font-bold text-rose-200">
                {companion.happiness}
              </span>
            </div>

            {/* Energy */}
            <div className="flex items-center gap-1" title={`Kaaslase energia: ${companion.energy}%`}>
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80" />
              <span className="font-mono text-xs font-bold text-amber-200">
                {companion.energy}
              </span>
            </div>

            {/* City Pulse Indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>{pulse.titleLabel}</span>
            </div>
          </div>

          {/* Right: Memory Map & Explore Mode Buttons */}
          <div className="flex items-center gap-1.5">
            {onToggleExploreMode && (
              <button
                onClick={() => {
                  soundManager.playTap();
                  onToggleExploreMode();
                }}
                className={`p-1.5 rounded-xl border text-xs font-bold transition ${
                  isExploreMode
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-cyan-300 border-white/10'
                }`}
                title="Avastusrežiim (Explore Mode)"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {/* Memory Map Diary Toggle Button */}
            <button
              onClick={() => {
                soundManager.playTap();
                setActiveScreen('memory_map');
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition shadow-sm"
              title="Ava Linnapäevik & Mälukaart"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Päevik</span>
            </button>
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
