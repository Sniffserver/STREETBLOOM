import React, { useState } from 'react';
import { Shield, Trash2, Download, Check, ArrowLeft } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface PrivacySettingsModalProps {
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ onClose }) => {
  const [locationHistoryEnabled, setLocationHistoryEnabled] = useState(true);
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const handleExportData = () => {
    soundManager.playTap();
    const data = {
      exportedAt: new Date().toISOString(),
      locationHistoryStatus: locationHistoryEnabled ? 'ENABLED' : 'DISABLED',
      aiMemoryStatus: aiMemoryEnabled ? 'ENABLED' : 'DISABLED',
      app: 'Streetbloom Tallinn',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streetbloom_privacy_export_${Date.now()}.json`;
    a.click();

    setNotice('Konto andmed edukalt eksporditud!');
  };

  const handleDeleteHistory = () => {
    soundManager.playTap();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sb_street_memories');
      localStorage.removeItem('sb_offline_pending_queue');
    }
    setNotice('Täpne asukoha- ja mäluaegruum kustaatud!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl game-glass-panel border border-cyan-500/30 p-5 flex flex-col gap-4 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playTap();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Privaatsus & Andmekaitse
            </h2>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {notice && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Location History Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">Asukoha Ajalugu</h3>
              <p className="text-[11px] text-slate-400">Salvesta tänavate läbimisloogika lokaalselt</p>
            </div>
            <button
              onClick={() => {
                soundManager.playTap();
                setLocationHistoryEnabled(!locationHistoryEnabled);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                locationHistoryEnabled
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-white/10'
              }`}
            >
              {locationHistoryEnabled ? 'SEES' : 'VÄLJAS'}
            </button>
          </div>

          {/* AI Memory Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">AI Tegelaste Mälu</h3>
              <p className="text-[11px] text-slate-400">Luba tegelastel mäletada eelmisi vestlusi</p>
            </div>
            <button
              onClick={() => {
                soundManager.playTap();
                setAiMemoryEnabled(!aiMemoryEnabled);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                aiMemoryEnabled
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-white/10'
              }`}
            >
              {aiMemoryEnabled ? 'SEES' : 'VÄLJAS'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleExportData}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Eskpordi konto andmed (JSON)
            </button>

            <button
              onClick={handleDeleteHistory}
              className="p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Kustuta täpne asukohaajalugu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
