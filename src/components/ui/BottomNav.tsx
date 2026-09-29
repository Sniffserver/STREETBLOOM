import React from 'react';
import { useGameStore, ActiveScreen } from '../../store/useGameStore';
import { Sparkles, Map, BookOpen, MessageSquare, ScrollText, User, Settings, Compass } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { soundManager } from '../../audio/soundManager';

export const BottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, settings, companion, quests } = useGameStore();
  const t = getTranslation(settings.language);

  const activeQuestsCount = quests.filter((q) => q.status === 'active').length;

  const navItems: { id: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Keskus',
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'explore',
      label: t.nav.explore,
      icon: <Map className="w-5 h-5" />,
    },
    {
      id: 'companion',
      label: t.nav.companion,
      icon: (
        <span className="text-xl inline-block transition-transform group-hover:scale-110">
          🐾
        </span>
      ),
      badge: companion.hunger < 30 ? 1 : undefined,
    },
    {
      id: 'npcs',
      label: t.nav.npcs,
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'quests',
      label: t.nav.quests,
      icon: <ScrollText className="w-5 h-5" />,
      badge: activeQuestsCount > 0 ? activeQuestsCount : undefined,
    },
    {
      id: 'collection',
      label: t.nav.collection,
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleSelect = (id: ActiveScreen) => {
    soundManager.playTap();
    setActiveScreen(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="flex items-center justify-around py-2 px-1 rounded-3xl game-glass-panel border border-white/10 shadow-2xl shadow-black/80">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`group relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Top Light */}
                {isActive && (
                  <span className="absolute -top-1 w-6 h-1 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80" />
                )}

                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[10px] font-extrabold text-white animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] tracking-tight mt-1 truncate max-w-[54px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
