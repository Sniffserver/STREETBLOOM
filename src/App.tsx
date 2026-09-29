import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { gameEngine } from './game/engine/gameEngine';
import { ExplorationMap } from './features/map/ExplorationMap';
import { CompassHeader } from './features/map/CompassHeader';
import { BottomNav } from './components/ui/BottomNav';
import { CompanionScreen } from './features/companion/CompanionScreen';
import { NPCListScreen } from './features/npc/NPCListScreen';
import { NPCChatModal } from './features/npc/NPCChatModal';
import { QuestsScreen } from './features/quests/QuestsScreen';
import { CollectionScreen } from './features/collection/CollectionScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { DebugPanel } from './features/dev/DebugPanel';
import { CelebrationModal } from './components/ui/CelebrationModal';
import { StreetDetailsModal } from './features/map/StreetDetailsModal';
import { OnboardingModal } from './features/onboarding/OnboardingModal';
import { OfflineIndicator } from './features/pwa/OfflineIndicator';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { RadarListScreen } from './features/radar/RadarListScreen';

export default function App() {
  const {
    activeScreen,
    setActiveScreen,
    currentLocation,
    selectedNPCForChat,
    setSelectedNPCForChat,
    selectedStreetForModal,
    setSelectedStreetForModal,
    settings,
    updateSettings,
    initializeGame,
    updateLocation,
    setIsTracking,
    gpsError,
    setGpsError,
  } = useGameStore();

  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize engine on first mount
  useEffect(() => {
    const init = async () => {
      await initializeGame();
      setIsReady(true);

      // Check onboarding
      const done = localStorage.getItem('sb_onboarding_done');
      if (!done) {
        setOnboardingOpen(true);
      }

      // Check debug parameter
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') {
        setDevPanelOpen(true);
      }
    };
    init();
  }, []);

  // Geolocation watchPosition listener (when not in pure demo mode)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (settings.demoModeActive) return;

    let watchId: number | null = null;

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setIsTracking(true);
          setGpsError(null);
          updateLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
            isSimulated: false,
          });
        },
        (err) => {
          setGpsError(err.message);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 4000,
          timeout: 10000,
        }
      );
    } catch {
      // Ignore if blocked
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [settings.demoModeActive]);

  if (!isReady) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0a0d14] text-white">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-orange-500 to-purple-600 flex items-center justify-center text-3xl animate-bounce shadow-xl shadow-orange-500/30">
          🧭
        </div>
        <p className="text-xs font-bold text-slate-400 mt-4 tracking-wider uppercase">
          StreetBloom äratab linna...
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0d14] select-none text-slate-100 flex justify-center">
      {/* Mobile container constraint for desktop, full-width on mobile */}
      <div className="relative w-full max-w-lg h-full flex flex-col bg-[#0a0d14] overflow-hidden shadow-2xl">
        {/* Offline Connectivity Banner */}
        <OfflineIndicator />

        {/* GPS Error & Recovery Banner */}
        {gpsError && !settings.demoModeActive && (
          <div className="absolute top-16 left-3 right-3 z-40 p-3 rounded-2xl bg-amber-950/90 border border-amber-500/40 backdrop-blur-md shadow-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">📍</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-200 truncate">Asukoht pole kättesaadav (Location unavailable)</p>
                <p className="text-[10px] text-amber-300/80 truncate">{gpsError}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setGpsError(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition"
              >
                Proovi uuesti (Retry)
              </button>
              <button
                onClick={() => {
                  updateSettings({ demoModeActive: true });
                  setGpsError(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-[11px] font-bold text-black transition"
              >
                Kasuta demo (Demo mode)
              </button>
            </div>
          </div>
        )}

        {/* Screen Routing */}
        <main className="relative flex-1 w-full h-full overflow-hidden">
          {(activeScreen === 'dashboard' || !activeScreen) && (
            <DashboardScreen
              onOpenMap={() => setActiveScreen('explore')}
              onOpenRadar={() => setActiveScreen('radar')}
              onOpenQuest={() => setActiveScreen('quests')}
            />
          )}

          {activeScreen === 'radar' && <RadarListScreen />}

          {activeScreen === 'explore' && (
            <>
              <CompassHeader />
              <ExplorationMap
                onSelectNPC={(npc) => setSelectedNPCForChat(npc)}
                onSelectStreet={(street) => setSelectedStreetForModal(street)}
              />
            </>
          )}

          {activeScreen === 'companion' && <CompanionScreen />}

          {activeScreen === 'npcs' && (
            <NPCListScreen onOpenChat={(npc) => setSelectedNPCForChat(npc)} />
          )}

          {activeScreen === 'quests' && <QuestsScreen />}

          {activeScreen === 'collection' && <CollectionScreen />}

          {activeScreen === 'profile' && <ProfileScreen />}

          {activeScreen === 'settings' && (
            <SettingsScreen onOpenDevPanel={() => setDevPanelOpen(true)} />
          )}
        </main>

        {/* Global Bottom Navigation */}
        <BottomNav />

        {/* NPC Conversation Chat Modal */}
        {selectedNPCForChat && (
          <NPCChatModal
            npc={selectedNPCForChat}
            onClose={() => setSelectedNPCForChat(null)}
          />
        )}

        {/* Street Inspection Modal */}
        {selectedStreetForModal && (
          <StreetDetailsModal
            street={selectedStreetForModal}
            onClose={() => setSelectedStreetForModal(null)}
          />
        )}

        {/* Celebration / Confetti Modal */}
        <CelebrationModal />

        {/* Developer Debug Console */}
        {devPanelOpen && <DebugPanel onClose={() => setDevPanelOpen(false)} />}

        {/* First-time Onboarding Modal */}
        {onboardingOpen && <OnboardingModal onComplete={() => setOnboardingOpen(false)} />}
      </div>
    </div>
  );
}
