import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { NPC, Place, Quest, SimulatedNPCInstance } from '../../types/game';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';
import {
  Radio,
  MessageSquare,
  MapPin,
  ScrollText,
  AlertTriangle,
  ChevronRight,
  Filter,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface RadarItem {
  id: string;
  type: 'npc' | 'place' | 'quest' | 'simulated_npc';
  title: string;
  subtitle: string;
  distanceMeters: number;
  district: string;
  badge?: string;
  spawnId?: string;
  availability?: string;
  isActiveSpawn?: boolean;
  isSimulated?: boolean;
  simulatedNpc?: SimulatedNPCInstance;
  raw: NPC | Place | Quest | SimulatedNPCInstance;
}

export const RadarListScreen: React.FC = () => {
  const {
    currentLocation,
    npcs,
    simulatedNPCs,
    places,
    quests,
    currentDistrict,
    activeSpawn,
    accuracyTier,
    setSelectedNPCForChat,
    setSelectedSimulatedNPC,
    reportSafetyIssue,
  } = useGameStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'npc' | 'place' | 'quest'>('all');
  const [safetyReportSent, setSafetyReportSent] = useState(false);

  // Compile items with distance
  const items: RadarItem[] = [];

  // 1. Static NPCs (including active spawn encounter metadata)
  npcs.forEach((npc) => {
    const dist = Math.round(
      haversineDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        npc.latitude,
        npc.longitude
      )
    );
    const isActive = activeSpawn?.npcId === npc.id;
    const availability = isActive
      ? `${activeSpawn.rewardCap - activeSpawn.timesInteracted}/${activeSpawn.rewardCap} käiku saadaval`
      : undefined;

    items.push({
      id: npc.id,
      type: 'npc',
      title: npc.name,
      subtitle: npc.title,
      distanceMeters: dist,
      district: npc.district,
      badge: npc.avatar,
      spawnId: isActive ? activeSpawn.spawnId : undefined,
      availability,
      isActiveSpawn: isActive,
      raw: npc,
    });
  });

  // 1b. Living Simulated NPCs from Encounter Director
  simulatedNPCs.forEach((sim) => {
    if (sim.state === 'DESPAWNED' || sim.visibilityTier === 'HIDDEN') return;
    items.push({
      id: sim.id,
      type: 'simulated_npc',
      title: sim.name,
      subtitle: `${sim.title} • ${sim.state === 'INTERACTABLE' ? 'Valmis suhtlema' : 'Uurib ümbrust'}`,
      distanceMeters: sim.distanceToPlayerMeters,
      district: sim.district,
      badge: sim.avatar,
      isSimulated: true,
      simulatedNpc: sim,
      raw: sim,
    });
  });

  // 2. Places
  places.forEach((place) => {
    const dist = Math.round(
      haversineDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        place.latitude,
        place.longitude
      )
    );
    items.push({
      id: place.id,
      type: 'place',
      title: place.name,
      subtitle: place.description,
      distanceMeters: dist,
      district: place.district,
      badge: place.discovered ? '📍' : '❓',
      raw: place,
    });
  });

  // 3. Quests with target places
  quests.forEach((q) => {
    if (q.status !== 'completed') {
      items.push({
        id: q.id,
        type: 'quest',
        title: q.title,
        subtitle: q.description,
        distanceMeters: 120, // estimated vicinity
        district: q.district || currentDistrict,
        badge: '📜',
        raw: q,
      });
    }
  });

  // Sort by distance
  items.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const handleItemClick = (item: RadarItem) => {
    soundManager.playTap();
    if (item.type === 'simulated_npc' && item.simulatedNpc) {
      setSelectedSimulatedNPC(item.simulatedNpc);
    } else if (item.type === 'npc') {
      setSelectedNPCForChat(item.raw as NPC);
    }
  };

  const handleSafetyReport = () => {
    reportSafetyIssue('Kasutaja teatas radarivaatest ohutusprobleemist');
    setSafetyReportSent(true);
    setTimeout(() => setSafetyReportSent(false), 3000);
  };

  return (
    <div className="relative w-full h-full overflow-y-auto pb-24 px-4 pt-4 text-slate-100 bg-[#12151a]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h1 className="text-base font-extrabold tracking-wide uppercase text-slate-200">
              Radar / Lähikond
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ligipääsetav nimekiri: järjestatud kauguse järgi ({currentDistrict})
          </p>
        </div>

        {/* GPS Tier Indicator */}
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            accuracyTier === 'HIGH'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : accuracyTier === 'MEDIUM'
              ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
          }`}
        >
          {accuracyTier === 'HIGH' ? 'Täpne GPS' : accuracyTier === 'MEDIUM' ? 'Mõõdukas GPS' : 'Ebakindel GPS'}
        </span>
      </div>

      {/* Accuracy advisory if degraded */}
      {accuracyTier !== 'HIGH' && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            GPS täpsus on hetkel madalam. Saad tegevusi avada ka siit nimekirjast ilma täpset asukohta nõudmata.
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Kõik' },
          { id: 'npc', label: 'Kontaktid' },
          { id: 'place', label: 'Paigad' },
          { id: 'quest', label: 'Ülesanded' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playTap();
              setActiveFilter(tab.id as any);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[#181d24] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Distance-sorted list */}
      <div className="flex flex-col gap-2.5 mb-6">
        {filteredItems.map((item) => {
          const isNearby = item.distanceMeters <= 80;

          return (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isNearby
                  ? 'bg-[#181d24] border-emerald-500/40 hover:border-emerald-400 shadow-md'
                  : 'bg-[#15191f] border-white/5 hover:border-white/10 opacity-90'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                    item.type === 'npc'
                      ? 'bg-purple-950/80 border border-purple-500/30 text-purple-300'
                      : item.type === 'place'
                      ? 'bg-cyan-950/80 border border-cyan-500/30 text-cyan-300'
                      : 'bg-amber-950/80 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  {item.badge}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                    {item.isActiveSpawn && (
                      <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold px-1.5 py-0.5 rounded">
                        Aktiivne võimalus
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 uppercase font-semibold px-1.5 py-0.5 rounded bg-white/5">
                      {item.district}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                  {item.spawnId && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-slate-400">{item.spawnId}</span>
                      {item.availability && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          • {item.availability}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div
                    className={`text-xs font-extrabold ${
                      isNearby ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {item.distanceMeters} m
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {isNearby ? 'Suhtlusalas' : 'Kaugemal'}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            Selle filtriga objekte läheduses ei leitud.
          </div>
        )}
      </div>

      {/* Safety & Accessibility feedback footer button */}
      <div className="pt-2 border-t border-white/10 flex flex-col items-center">
        <button
          onClick={handleSafetyReport}
          className="text-xs text-amber-400/80 hover:text-amber-300 flex items-center gap-1.5 py-1 transition"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {safetyReportSent ? 'Aitäh! Teade salvestatud.' : 'See koht pole ohutu / ligipääsetav? Anna teada'}
        </button>
      </div>
    </div>
  );
};
