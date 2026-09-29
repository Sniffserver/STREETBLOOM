import { create } from 'zustand';
import {
  GeoLocation,
  PlayerProfile,
  Companion,
  StreetSegment,
  Place,
  NPC,
  Quest,
  InventoryItem,
  Achievement,
  ProceduralEncounter,
  DistrictName,
  NPCSpawnEvent,
  AccuracyTier,
  InteractionCommand,
  InteractionExecutionResult,
  DistrictProject,
  PlayerNetwork,
} from '../types/game';
import { gameEngine } from '../game/engine/gameEngine';
import { localStore, GameSettings } from '../services/storage/db';
import { TALLINN_CENTER } from '../data/tallinnSeed';
import { Language } from '../locales/i18n';
import { gpsSmoother } from '../services/geo/geoUtils';

export type ActiveScreen =
  | 'dashboard'
  | 'explore'
  | 'radar'
  | 'companion'
  | 'npcs'
  | 'quests'
  | 'collection'
  | 'character'
  | 'profile'
  | 'settings';

interface GameState {
  // Navigation & UI State
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  selectedNPCForChat: NPC | null;
  setSelectedNPCForChat: (npc: NPC | null) => void;
  selectedStreetForModal: StreetSegment | null;
  setSelectedStreetForModal: (street: StreetSegment | null) => void;
  celebrationData: {
    type: 'street' | 'place' | 'level' | 'evolution';
    title: string;
    subtitle: string;
    xp: number;
    itemReward?: string;
  } | null;
  setCelebrationData: (data: GameState['celebrationData']) => void;

  // Settings
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  setLanguage: (lang: Language) => void;

  // GPS & Map State
  currentLocation: GeoLocation;
  currentDistrict: DistrictName;
  activeSpawn: NPCSpawnEvent | null;
  accuracyTier: AccuracyTier;
  isTracking: boolean;
  gpsError: string | null;
  isSimulatingWalk: boolean;
  isInitializing: boolean;
  isInitialized: boolean;
  initializationError: string | null;
  initializeGame: () => Promise<void>;
  updateLocation: (loc: GeoLocation) => void;
  setGpsError: (err: string | null) => void;
  setIsTracking: (tracking: boolean) => void;
  toggleSimulatedWalk: () => void;
  teleportTo: (lat: number, lon: number) => void;
  reportSafetyIssue: (note?: string) => void;

  // Controlled Command Flow
  executeInteraction: (command: InteractionCommand) => Promise<InteractionExecutionResult>;

  // Game Entities
  profile: PlayerProfile;
  companion: Companion;
  streets: StreetSegment[];
  places: Place[];
  npcs: NPC[];
  quests: Quest[];
  inventory: InventoryItem[];
  achievements: Achievement[];
  activeEncounters: ProceduralEncounter[];
  districtProjects: DistrictProject[];
  playerNetwork: PlayerNetwork;

  // District Projects & Sinks
  contributeToProject: (projectId: string, cashAmount: number, materialsCount?: number) => { success: boolean; message: string; project?: DistrictProject };
  maintainGear: () => { success: boolean; message: string };

  // Companion Actions
  feedCompanion: (inventoryItemId?: string) => { success: boolean; message: string };
  petCompanion: () => void;
  talkCompanion: () => string;
  playCompanion: () => void;
  restCompanion: () => void;

  // Quest Actions
  startQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;

  // NPC Actions
  recordNPCInteraction: (npcId: string, relChange: number, memoryText?: string, extractedFacts?: string[]) => void;

  // Engine Sync
  syncWithEngine: () => void;
}

const bufferedLocations: GeoLocation[] = [];

