import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Terminal, Sun, Moon, CloudRain, Users, Footprints, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';
import { AIBudgetTracker } from '../../services/ai/AIBudgetTracker';
import { PrivacyAnalytics } from '../../services/analytics/PrivacyAnalytics';

interface DebugPanelProps {
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const {
    currentLocation,
    teleportTo,
    streets,
    feedCompanion,
    petCompanion,
    startQuest,
    quests,
  } = useGameStore();

  const [simMessage, setSimNotice] = useState<string | null>(null);
  const metrics = AIBudgetTracker.getMetrics();

  const notify = (msg: string) => {
    soundManager.playTap();
    setSimNotice(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[92vh] rounded-3xl bg-slate-900 border border-amber-500/40 p-4 flex flex-col gap-3.5 overflow-y-auto text-xs text-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300">StreetBloom Simulation Console</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {simMessage && (
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold">
            {simMessage}
          </div>
        )}

        {/* 1. TIME CONTROL */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-400" /> KIIR-KELLAAEG (TIME)
          </h3>
          <div className="grid grid-cols-5 gap-1 font-bold text-[10px]">
            <button onClick={() => notify('Simuleeritud: DAWN (Koidik)')} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-300">Dawn</button>
            <button onClick={() => notify('Simuleeritud: DAY (Päev)')} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-300">Day</button>
            <button onClick={() => notify('Simuleeritud: DUSK (Hämarik)')} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300">Dusk</button>
            <button onClick={() => notify('Simuleeritud: NIGHT (Öö)')} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300">Night</button>
            <button onClick={() => notify('Simuleeritud: DEEP_NIGHT (Süvaöö)')} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300">Deep</button>
          </div>
        </div>

        {/* 2. ENCOUNTERS SPAWNER */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-400" /> KOHTUMISED (ENCOUNTERS)
          </h3>
          <div className="grid grid-cols-3 gap-1.5 font-bold text-[10px]">
            <button onClick={() => notify('Tekitatud: Tavanaine (Civilian)')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">Civilian</button>
            <button onClick={() => notify('Tekitatud: Töömees (Worker)')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300">Worker</button>
            <button onClick={() => notify('Tekitatud: Reiver (Raver)')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300">Raver</button>
            <button onClick={() => notify('Tekitatud: Haruldane (Rare Stranger)')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300">Rare</button>
            <button onClick={() => notify('Tekitatud: Rühm (Group Spawn)')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300">Group</button>
          </div>
        </div>

        {/* 3. WORLD STATE */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-cyan-400" /> MAAILMA OLEK (WORLD)
          </h3>
          <div className="grid grid-cols-4 gap-1 font-bold text-[10px]">
            <button onClick={() => notify('Ilm: Vihmasajune linn')} className="p-1.5 rounded-lg bg-slate-800 text-cyan-300">Rain</button>
            <button onClick={() => notify('Ilm: Selge taevas')} className="p-1.5 rounded-lg bg-slate-800 text-amber-300">Clear</button>
            <button onClick={() => notify('Tihedus: Tihe linnarütm')} className="p-1.5 rounded-lg bg-slate-800 text-purple-300">Dense</button>
            <button onClick={() => notify('Tihedus: Vaikne linn')} className="p-1.5 rounded-lg bg-slate-800 text-slate-300">Quiet</button>
          </div>
        </div>

        {/* 4. PLAYER BOOSTS */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Footprints className="w-3 h-3 text-emerald-400" /> MÄNGIJA MÕÕDIKUD (PLAYER)
          </h3>
          <div className="grid grid-cols-3 gap-1 font-bold text-[10px]">
            <button onClick={() => {
              const p = useGameStore.getState().profile;
              p.explorationXP += 50;
              notify('+100m kõnnitud (+50 XP)');
            }} className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300">+100m Walk</button>

            <button onClick={() => {
              const nextUndisc = streets.find((s) => !s.discovered);
              if (nextUndisc && nextUndisc.coordinates[0]) {
                teleportTo(nextUndisc.coordinates[0][1], nextUndisc.coordinates[0][0]);
                notify(`Avastatud: ${nextUndisc.name}`);
              }
            }} className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300">Discover Street</button>

            <button onClick={() => {
              const p = useGameStore.getState().profile;
              p.explorationXP += 100;
              notify('+100 XP lisatud');
            }} className="p-2 rounded-lg bg-purple-950 border border-purple-500/30 text-purple-300">+100 XP</button>
          </div>
        </div>

        {/* 5. AI TELEMETRY BUDGET */}
        <div className="p-3 rounded-2xl bg-black/60 border border-white/5 font-mono text-[10px] flex flex-col gap-1 text-slate-300">
          <p className="text-amber-400 font-bold">AI TELEMEETRIA BÜDJET:</p>
          <p>Päringuid kokku: {metrics.aiRequestsCount} | Tokeneid: {metrics.tokensUsed}</p>
          <p>Keskmine viivitus: {metrics.avgLatencyMs} ms | Tõrkeid: {metrics.aiFailuresCount}</p>
          <p>Puhverdatud vastuseid: {metrics.cachedResponsesCount} | Tagavaravastuseid: {metrics.fallbackResponsesCount}</p>
        </div>
      </div>
    </div>
  );
};
