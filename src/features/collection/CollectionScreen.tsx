import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { BookOpen, MapPin, Sparkles, Award, Lock, CheckCircle2 } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { SEED_ITEMS } from '../../data/itemsSeed';

type Tab = 'streets' | 'places' | 'items' | 'achievements';

export const CollectionScreen: React.FC = () => {
  const { streets, places, inventory, achievements, settings } = useGameStore();
  const t = getTranslation(settings.language);

  const [activeTab, setActiveTab] = useState<Tab>('streets');

  const discoveredStreets = streets.filter((s) => s.discovered);
  const discoveredPlaces = places.filter((p) => p.discovered);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-y-auto pb-24 px-4 pt-16">
      <div className="max-w-md mx-auto w-full flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Avastusraamat</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sinu isiklik kogumik kaardistatud tänavatest, aaretest ja saavutustest.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-white/5">
          <button
            onClick={() => setActiveTab('streets')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'streets' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tänavad ({discoveredStreets.length}/{streets.length})
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'places' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Paigad ({discoveredPlaces.length}/{places.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'items' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Esemed ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'achievements' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saavutused
          </button>
        </div>

        {/* Streets Grid */}
        {activeTab === 'streets' && (
          <div className="flex flex-col gap-2.5">
            {streets.map((street) => {
              const isDiscovered = street.discovered;
              return (
                <div
                  key={street.id}
                  className={`p-3.5 rounded-2xl game-glass-panel border transition flex items-center justify-between ${
                    isDiscovered ? 'border-cyan-500/30' : 'border-white/5 opacity-55'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isDiscovered
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDiscovered ? '🧭' : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {isDiscovered ? street.name : '??? (Uduga varjatud)'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {street.district} • {street.lengthMeters}m
                      </p>
                    </div>
                  </div>

                  {isDiscovered ? (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        Avastatud!
                      </span>
                      <span className="text-[9px] text-slate-500">
                        Külastatud {street.visitCount}x
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Kõnni lähemale</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Places Grid */}
        {activeTab === 'places' && (
          <div className="flex flex-col gap-2.5">
            {places.map((place) => {
              const isDiscovered = place.discovered;
              return (
                <div
                  key={place.id}
                  className={`p-3.5 rounded-2xl game-glass-panel border transition flex flex-col gap-1.5 ${
                    isDiscovered ? 'border-emerald-500/30' : 'border-white/5 opacity-55'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{isDiscovered ? place.icon || '📍' : '🔒'}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {isDiscovered ? place.name : 'Salajane paik'}
                        </h4>
                        <p className="text-[10px] text-slate-400">{place.district}</p>
                      </div>
                    </div>
                    {isDiscovered && (
                      <span className="text-[10px] text-emerald-400 font-semibold">Leitud</span>
                    )}
                  </div>
                  {isDiscovered && (
                    <p className="text-[11px] text-slate-300 leading-snug">{place.description}</p>
                  )}
                  {isDiscovered && place.secretClue && (
                    <p className="text-[10px] text-amber-300/80 italic">💡 {place.secretClue}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Items Grid */}
        {activeTab === 'items' && (
          <div className="grid grid-cols-2 gap-2.5">
            {inventory.length === 0 ? (
              <div className="col-span-2 text-center py-10 game-glass-panel rounded-3xl p-6">
                <p className="text-xs text-slate-400">
                  Seljakott on tühi. Tänavatel kõndides võid leida sulgi, kive ja taimi!
                </p>
              </div>
            ) : (
              inventory.map((inv) => {
                const def = SEED_ITEMS.find((it) => it.id === inv.itemId);
                if (!def) return null;
                return (
                  <div
                    key={inv.itemId}
                    className="p-3 rounded-2xl game-glass-panel border border-white/5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{def.icon}</span>
                      <span className="text-xs font-mono font-bold text-orange-400">
                        x{inv.count}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-tight">{def.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {def.description}
                    </p>
                    <span className="text-[9px] text-purple-300 uppercase tracking-wider font-semibold">
                      {def.rarity}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Achievements Grid */}
        {activeTab === 'achievements' && (
          <div className="flex flex-col gap-2.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl game-glass-panel border transition flex items-center justify-between ${
                  ach.unlocked
                    ? 'border-amber-400/40 bg-amber-950/20'
                    : 'border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${
                      ach.unlocked
                        ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ach.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                    <p className="text-[10px] text-slate-400">{ach.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  {ach.unlocked ? (
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tehtud
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {ach.progress}/{ach.maxProgress}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
