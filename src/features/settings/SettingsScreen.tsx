import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  Settings,
  Volume2,
  VolumeX,
  Shield,
  Trash2,
  Download,
  MapPin,
  Sparkles,
  Info,
  Globe,
} from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { localStore } from '../../services/storage/db';
import { soundManager } from '../../audio/soundManager';

interface SettingsScreenProps {
  onOpenDevPanel?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenDevPanel }) => {
  const { settings, updateSettings, setLanguage, updateLocation, setIsTracking } = useGameStore();
  const t = getTranslation(settings.language);

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    soundManager.setEnabled(next);
    if (next) soundManager.playTap();
  };

  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolukatsioon ei ole selles brauseris toetatud.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateSettings({ demoModeActive: false });
        setIsTracking(true);
        updateLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
          isSimulated: false,
        });
        soundManager.playLevelUp();
      },
      (err) => {
        alert('GPS viga: ' + err.message + '. Jätkame demorežiimis.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleClearData = () => {
    if (confirm(t.settings.deleteConfirm)) {
      localStore.clearAllData();
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const json = localStore.exportFullSaveJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streetbloom-save-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-y-auto pb-28 px-4 pt-16">
      <div className="max-w-md mx-auto w-full flex flex-col gap-5">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{t.settings.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kohanda oma mängukogemust, privaatsust ja salvestisi.
          </p>
        </div>

        {/* PWA Install Card */}
        <div className="p-4 rounded-3xl game-glass-panel border-orange-500/30 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-300">
              {t.settings.pwaInstall}
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Mängi täisekraanil nagu päris mobiiliäpp! Töötab ka ilma internetita.
          </p>
          <PWAInstallButton />
        </div>

        {/* Language Selection */}
        <div className="p-4 rounded-3xl game-glass-panel border-white/5 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            {t.settings.language}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('et')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                settings.language === 'et'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🇪🇪 Eesti keel
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                settings.language === 'en'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* GPS & Location Settings */}
        <div className="p-4 rounded-3xl game-glass-panel border-white/5 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            {t.settings.gps}
          </h3>

          <button
            onClick={handleRequestGPS}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition text-left"
          >
            <div>
              <p className="text-xs font-bold text-white">{t.settings.requestLocation}</p>
              <p className="text-[10px] text-slate-400">Kasuta reaalset telefoni GPS-i</p>
            </div>
            <span className="text-xs font-bold text-orange-400">Aktiveeri</span>
          </button>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
            <div>
              <p className="text-xs font-bold text-white">Demorežiim (Tallinn)</p>
              <p className="text-[10px] text-slate-400">Simuleerib Tallinna avastamist</p>
            </div>
            <button
              onClick={() => updateSettings({ demoModeActive: !settings.demoModeActive })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.demoModeActive ? 'bg-orange-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.demoModeActive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
            <div>
              <p className="text-xs font-bold text-white">{t.settings.privacyRadius}</p>
              <p className="text-[10px] text-slate-400">Ei edasta tehisarule täpset asukohta</p>
            </div>
            <button
              onClick={() =>
                updateSettings({ privacyRadiusActive: !settings.privacyRadiusActive })
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.privacyRadiusActive ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.privacyRadiusActive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Audio & Visuals */}
        <div className="p-4 rounded-3xl game-glass-panel border-white/5 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Helid & Ligipääsetavus
          </h3>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <p className="text-xs font-bold text-white">{t.settings.sound}</p>
                <p className="text-[10px] text-slate-400">Sünteseeritud heliefektid & haptika</p>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data & Backup */}
        <div className="p-4 rounded-3xl game-glass-panel border-white/5 flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Salvestised & Andmed
          </h3>

          <button
            onClick={handleExportData}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-white">{t.settings.exportData}</p>
                <p className="text-[10px] text-slate-400">Laadi alla varukoopia JSON failina</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400">Ekspordi</span>
          </button>

          <button
            onClick={handleClearData}
            className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <div>
                <p className="text-xs font-bold text-rose-200">{t.settings.deleteData}</p>
                <p className="text-[10px] text-rose-300/70">Lähtesta kõik kohalikud andmed</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-400">Kustuta</span>
          </button>
        </div>

        {/* Developer Debug Panel Link */}
        {onOpenDevPanel && (
          <button
            onClick={onOpenDevPanel}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-bold text-amber-300 border border-amber-400/20"
          >
            🛠️ Ava Arendaja Tööriistad (Debug Mode)
          </button>
        )}
      </div>
    </div>
  );
};
