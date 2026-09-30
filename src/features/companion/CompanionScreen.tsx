import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CompanionAvatar } from './CompanionAvatar';
import {
  Heart,
  Zap,
  Utensils,
  Smile,
  Compass,
  Sparkles,
  MessageCircle,
  Gamepad2,
  Clock,
  Footprints,
  Flame,
  Brain,
} from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { SEED_ITEMS } from '../../data/itemsSeed';
import { soundManager } from '../../audio/soundManager';

type Tab = 'status' | 'behavior' | 'memories' | 'evolution';

export const CompanionScreen: React.FC = () => {
  const {
    companion,
    inventory,
    settings,
    feedCompanion,
    petCompanion,
    talkCompanion,
    playCompanion,
    restCompanion,
  } = useGameStore();

  const t = getTranslation(settings.language);
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [feedPickerOpen, setFeedPickerOpen] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(
    companion.currentThought || 'Mis me järgmise nurga tagant leiame?'
  );

  const bp = companion.behavioralProfile;

  const foodItems = inventory
    .map((inv) => ({
      ...inv,
      def: SEED_ITEMS.find((it) => it.id === inv.itemId),
    }))
    .filter((it) => it.def?.category === 'snack' && it.count > 0);

  const handlePet = () => {
    soundManager.playCompanionPet();
    petCompanion();
    setSpeechBubble('*Pip teeb nurr-nurr ja paneb silmad kinni.*');
  };

  const handleTalk = () => {
    soundManager.playTap();
    const thought = talkCompanion();
    setSpeechBubble(thought);
  };

  const handleFeed = (itemId?: string) => {
    soundManager.playCompanionFeed();
    const res = feedCompanion(itemId);
    setFeedPickerOpen(false);
    setSpeechBubble(res.message);
  };

  const timeOfDayLabels: Record<string, string> = {
    morning: '🌅 Hommikurändur',
    day: '☀️ Päevane sammuja',
    evening: '🌆 Õhtune uurija',
    night: '🌙 Öine vaatleja',
  };

  const explorationStyleLabels: Record<string, string> = {
    completionist: '🎯 Lõpuleviija (100% kaardistaja)',
    wanderer: '🧭 Rändur (uudishimulik kulgeja)',
    social: '💬 Suhtleja (elanike sõber)',
    collector: '🎒 Kollektsionäär (aarete otsija)',
    speedwalker: '⚡ Kiirkõndija (tempokas liikuja)',
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-y-auto pb-24 px-4 pt-16">
      <div className="max-w-md mx-auto w-full flex flex-col gap-4">
        {/* Companion Header & Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {companion.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-[11px] font-bold">
                {companion.evolutionForm}
              </span>
            </div>
            <p className="text-xs text-slate-400">{companion.species}</p>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/5">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'status' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoolitsus
            </button>
            <button
              onClick={() => setActiveTab('behavior')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'behavior' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Käitumine
            </button>
            <button
              onClick={() => setActiveTab('memories')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'memories' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Päevik
            </button>
            <button
              onClick={() => setActiveTab('evolution')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'evolution' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Areng
            </button>
          </div>
        </div>

        {/* Central Companion Avatar & Speech Bubble */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          {speechBubble && (
            <div className="relative mb-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-400/30 text-xs font-medium text-amber-200 max-w-xs text-center shadow-lg backdrop-blur-md animate-fade-in">
              <p>{speechBubble}</p>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-900 border-r border-b border-orange-400/30" />
            </div>
          )}

          <CompanionAvatar companion={companion} size={160} interactive={true} onPet={handlePet} />
          <span className="text-[11px] text-slate-500 mt-1">Puuduta kaasa sügamiseks</span>
        </div>

        {/* Tab 1: Status & Care Actions */}
        {activeTab === 'status' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFeedPickerOpen(true)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl game-glass-panel border-orange-500/20 hover:border-orange-500/50 active:scale-95 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200">{t.companion.actions.feed}</span>
              </button>

              <button
                onClick={handlePet}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl game-glass-panel border-rose-500/20 hover:border-rose-500/50 active:scale-95 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200">{t.companion.actions.pet}</span>
              </button>

              <button
                onClick={handleTalk}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl game-glass-panel border-cyan-500/20 hover:border-cyan-500/50 active:scale-95 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200">{t.companion.actions.talk}</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playTap();
                  playCompanion();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl game-glass-panel border-purple-500/20 hover:border-purple-500/50 active:scale-95 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200">{t.companion.actions.play}</span>
              </button>
            </div>

            {/* Vitals Progress Grid */}
            <div className="p-4 rounded-3xl game-glass-panel flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Seisund & Vajadused
              </h3>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Utensils className="w-3.5 h-3.5 text-orange-400" />
                    Kõhutäis
                  </span>
                  <span className="font-mono text-orange-300">{companion.hunger}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-400 transition-all duration-300"
                    style={{ width: `${companion.hunger}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Smile className="w-3.5 h-3.5 text-rose-400" />
                    Õnnetunne
                  </span>
                  <span className="font-mono text-rose-300">{companion.happiness}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${companion.happiness}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Energia
                  </span>
                  <span className="font-mono text-amber-300">{companion.energy}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${companion.energy}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Heart className="w-3.5 h-3.5 text-purple-400" />
                    Kiindumus sinusse
                  </span>
                  <span className="font-mono text-purple-300">{companion.affection}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-400 transition-all duration-300"
                    style={{ width: `${companion.affection}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Behavioral Profile (Pip's learned memory of player habits) */}
        {activeTab === 'behavior' && (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-300">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Õpitud Käitumismälu</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pip ei kasuta juhuslikke repliike, vaid õpib tundma sinu tegelikke liikumismustreid,
                kõnniaegu ja avastamisviise.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Eelistatud Kellaaeg</h4>
                    <p className="text-[11px] text-slate-400">
                      {timeOfDayLabels[bp?.preferredTimeOfDay || 'evening']}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Avastamisstiil</h4>
                    <p className="text-[11px] text-slate-400">
                      {explorationStyleLabels[bp?.explorationStyle || 'wanderer']}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Footprints className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Keskmine Jalutuskäik</h4>
                    <p className="text-[11px] text-slate-400">
                      ~{bp?.averageWalkLengthMeters || 450} meetrit sessiooni kohta
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Memories */}
        {activeTab === 'memories' && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pipi Isiklik Päevik ({companion.memories.length})
            </h3>
            {companion.memories.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Pole veel mälestusi.</p>
            ) : (
              companion.memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3.5 rounded-2xl game-glass-panel border-white/5 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-orange-400 uppercase tracking-wider">
                      {mem.type}
                    </span>
                    <span>{new Date(mem.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200">{mem.summary}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Evolution Paths */}
        {activeTab === 'evolution' && (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Kaaslase Arenguteed</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kaaslane kohandub sinu reaalsete avastamisharjumustega:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3.5 rounded-2xl game-glass-panel border-cyan-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-cyan-300">Rajaleidja (Scout)</h4>
                  <p className="text-[11px] text-slate-400">Palju kõndimist ja uute tänavate avastamist</p>
                </div>
                <span className="text-xl">🧭</span>
              </div>

              <div className="p-3.5 rounded-2xl game-glass-panel border-purple-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-300">Suhtleja (Charmer)</h4>
                  <p className="text-[11px] text-slate-400">Sagedased vestlused ja sidemed elanikega</p>
                </div>
                <span className="text-xl">🌸</span>
              </div>

              <div className="p-3.5 rounded-2xl game-glass-panel border-amber-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Kollektsionäär (Hoarder)</h4>
                  <p className="text-[11px] text-slate-400">Paljude unikaalsete linnaleidude kogumine</p>
                </div>
                <span className="text-xl">🎒</span>
              </div>

              <div className="p-3.5 rounded-2xl game-glass-panel border-indigo-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-300">Ööliblikas (Moon)</h4>
                  <p className="text-[11px] text-slate-400">Hämariku ja öise linna avastamine</p>
                </div>
                <span className="text-xl">🌙</span>
              </div>
            </div>
          </div>
        )}

        {/* Feeding Modal Picker */}
        {feedPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl game-glass-panel border border-white/10 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-400" />
                  Vali toit seljakotist
                </h3>
                <button
                  onClick={() => setFeedPickerOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {foodItems.length === 0 ? (
                <div className="text-center py-6 flex flex-col items-center gap-2">
                  <span className="text-3xl">🥐</span>
                  <p className="text-xs text-slate-400">
                    Seljakotis pole suupisteid. Avasta tänavaid või külasta Marta kohvikut!
                  </p>
                  <button
                    onClick={() => handleFeed()}
                    className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white"
                  >
                    Anna metsamarju (Põhitoit)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {foodItems.map((f) => (
                    <button
                      key={f.itemId}
                      onClick={() => handleFeed(f.itemId)}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{f.def?.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{f.def?.name}</p>
                          <p className="text-[10px] text-orange-300">
                            +{f.def?.feedNutrition} toiteväärtus
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">x{f.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
