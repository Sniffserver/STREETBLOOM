import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  Compass,
  MapPin,
  Sparkles,
  Footprints,
  Shield,
  Coins,
  Award,
  ChevronRight,
  Zap,
  Clock,
  Radio,
  Map as MapIcon,
  AlertTriangle,
  Users,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';
import { soundManager } from '../../audio/soundManager';

interface DashboardScreenProps {
  onOpenMap: () => void;
  onOpenRadar: () => void;
  onOpenQuest: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenMap,
  onOpenRadar,
  onOpenQuest,
}) => {
  const {
    profile,
    companion,
    quests,
    npcs,
    simulatedNPCs,
    places,
    currentLocation,
    currentDistrict,
    worldTime,
    activeSpawn,
    accuracyTier,
    districtProjects,
    playerNetwork,
    contributeToProject,
    maintainGear,
    setSelectedNPCForChat,
    setSelectedSimulatedNPC,
    setActiveScreen,
  } = useGameStore();

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const currentProject =
    districtProjects.find((p) => p.district === currentDistrict) || districtProjects[0];

  // Find active primary quest or first available
  const activeQuest = quests.find((q) => q.status === 'active') || quests.find((q) => q.status === 'available');

  // Find nearest NPC
  const npcsWithDistance = npcs.map((npc) => ({
    ...npc,
    distanceMeters: Math.round(
      haversineDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        npc.latitude,
        npc.longitude
      )
    ),
  })).sort((a, b) => a.distanceMeters - b.distanceMeters);

  const nearestNPC = npcsWithDistance[0];

  // Active spawn character (if available)
  const spawnNpc = activeSpawn ? npcs.find((n) => n.id === activeSpawn.npcId) : null;

  return (
    <div className="relative w-full h-full overflow-y-auto pb-24 px-4 pt-4 text-slate-100 bg-[#12151a]">
      {/* Top Header with Brand, District & Accuracy */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-base font-extrabold tracking-wide uppercase text-slate-200">
              STREETBLOOM <span className="text-amber-400 font-semibold lowercase text-xs">/ varjulinn</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {currentDistrict}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 font-medium flex items-center gap-1">
              <span>{worldTime?.phaseIcon || '☀️'}</span>
              <span>{worldTime?.phaseLabel || 'Päev'}</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                accuracyTier === 'HIGH'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                  : accuracyTier === 'MEDIUM'
                  ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                  : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
              }`}
            >
              GPS {accuracyTier === 'HIGH' ? 'Täpne' : accuracyTier === 'MEDIUM' ? 'Mõõdukas' : 'Ebakindel'}
            </span>
          </div>
        </div>

        {/* Companion Pip Status Widget */}
        <button
          onClick={() => {
            soundManager.playTap();
            setActiveScreen('companion');
          }}
          className="flex items-center gap-2 bg-[#1a1f26] border border-white/10 rounded-2xl px-3 py-1.5 hover:border-amber-400/40 transition shadow-md"
        >
          <span className="text-xl">🐾</span>
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{companion.name}</div>
            <div className="text-xs font-semibold text-emerald-400">{companion.happiness}% tuju</div>
          </div>
        </button>
      </div>

      {/* Traffic & Exploration Safety Warning */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="leading-snug">
          <strong>Ohutus ennekõike:</strong> Ära jälgi ekraani liikluses ja sõiduteed ületades. Ükski virtuaalne marker ei õigusta ohtlikku või keelatud alasse sisenemist.
        </span>
      </div>

      {/* Feedback Toast Notification */}
      {feedbackMsg && (
        <div className="mb-4 px-3.5 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Core First-10-Min simplified resource meters */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {/* Raha (Credits/Cash) */}
        <div className="bg-[#181d24] border border-white/10 rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Raha</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {profile.cash} <span className="text-xs font-normal text-slate-400">kr</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Varjulinna vahendid</div>
        </div>

        {/* Maine (Reputation) */}
        <div className="bg-[#181d24] border border-white/10 rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Maine</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {profile.reputation}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Usaldus tänavatel</div>
        </div>

        {/* Käiguvalmidus (Action Readiness / Turns) */}
        <div className="bg-[#181d24] border border-white/10 rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Käigud</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-baseline gap-1">
            {profile.actionTurns}
            <span className="text-xs text-slate-400 font-normal">/{profile.maxActionTurns}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">+1 200 sammuga</div>
        </div>
      </div>

      {/* Primary Goal / Aktiivne ülesanne — "Mida ma nüüd teen?" */}
      <div className="bg-[#181d24] border border-amber-500/40 rounded-3xl p-4 mb-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Järgmine eesmärk / Võimalus
          </span>
          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5">
            {activeSpawn ? activeSpawn.spawnId : 'Kesklinn'}
          </span>
        </div>

        {spawnNpc && activeSpawn ? (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-2xl shadow-md shrink-0">
                  {spawnNpc.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    {spawnNpc.name}
                    <span className="text-[10px] font-normal text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20">
                      {currentDistrict}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{spawnNpc.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Limiit: {activeSpawn.rewardCap - activeSpawn.timesInteracted}/{activeSpawn.rewardCap} käiku sellel tunnil
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundManager.playTap();
                  setSelectedNPCForChat(spawnNpc);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
              >
                Räägi
              </button>
            </div>

            {/* 3 Core Actions Preview */}
            <div className="grid grid-cols-3 gap-1.5 my-2.5 pt-2 border-t border-white/10 text-center">
              <div className="bg-[#12151a] p-2 rounded-xl border border-emerald-500/20">
                <div className="text-[10px] font-bold text-emerald-400">Väike töö</div>
                <div className="text-xs font-black text-white mt-0.5">+24 kr</div>
                <div className="text-[9px] text-slate-400">0 kulu • 100%</div>
              </div>

              <div className="bg-[#12151a] p-2 rounded-xl border border-amber-500/20">
                <div className="text-[10px] font-bold text-amber-400">Kauplemine</div>
                <div className="text-xs font-black text-white mt-0.5">+26 kr</div>
                <div className="text-[9px] text-slate-400">12 kr kulu • netotulu</div>
              </div>

              <div className="bg-[#12151a] p-2 rounded-xl border border-rose-500/20">
                <div className="text-[10px] font-bold text-rose-400">Riskantne ots</div>
                <div className="text-xs font-black text-white mt-0.5">+65 kr</div>
                <div className="text-[9px] text-slate-400">5 kr tagatis • 60%</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>{activeQuest ? `Põhilugu: ${activeQuest.title}` : 'Vali tegevus ja teeni vahendeid'}</span>
              <button
                onClick={onOpenRadar}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5"
              >
                Vaata radarilt <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : activeQuest ? (
          <div>
            <h3 className="text-base font-bold text-white mb-1">{activeQuest.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2">
              {activeQuest.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400">
                Tasu: <strong className="text-amber-400">+{activeQuest.rewards.xp} XP</strong>
                {activeQuest.rewards.relationshipPoints && (
                  <span className="text-purple-300 ml-1.5">+{activeQuest.rewards.relationshipPoints} maine</span>
                )}
              </span>
              <button
                onClick={onOpenMap}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-md shadow-amber-500/20"
              >
                Kõnni sihtkohta
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-2">
            Kõik põhilood täidetud. Ava kaart või radar uute piirkondlike kontaktide avastamiseks!
          </div>
        )}
      </div>

      {/* Main Action CTAs: Ava Kaart & Ava Radar */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => {
            soundManager.playTap();
            onOpenMap();
          }}
          className="group relative flex flex-col items-center justify-center p-4 rounded-3xl bg-gradient-to-b from-[#222b35] to-[#181d24] border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-xl hover:shadow-cyan-500/20 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
            <MapIcon className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition">Ava Kaart</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Visuaalne linnauurimine</span>
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            onOpenRadar();
          }}
          className="group relative flex flex-col items-center justify-center p-4 rounded-3xl bg-gradient-to-b from-[#222b35] to-[#181d24] border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-xl hover:shadow-emerald-500/20 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-2 group-hover:scale-110 transition-transform">
            <Radio className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition">Ava Radar</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Ligipääsetav nimekiri</span>
        </button>
      </div>

      {/* Linnaosa ühisprojekt & Võrgustik (Cooperative District Project) */}
      <div className="bg-[#181d24] border border-cyan-500/20 rounded-3xl p-4 mb-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              {currentDistrict} ühisprojekt
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-semibold">
            {playerNetwork.name} ({currentProject.contributorCount} liiget)
          </span>
        </div>

        <h4 className="text-sm font-bold text-white mb-1">{currentProject.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {currentProject.description}
        </p>

        {/* Progress Bars */}
        <div className="space-y-1.5 mb-3 bg-[#12151a] p-2.5 rounded-2xl border border-white/5 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Kogutud raha:</span>
            <strong className="text-amber-400 font-bold">
              {currentProject.currentCash} / {currentProject.targetCash} kr
            </strong>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((currentProject.currentCash / currentProject.targetCash) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-1">
            <span>Projektimaterjalid:</span>
            <strong className="text-cyan-400 font-bold">
              {currentProject.currentMaterials} / {currentProject.targetMaterials}
            </strong>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((currentProject.currentMaterials / currentProject.targetMaterials) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Hüve: <strong className="text-slate-200">{currentProject.perkDescription}</strong></span>
        </div>

        {/* Contribution Actions (Economic Sinks) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              soundManager.playTap();
              const res = contributeToProject(currentProject.id, 15, 1);
              showFeedback(res.message);
            }}
            disabled={profile.cash < 15 || currentProject.isUnlocked}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              profile.cash >= 15 && !currentProject.isUnlocked
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Anneta 15 kr
          </button>

          <button
            onClick={() => {
              const res = maintainGear();
              showFeedback(res.message);
            }}
            disabled={profile.cash < 15}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              profile.cash >= 15
                ? 'bg-[#222b35] hover:bg-[#2c3744] text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            Hoolda varustust (15 kr)
          </button>
        </div>
      </div>

      {/* Elavad tänava tegelased ja kohtumised (Living Street Encounters) */}
      {simulatedNPCs.filter((n) => n.visibilityTier !== 'HIDDEN').length > 0 && (
        <div className="bg-[#181d24] border border-indigo-500/30 rounded-3xl p-4 mb-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Elavad tänavakontaktid ({simulatedNPCs.filter((n) => n.visibilityTier !== 'HIDDEN').length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Reaalajas protseduurilised
            </span>
          </div>

          <div className="space-y-2.5">
            {simulatedNPCs
              .filter((n) => n.visibilityTier !== 'HIDDEN')
              .slice(0, 3)
              .map((simNpc) => {
                const distMeters =
                  simNpc.distanceToPlayerMeters !== undefined
                    ? Math.round(simNpc.distanceToPlayerMeters)
                    : Math.round(
                        haversineDistanceMeters(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          simNpc.currentLat,
                          simNpc.currentLon
                        )
                      );

                return (
                  <div
                    key={simNpc.id}
                    className="flex items-center justify-between bg-[#12151a] p-3 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-900 to-purple-900 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0 shadow-md">
                        {simNpc.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">{simNpc.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                            {simNpc.archetype}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {distMeters} m kaugusel • Seisund: {simNpc.state}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playTap();
                        setSelectedSimulatedNPC(simNpc);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30 shrink-0 ml-2"
                    >
                      Kohtu
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Lähim tegelane või kontakt piirkonnas */}
      <div className="bg-[#181d24] border border-white/10 rounded-3xl p-4 mb-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Lähim kontakt piirkonnas
          </span>
          <span className="text-xs font-bold text-emerald-400">
            {nearestNPC ? `${nearestNPC.distanceMeters} m kaugusel` : 'Tuvastamisel'}
          </span>
        </div>

        {nearestNPC ? (
          <div className="flex items-center justify-between bg-[#12151a] p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-2xl shadow-md">
                {nearestNPC.avatar}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{nearestNPC.name}</h4>
                <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{nearestNPC.title}</p>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                  Tänaval kättesaadav
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playTap();
                setSelectedNPCForChat(nearestNPC);
              }}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/30"
            >
              Räägi
            </button>
          </div>
        ) : null}
      </div>

      {/* Sammumehaanika ja käikude taastumine */}
      <div className="bg-[#181d24] border border-white/10 rounded-3xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {profile.estimatedSteps || 0} hinnangulist sammu
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Kõnni 200 sammu = +1 käik ({profile.todayStepsTurnsGranted || 0}/6 päevas)
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-amber-400">
            {profile.actionTurns < profile.maxActionTurns ? 'Käigud taastuvad' : 'Maksimumkäigud'}
          </div>
          <div className="text-[10px] text-slate-500">Aktiivne jalutuskäik</div>
        </div>
      </div>
    </div>
  );
};
