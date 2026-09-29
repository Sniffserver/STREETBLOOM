import {
  PlayerProfile,
  Companion,
  StreetSegment,
  Place,
  Quest,
  InventoryItem,
  NPC,
  GameEvent,
  Achievement,
  BehavioralProfile,
} from '../../types/game';

const STORAGE_KEYS = {
  PROFILE: 'sb_player_profile',
  COMPANION: 'sb_companion',
  STREETS: 'sb_streets',
  PLACES: 'sb_places',
  QUESTS: 'sb_quests',
  INVENTORY: 'sb_inventory',
  NPCS: 'sb_npcs',
  ACHIEVEMENTS: 'sb_achievements',
  EVENTS_QUEUE: 'sb_events_queue',
  SETTINGS: 'sb_settings',
  LAST_LOC: 'sb_last_location',
};

export interface GameSettings {
  language: 'et' | 'en';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  privacyRadiusActive: boolean;
  demoModeActive: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'et',
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  privacyRadiusActive: false,
  demoModeActive: true,
};

export const DEFAULT_PROFILE: PlayerProfile = {
  id: 'usr-guest-' + Math.random().toString(36).substring(2, 9),
  name: 'Linnarändur',
  level: 1,
  explorationXP: 0,
  xpToNextLevel: 100,
  totalDistanceMeters: 0,
  streetsDiscovered: 0,
  districtsDiscovered: 0,
  landmarksDiscovered: 0,
  explorationStreak: 1,
  lastWalkDate: new Date().toISOString().split('T')[0],
  companionId: 'comp-pip-1',
  discoveredStreetIds: [],
  discoveredPlaceIds: [],
  knownNPCIds: [],
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

export const DEFAULT_BEHAVIORAL_PROFILE: BehavioralProfile = {
  totalSessions: 1,
  averageWalkLengthMeters: 450,
  preferredTimeOfDay: 'evening',
  explorationStyle: 'wanderer',
  favoriteDistricts: [{ district: 'Kalamaja', visitCount: 1 }],
  favoritePlaceTypes: ['cafe', 'park'],
  npcInteractionRate: 0.6,
  discoveryRate: 0.75,
  recentSessions: [],
};

export const DEFAULT_COMPANION: Companion = {
  id: 'comp-pip-1',
  name: 'Pip',
  species: 'Udurändur (Linnasilm)',
  evolutionStage: 1,
  evolutionForm: 'Seedling',
  hunger: 80,
  happiness: 85,
  energy: 90,
  curiosity: 95,
  affection: 60,
  health: 100,
  cleanliness: 90,
  personality: {
    curiosity: 0.9,
    friendliness: 0.85,
    bravery: 0.7,
    silliness: 0.8,
    independence: 0.5,
    greed: 0.3,
  },
  behavioralProfile: DEFAULT_BEHAVIORAL_PROFILE,
  memories: [
    {
      id: 'mem-first',
      type: 'discovery',
      summary: 'Ärkas koos sinuga ja vaatab esimest korda linna siluetti.',
      importance: 5,
      createdAt: new Date().toISOString(),
    },
  ],
  discoveredPlaces: [],
  favoriteDistricts: ['Kalamaja', 'Old Town'],
  favoriteNPCs: ['npc-marta'],
  lastInteractionAt: new Date().toISOString(),
  currentThought: 'Mis me järgmise nurga tagant leiame?',
};

export class LocalGameStore {
  public getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }

  public getProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  }

  public getCompanion(): Companion {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANION);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_COMPANION,
          ...parsed,
          behavioralProfile: parsed.behavioralProfile || DEFAULT_BEHAVIORAL_PROFILE,
        };
      }
      return DEFAULT_COMPANION;
    } catch {
      return DEFAULT_COMPANION;
    }
  }

  public saveCompanion(companion: Companion): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANION, JSON.stringify(companion));
    } catch (e) {
      console.warn('Failed to save companion', e);
    }
  }

  public getDiscoveredStreetIds(): string[] {
    try {
      const profile = this.getProfile();
      return profile.discoveredStreetIds || [];
    } catch {
      return [];
    }
  }

  public getDiscoveredPlaceIds(): string[] {
    try {
      const profile = this.getProfile();
      return profile.discoveredPlaceIds || [];
    } catch {
      return [];
    }
  }

  public getStreetsProgress(): Record<string, {
    discovered: boolean;
    discoveryPercent: number;
    exploredDistanceMeters: number;
    visitCount: number;
    exploredSubsegmentIds: string[];
    subsegmentTraversedMeters?: Record<string, number>;
    coveredRanges?: Record<string, [number, number][]>;
  }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STREETS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public saveStreetsProgress(streets: StreetSegment[]): void {
    try {
      const record: Record<string, {
        discovered: boolean;
        discoveryPercent: number;
        exploredDistanceMeters: number;
        visitCount: number;
        exploredSubsegmentIds: string[];
        subsegmentTraversedMeters: Record<string, number>;
        coveredRanges?: Record<string, [number, number][]>;
      }> = {};

      streets.forEach((s) => {
        if (s.discoveryPercent > 0 || s.discovered) {
          const exploredIds = s.segments?.filter((sub) => sub.explored).map((sub) => sub.id) || [];
          const traversed: Record<string, number> = {};
          const covered: Record<string, [number, number][]> = {};
          s.segments?.forEach((sub) => {
            if (sub.traversedDistanceMeters > 0) {
              traversed[sub.id] = sub.traversedDistanceMeters;
            }
            if ((sub as any)._coveredIntervals && (sub as any)._coveredIntervals.length > 0) {
              covered[sub.id] = (sub as any)._coveredIntervals;
            }
          });
          record[s.id] = {
            discovered: s.discovered,
            discoveryPercent: s.discoveryPercent,
            exploredDistanceMeters: s.exploredDistanceMeters,
            visitCount: s.visitCount,
            exploredSubsegmentIds: exploredIds,
            subsegmentTraversedMeters: traversed,
            coveredRanges: covered,
          };
        }
      });

      localStorage.setItem(STORAGE_KEYS.STREETS, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to save streets progress', e);
    }
  }

  public getInventory(): InventoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (data) return JSON.parse(data);
      return [{ itemId: 'snack-cinnamon-bun', count: 2, firstAcquiredAt: new Date().toISOString() }];
    } catch {
      return [{ itemId: 'snack-cinnamon-bun', count: 2, firstAcquiredAt: new Date().toISOString() }];
    }
  }

  public saveInventory(items: InventoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save inventory', e);
    }
  }

  public getQuests(): Quest[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveQuests(quests: Quest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
    } catch (e) {
      console.warn('Failed to save quests', e);
    }
  }

  public getNPCs(): NPC[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NPCS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveNPCs(npcs: NPC[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NPCS, JSON.stringify(npcs));
    } catch (e) {
      console.warn('Failed to save npcs', e);
    }
  }

  public getAchievements(): Achievement[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveAchievements(achs: Achievement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achs));
    } catch (e) {
      console.warn('Failed to save achievements', e);
    }
  }

  public getEventQueue(): GameEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public enqueueEvent(event: GameEvent): void {
    try {
      const queue = this.getEventQueue();
      // Ensure unique event ID
      if (!queue.some((e) => e.id === event.id)) {
        queue.push(event);
        if (queue.length > 300) queue.shift();
        localStorage.setItem(STORAGE_KEYS.EVENTS_QUEUE, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Failed to enqueue event', e);
    }
  }

  public markEventsSynced(eventIds: string[]): void {
    try {
      const set = new Set(eventIds);
      const queue = this.getEventQueue().filter((ev) => !set.has(ev.id));
      localStorage.setItem(STORAGE_KEYS.EVENTS_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to mark events synced', e);
    }
  }

  public clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }

  public exportFullSaveJson(): string {
    const backup = {
      profile: this.getProfile(),
      companion: this.getCompanion(),
      inventory: this.getInventory(),
      quests: this.getQuests(),
      npcs: this.getNPCs(),
      achievements: this.getAchievements(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  }
}

export const localStore = new LocalGameStore();