export const useGameStore = create<GameState>((set, get) => {
  const initialSettings = localStore.getSettings();

  const initialLoc: GeoLocation = {
    latitude: TALLINN_CENTER.latitude,
    longitude: TALLINN_CENTER.longitude,
    accuracy: 10,
    speed: null,
    heading: 0,
    timestamp: Date.now(),
    isSimulated: initialSettings.demoModeActive,
  };

  return {
    activeScreen: 'dashboard',
    setActiveScreen: (screen) => set({ activeScreen: screen }),
    selectedNPCForChat: null,
    setSelectedNPCForChat: (npc) => set({ selectedNPCForChat: npc }),
    selectedStreetForModal: null,
    setSelectedStreetForModal: (street) => set({ selectedStreetForModal: street }),
    celebrationData: null,
    setCelebrationData: (data) => set({ celebrationData: data }),

    settings: initialSettings,
    updateSettings: (partial) => {
      const updated = { ...get().settings, ...partial };
      localStore.saveSettings(updated);
      set({ settings: updated });
    },
    setLanguage: (lang) => {
      get().updateSettings({ language: lang });
    },

    currentLocation: initialLoc,
    currentDistrict: 'Kesklinn',
    activeSpawn: null,
    accuracyTier: 'HIGH',
    isTracking: false,
    gpsError: null,
    isSimulatingWalk: false,
    isInitializing: false,
    isInitialized: false,
    initializationError: null,

    initializeGame: async () => {
      set({ isInitializing: true, initializationError: null });
      try {
        await gameEngine.initialize(get().currentLocation);
        set({ isInitialized: true, isInitializing: false });
        get().syncWithEngine();

        // Process any buffered locations arriving before initialization
        if (bufferedLocations.length > 0) {
          const pending = [...bufferedLocations];
          bufferedLocations.length = 0;
          for (const loc of pending) {
            get().updateLocation(loc);
          }
        }
      } catch (err: unknown) {
        console.error('Game initialization failed:', err);
        set({
          isInitializing: false,
          initializationError: err instanceof Error ? err.message : 'Game initialization failed',
        });
      }
    },

    updateLocation: (loc) => {
      // Buffer location fixes if game engine is still initializing to prevent race conditions
      if (!get().isInitialized) {
        bufferedLocations.push(loc);
        set({ currentLocation: loc });
        return;
      }

      // Apply GPS smoothing & noise reduction for real-world walks
      const effectiveLoc = loc.isSimulated || loc.isTeleport ? loc : gpsSmoother.smooth(loc);
      const outcome = gameEngine.processLocationUpdate(effectiveLoc);

      set({
        currentLocation: effectiveLoc,
        profile: { ...gameEngine.getProfile() },
        companion: { ...gameEngine.getCompanion() },
        streets: [...gameEngine.getStreets()],
        places: [...gameEngine.getPlaces()],
        npcs: [...gameEngine.getNPCs()],
        inventory: [...gameEngine.getInventory()],
        achievements: [...gameEngine.getAchievements()],
        quests: [...gameEngine.getQuests()],
      });

      if (outcome.newStreet) {
        set({
          celebrationData: {
            type: 'street',
            title: outcome.newStreet.name,
            subtitle: `Tänav kaardistatud (${outcome.newStreet.discoveryPercent}%)!`,
            xp: outcome.newStreet.explorationXP,
            itemReward: outcome.foundItem ? outcome.foundItem.name : undefined,
          },
        });
      } else if (outcome.newPlace) {
        set({
          celebrationData: {
            type: 'place',
            title: outcome.newPlace.name,
            subtitle: `Salapaik leitud: ${outcome.newPlace.description}`,
            xp: 60,
          },
        });
      }
    },

    setGpsError: (err) => set({ gpsError: err }),
    setIsTracking: (tracking) => set({ isTracking: tracking }),
    toggleSimulatedWalk: () => set((s) => ({ isSimulatingWalk: !s.isSimulatingWalk })),

    teleportTo: (lat, lon) => {
      gpsSmoother.reset(lat, lon);
      const loc: GeoLocation = {
        latitude: lat,
        longitude: lon,
        accuracy: 5,
        speed: 1.4,
        heading: 90,
        timestamp: Date.now(),
        isSimulated: true,
        isTeleport: true,
      };
      get().updateLocation(loc);
    },

    profile: gameEngine.getProfile(),
    companion: gameEngine.getCompanion(),
    streets: gameEngine.getStreets(),
    places: gameEngine.getPlaces(),
    npcs: gameEngine.getNPCs(),
    quests: gameEngine.getQuests(),
    inventory: gameEngine.getInventory(),
    achievements: gameEngine.getAchievements(),
    activeEncounters: gameEngine.getActiveEncounters(),
    districtProjects: gameEngine.getDistrictProjects(),
    playerNetwork: gameEngine.getPlayerNetwork(),

    contributeToProject: (projectId, cashAmount, materialsCount) => {
      const res = gameEngine.contributeToProject(projectId, cashAmount, materialsCount);
      get().syncWithEngine();
      return res;
    },
    maintainGear: () => {
      const res = gameEngine.maintainGear();
      get().syncWithEngine();
      return res;
    },

    feedCompanion: (itemId) => {
      const res = gameEngine.feedCompanion(itemId);
      get().syncWithEngine();
      return res;
    },
    petCompanion: () => {
      gameEngine.petCompanion();
      get().syncWithEngine();
    },
    talkCompanion: () => {
      const t = gameEngine.talkCompanion();
      get().syncWithEngine();
      return t;
    },
    playCompanion: () => {
      gameEngine.playCompanion();
      get().syncWithEngine();
    },
    restCompanion: () => {
      gameEngine.restCompanion();
      get().syncWithEngine();
    },

    startQuest: (questId) => {
      gameEngine.startQuest(questId);
      get().syncWithEngine();
    },
    completeQuest: (questId) => {
      gameEngine.completeQuest(questId);
      get().syncWithEngine();
    },

    recordNPCInteraction: (npcId, relChange, memText, extractedFacts) => {
      gameEngine.recordNPCInteraction(npcId, relChange, memText, extractedFacts);
      get().syncWithEngine();
    },

    reportSafetyIssue: (note) => {
      gameEngine.reportSafetyIssue(get().currentLocation.latitude, get().currentLocation.longitude, note);
    },

    executeInteraction: async (command) => {
      const res = await gameEngine.executeInteraction(command);
      get().syncWithEngine();
      return res;
    },

    syncWithEngine: () => {
      set({
        profile: { ...gameEngine.getProfile() },
        companion: { ...gameEngine.getCompanion() },
        streets: [...gameEngine.getStreets()],
        places: [...gameEngine.getPlaces()],
        npcs: [...gameEngine.getNPCs()],
        quests: [...gameEngine.getQuests()],
        inventory: [...gameEngine.getInventory()],
        achievements: [...gameEngine.getAchievements()],
        currentDistrict: gameEngine.getCurrentDistrict(),
        activeSpawn: gameEngine.getActiveSpawn(),
        accuracyTier: gameEngine.getAccuracyTier(get().currentLocation),
        districtProjects: [...gameEngine.getDistrictProjects()],
        playerNetwork: { ...gameEngine.getPlayerNetwork() },
      });
    },
  };
});
