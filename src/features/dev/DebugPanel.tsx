import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { TALLINN_CENTER } from '../../data/tallinnSeed';
import { Zap, MapPin, Footprints, Shield, Sparkles, Terminal } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface DebugPanelProps {
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const {
    currentLocation,
    teleportTo,
    streets,
    companion,
    profile,
    updateLocation,
    feedCompanion,
    petCompanion,
    startQuest,
    quests,
    settings,
  } = useGameStore();

  const handleTeleport = (name: string, lat: number, lon: number) => {
    soundManager.playTap();
    teleportTo(lat, lon);
  };

  const handleInstantDiscoverNextStreet = () => {
    const nextUndiscovered = streets.find((s) => !s.discovered);
    if (nextUndiscovered && nextUndiscovered.coordinates[0]) {
      const lon = nextUndiscovered.coordinates[0][0];
      const lat = nextUndiscovered.coordinates[0][1];
      teleportTo(lat, lon);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-slate-900 border border-amber-500/40 p-4 flex flex-col gap-4 overflow-y-auto text-xs text-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300">StreetBloom Developer Console</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Live GPS Diagnostics */}
        <div className="p-3 rounded-2xl bg-black/50 border border-white/5 font-mono text-[11px] flex flex-col gap-1 text-slate-300">
          <p className="text-amber-400 font-bold">GPS OLEK:</p>
          <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
          <p>Lon: {currentLocation.longitude.toFixed(6)}</p>
          <p>Täpsus: {currentLocation.accuracy}m | Kiirus: {currentLocation.speed ?? 0} m/s</p>
          <p>Simuleeritud: {currentLocation.isSimulated ? 'JAH' : 'EI (Päris GPS)'}</p>
        </div>

        {/* Quick Teleport Points in Tallinn */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            Teleporteeru Kvartalisse (Tallinn):
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTeleport('Old Town', 59.4373, 24.7451)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left font-bold text-cyan-300"
            >
              🏰 Raekoja plats (Old Town)
            </button>
            <button
              onClick={() => handleTeleport('Telliskivi', 59.4398, 24.7295)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left font-bold text-purple-300"
            >
              🎨 Telliskivi loomelinnak
            </button>
            <button
              onClick={() => handleTeleport('Kalamaja', 59.4435, 24.7360)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left font-bold text-orange-300"
            >
              ☕ Marta kohvik (Kalamaja)
            </button>
            <button
              onClick={() => handleTeleport('Kadriorg', 59.4380, 24.7865)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left font-bold text-emerald-300"
            >
              🌿 Kadrioru lossipark
            </button>
          </div>
        </div>

        {/* Instant Game State Triggers */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            Mängumootori Kiirkäsud:
          </h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleInstantDiscoverNextStreet}
              className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-center"
            >
              🧭 Teleporteeru järgmisele avastamata tänavale (+XP)
            </button>

            <button
              onClick={() => {
                feedCompanion();
                petCompanion();
              }}
              className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-white text-center"
            >
              🐾 Täida kaaslase kõht ja tõsta tuju 100%-ni
            </button>

            <button
              onClick={() => {
                const avail = quests.find((q) => q.status === 'available');
                if (avail) startQuest(avail.id);
              }}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-center"
            >
              📜 Aktiveeri järgmine saadaolev ülesanne
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
