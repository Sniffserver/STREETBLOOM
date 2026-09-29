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
  DistrictProject,
  PlayerNetwork,
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
  DISTRICT_PROJECTS: 'sb_district_projects',
  PLAYER_NETWORK: 'sb_player_network',
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
  cash: 65,
  reputation: 15,
  actionTurns: 8,
  maxActionTurns: 10,
  skills: {
    streetSmart: 1,
    persuasion: 1,
    tech: 1,
    stealth: 1,
  },
  estimatedSteps: 0,
  todayStepsTurnsGranted: 0,
  activeMainQuestId: 'q-welcome-streetbloom',
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
  demoCash: 100,
  demoReputation: 25,
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
  private memFallback: Map<string, string> = new Map();

  private getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {}
    return this.memFallback.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {}
    this.memFallback.set(key, value);
  }

  private removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {}
    this.memFallback.delete(key);
  }

  public getSettings(): GameSettings {
    try {
      const data = this.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: GameSettings): void {
    try {
      this.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }

  public getProfile(): PlayerProfile {
    try {
      const data = this.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          cash: typeof parsed.cash === 'number' ? parsed.cash : DEFAULT_PROFILE.cash,
          reputation: typeof parsed.reputation === 'number' ? parsed.reputation : DEFAULT_PROFILE.reputation,
          actionTurns: typeof parsed.actionTurns === 'number' ? parsed.actionTurns : DEFAULT_PROFILE.actionTurns,
          maxActionTurns: typeof parsed.maxActionTurns === 'number' ? parsed.maxActionTurns : DEFAULT_PROFILE.maxActionTurns,
          skills: {
            ...DEFAULT_PROFILE.skills,
            ...(parsed.skills || {}),
          },
        };
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public saveProfile(profile: PlayerProfile): void {
    try {
      this.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  }

  public getCompanion(): Companion {
    try {
      const data = this.getItem(STORAGE_KEYS.COMPANION);
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
      this.setItem(STORAGE_KEYS.COMPANION, JSON.stringify(companion));
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
      const data = this.getItem(STORAGE_KEYS.STREETS);
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

      this.setItem(STORAGE_KEYS.STREETS, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to save streets progress', e);
    }
  }

  public getInventory(): InventoryItem[] {
    try {
      const data = this.getItem(STORAGE_KEYS.INVENTORY);
      if (data) return JSON.parse(data);
      return [{ itemId: 'snack-cinnamon-bun', count: 2, firstAcquiredAt: new Date().toISOString() }];
    } catch {
      return [{ itemId: 'snack-cinnamon-bun', count: 2, firstAcquiredAt: new Date().toISOString() }];
    }
  }

  public saveInventory(items: InventoryItem[]): void {
    try {
      this.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save inventory', e);
    }
  }

  public getQuests(): Quest[] | null {
    try {
      const data = this.getItem(STORAGE_KEYS.QUESTS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveQuests(quests: Quest[]): void {
    try {
      this.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
    } catch (e) {
      console.warn('Failed to save quests', e);
    }
  }

  public getNPCs(): NPC[] | null {
    try {
      const data = this.getItem(STORAGE_KEYS.NPCS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveNPCs(npcs: NPC[]): void {
    try {
      this.setItem(STORAGE_KEYS.NPCS, JSON.stringify(npcs));
    } catch (e) {
      console.warn('Failed to save npcs', e);
    }
  }

  public getAchievements(): Achievement[] | null {
    try {
      const data = this.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveAchievements(achs: Achievement[]): void {
    try {
      this.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achs));
    } catch (e) {
      console.warn('Failed to save achievements', e);
    }
  }

  public getEventQueue(): GameEvent[] {
    try {
      const data = this.getItem(STORAGE_KEYS.EVENTS_QUEUE);
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
        this.setItem(STORAGE_KEYS.EVENTS_QUEUE, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Failed to enqueue event', e);
    }
  }

  public markEventsSynced(eventIds: string[]): void {
    try {
      const set = new Set(eventIds);
      const queue = this.getEventQueue().filter((ev) => !set.has(ev.id));
      this.setItem(STORAGE_KEYS.EVENTS_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to mark events synced', e);
    }
  }

  public clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => this.removeItem(k));
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
      projects: this.getDistrictProjects(),
      network: this.getNetwork(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public getDistrictProjects(): DistrictProject[] {
    try {
      const data = this.getItem(STORAGE_KEYS.DISTRICT_PROJECTS);
      return data ? JSON.parse(data) : DEFAULT_DISTRICT_PROJECTS.map((p) => ({ ...p }));
    } catch {
      return DEFAULT_DISTRICT_PROJECTS.map((p) => ({ ...p }));
    }
  }

  public saveDistrictProjects(projects: DistrictProject[]): void {
    try {
      this.setItem(STORAGE_KEYS.DISTRICT_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save district projects', e);
    }
  }

  public getNetwork(): PlayerNetwork {
    try {
      const data = this.getItem(STORAGE_KEYS.PLAYER_NETWORK);
      return data ? JSON.parse(data) : { ...DEFAULT_PLAYER_NETWORK };
    } catch {
      return { ...DEFAULT_PLAYER_NETWORK };
    }
  }

  public saveNetwork(network: PlayerNetwork): void {
    try {
      this.setItem(STORAGE_KEYS.PLAYER_NETWORK, JSON.stringify(network));
    } catch (e) {
      console.warn('Failed to save network', e);
    }
  }
}

export const DEFAULT_DISTRICT_PROJECTS: DistrictProject[] = [
  {
    id: 'proj-kalamaja-workshop',
    district: 'Kalamaja',
    title: 'Kalamaja Varjatud Töökoda',
    description: 'Taasta vana puidutöökoda ühiseks jalatsite ja varustuse paranduspunktiks.',
    targetCash: 300,
    currentCash: 75,
    targetMaterials: 15,
    currentMaterials: 4,
    isUnlocked: false,
    perkDescription: 'Varustuse hooldus 30% soodsam kõigile linnaosas rändajatele.',
    contributorCount: 5,
  },
  {
    id: 'proj-kesklinn-hub',
    district: 'Kesklinn',
    title: 'Kesklinna Infovõrgustik',
    description: 'Paigalda arhiivivõtmed ja infopunktid vanalinna ja kesklinna piirile.',
    targetCash: 450,
    currentCash: 120,
    targetMaterials: 20,
    currentMaterials: 8,
    isUnlocked: false,
    perkDescription: 'Avab salajased vihjed ja varjatud tänavate lisateabe kaardil.',
    contributorCount: 8,
  },
  {
    id: 'proj-telliskivi-art',
    district: 'Telliskivi',
    title: 'Telliskivi Tänavakunsti Galerii',
    description: 'Loo mahajäetud depoohoovidesse virtuaalne loomeruum ja infosein.',
    targetCash: 250,
    currentCash: 90,
    targetMaterials: 10,
    currentMaterials: 6,
    isUnlocked: false,
    perkDescription: 'Suurendab rändurite mainetulu piirkonnas ja avab uusi kontakte.',
    contributorCount: 6,
  },
];

export const DEFAULT_PLAYER_NETWORK: PlayerNetwork = {
  id: 'net-tallinn-pioneers',
  name: 'Tallinna Varjurändurid',
  district: 'Kesklinn',
  createdAt: '2026-09-01T12:00:00.000Z',
  treasury: 150,
  members: [
    {
      id: 'mem-1',
      name: 'Linnarändur (Sina)',
      role: 'owner',
      joinedAt: '2026-09-01T12:00:00.000Z',
      contributedCash: 25,
      contributedMaterials: 2,
      completedQuests: 3,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'mem-2',
      name: 'KalamajaKass',
      role: 'manager',
      joinedAt: '2026-09-05T14:30:00.000Z',
      contributedCash: 80,
      contributedMaterials: 5,
      completedQuests: 7,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'mem-3',
      name: 'VanalinnaÖökull',
      role: 'member',
      joinedAt: '2026-09-10T19:15:00.000Z',
      contributedCash: 45,
      contributedMaterials: 3,
      completedQuests: 4,
      lastActiveAt: new Date().toISOString(),
    },
  ],
  projects: DEFAULT_DISTRICT_PROJECTS,
  activityLog: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      memberId: 'mem-2',
      memberName: 'KalamajaKass',
      action: 'Annetas Kalamaja Varjatud Töökotta 25 kr ja 2 materjali',
      amount: 25,
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      memberId: 'mem-3',
      memberName: 'VanalinnaÖökull',
      action: 'Täitis Kesklinna infovõrgustiku luureülesande (+1 materjal)',
    },
  ],
};

export const localStore = new LocalGameStore();
