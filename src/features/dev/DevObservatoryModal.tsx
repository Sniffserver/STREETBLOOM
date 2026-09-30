import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Terminal, Compass, Zap, Footprints, Shield, Eye, Activity } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';
import { WalkSimulator, SyntheticWalkResult } from '../../services/dev/WalkSimulator';

interface DevObservatoryModalProps {
  onClose: () => void;
}

export const DevObservatoryModal: React.FC<DevObservatoryModalProps> = ({ onClose }) => {
  const { currentLocation, streets, simulatedNPCs, updateLocation } = useGameStore();
  const [walkResult, setWalkResult] = useState<SyntheticWalkResult | null>(null);

  const handleRunSim = (distance: number) => {
    soundManager.playTap();
    const res = WalkSimulator.simulateWalk(currentLocation, distance, (loc) => {
      updateLocation(loc);
    });
    setWalkResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-slate-900 border border-cyan-500/40 p-5 flex flex-col gap-4 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-cyan-300">Developer Observatory & Walk Sim</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Live Metrics */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 font-mono text-xs flex flex-col gap-1 text-slate-300">
          <p className="text-cyan-400 font-bold">AKTIIVSED METRUKUD:</p>
          <p>Asukoht: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}</p>
          <p>Kiirus: {currentLocation.speed ?? 1.4} m/s | Täpsus: {currentLocation.accuracy}m</p>
          <p>Märgatud tänavad: {streets.filter((s) => s.discovered).length} / {streets.length}</p>
          <p>Aktiivsed tegelased: {simulatedNPCs.length} tk</p>
        </div>

        {/* Synthetic Walk Simulator */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sünteetiline Kõnnisimulaator (Walk Simulator):
          </h3>
          <div className="grid grid-cols-4 gap-2 font-bold text-xs">
            <button onClick={() => handleRunSim(100)} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300">100m</button>
            <button onClick={() => handleRunSim(500)} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300">500m</button>
            <button onClick={() => handleRunSim(1000)} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300">1 km</button>
            <button onClick={() => handleRunSim(5000)} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300">5 km</button>
          </div>
        </div>

        {walkResult && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex flex-col gap-1">
            <p className="font-bold">SIMULATSIOONI TULEMUS:</p>
            <p>Läbitud: {walkResult.simulatedMeters}m ({walkResult.stepsCount} sammu)</p>
            <p>Avastatud tänavad: +{walkResult.streetsDiscovered}</p>
            <p>Kohtumised: {walkResult.encountersTriggered} | Haruldased: {walkResult.rareEventsTriggered}</p>
          </div>
        )}
      </div>
    </div>
  );
};
