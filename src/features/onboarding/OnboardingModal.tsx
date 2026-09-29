import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Compass, Sparkles, MapPin, Heart, Footprints } from 'lucide-react';
import { CompanionAvatar } from '../companion/CompanionAvatar';
import { soundManager } from '../../audio/soundManager';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { companion, updateLocation, setIsTracking, updateSettings } = useGameStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companionName, setCompanionName] = useState(companion.name || 'Pip');
  const [personalityChoice, setPersonalityChoice] = useState<'curious' | 'brave' | 'silly'>('curious');

  const handleStartExploring = () => {
    soundManager.playTap();
    setStep(2);
  };

  const handleAllowGPS = () => {
    soundManager.playTap();
    if (navigator.geolocation) {
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
          setStep(3);
        },
        () => {
          // If denied, continue in Demo Mode in Tallinn
          updateSettings({ demoModeActive: true });
          setStep(3);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      updateSettings({ demoModeActive: true });
      setStep(3);
    }
  };

  const handleSkipGPS = () => {
    soundManager.playTap();
    updateSettings({ demoModeActive: true });
    setStep(3);
  };

  const handleFinish = () => {
    soundManager.playLevelUp();
    companion.name = companionName;
    if (personalityChoice === 'brave') {
      companion.personality.bravery = 0.95;
    } else if (personalityChoice === 'silly') {
      companion.personality.silliness = 0.95;
    } else {
      companion.personality.curiosity = 0.95;
    }

    localStorage.setItem('sb_onboarding_done', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl game-glass-panel border-2 border-orange-500/40 p-6 flex flex-col items-center text-center gap-5 shadow-2xl">
        {step === 1 && (
          <>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-orange-500/30 animate-pulse">
              🧭
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                StreetBloom
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Sinu linn peidab saladusi.
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Päris tänavad muutuvad sinu mängulauaks. Iga füüsiline samm hajutab udu ja toob esile
                salajased nurgad, aarded ja elanikud.
              </p>
            </div>
            <button
              onClick={handleStartExploring}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition"
            >
              ALUSTA AVASTAMIST
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-3xl border border-cyan-400/30">
              <MapPin className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Luba asukohale juurdepääs</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Et mäng saaks kaardistada tänavad, mida sa päriselt läbid, vajame GPS luba.
                Sinu andmeid ei edastata kolmandatele osapooltele.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleAllowGPS}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition"
              >
                LUBA GPS LIGIPÄÄS
              </button>
              <button
                onClick={handleSkipGPS}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold transition"
              >
                Mängi demorežiimis (Tallinn)
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <CompanionAvatar companion={companion} size={110} interactive={false} />
            <div>
              <h2 className="text-xl font-extrabold text-white">Sinu salapärane kaaslane</h2>
              <p className="text-xs text-slate-300 mt-1">
                Väike olend, kes kõnnib sinu kõrval ja õpib igast sammust.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Kaaslase nimi:
                </label>
                <input
                  type="text"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Iseloom:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setPersonalityChoice('curious')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${
                      personalityChoice === 'curious'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Uudishimulik
                  </button>
                  <button
                    onClick={() => setPersonalityChoice('brave')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${
                      personalityChoice === 'brave'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Julge
                  </button>
                  <button
                    onClick={() => setPersonalityChoice('silly')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${
                      personalityChoice === 'silly'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Mänguhimuline
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition"
            >
              ASTU LINNA TÄNAVATELE!
            </button>
          </>
        )}
      </div>
    </div>
  );
};
