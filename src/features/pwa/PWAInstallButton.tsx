import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition"
      >
        <Download className="w-4 h-4" />
        Paigalda StreetBloom äpina (PWA)
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 active:scale-95 transition"
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
          Paigalda iPhone'ile (Safari)
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl game-glass-panel border border-white/10 p-6 flex flex-col gap-3">
              <h3 className="text-base font-bold text-white">Paigalda iPhone'ile</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Puuduta Safari allservas <strong>Jaga (Share)</strong> ikooni.<br />
                2. Keri allapoole ja vali <strong>Lisa avaekraanile (Add to Home Screen)</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-2 w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition"
              >
                Selge!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
