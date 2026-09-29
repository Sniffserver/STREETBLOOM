import {
  GeoLocation,
  StreetSegment,
  Place,
  NPC,
  Quest,
  Item,
  InventoryItem,
  PlayerProfile,
  Companion,
  Achievement,
  ProceduralEncounter,
  CompanionEvolution,
  WalkSession,
  BehavioralProfile,
  GameEvent,
  DistrictName,
  AccuracyTier,
  InteractionCommand,
  InteractionExecutionResult,
  NPCSpawnEvent,
  DistrictProject,
  PlayerNetwork,
  CashLedgerEntry,
  CashLedgerCategory,
} from '../../types/game';
import { eventBus } from './eventBus';
import { localStore } from '../../services/storage/db';
import { defaultGeoProvider } from '../../services/geo/geoProvider';
import {
  checkPlayerTraversedSegment,
  computeMovementAlongSegment,
  filterNearbyStreets,
  haversineDistanceMeters,
  validateMovement,
} from '../../services/geo/geoUtils';
import { districtTracker, getAccuracyTier } from '../../services/geo/districtService';
import { getDeterministicSpawnForDistrict, getCurrentTimeSlot } from '../../services/npc/spawnService';
import { soundManager } from '../../audio/soundManager';
import { SEED_ITEMS } from '../../data/itemsSeed';
import { SEED_ACHIEVEMENTS } from '../../data/achievements';
import { SEED_QUESTS } from '../../data/questsSeed';
import { SEED_NPCS } from '../../data/npcsSeed';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'ev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

function getTimeOfDay(hour: number): 'morning' | 'day' | 'evening' | 'night' {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export class GameEngine {
  private profile: PlayerProfile;
  private companion: Companion;
  private streets: StreetSegment[] = [];
  private places: Place[] = [];
  private npcs: NPC[] = [];
  private quests: Quest[] = [];
  private itemsMap: Map<string, Item> = new Map();
  private inventory: InventoryItem[] = [];
  private achievements: Achievement[] = [];
  private activeEncounters: ProceduralEncounter[] = [];

  private lastLocation: GeoLocation | null = null;
  private currentSession: WalkSession;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  // Varjulinn Core Systems
  private currentDistrict: DistrictName = 'Kesklinn';
  private activeSpawn: NPCSpawnEvent | null = null;
  private processedInteractionIds = new Set<string>();
  private accumulatedStepBuffer: number = 0;
  private lastTurnRecoveryTime: number = Date.now();
  private safetyReports: Array<{ lat: number; lon: number; note: string; timestamp: string }> = [];
  private projects: DistrictProject[] = [];
  private network: PlayerNetwork;

  constructor() {
    this.profile = localStore.getProfile();
    this.companion = localStore.getCompanion();
    this.inventory = localStore.getInventory();
    this.npcs = localStore.getNPCs() || SEED_NPCS.map((n) => ({ ...n }));
    this.quests = localStore.getQuests() || SEED_QUESTS.map((q) => ({ ...q }));
    this.achievements = localStore.getAchievements() || SEED_ACHIEVEMENTS.map((a) => ({ ...a }));
    this.projects = localStore.getDistrictProjects();
    this.network = localStore.getNetwork();

    this.checkDailyReset();

    SEED_ITEMS.forEach((it) => this.itemsMap.set(it.id, it));

    const currentHour = new Date().getHours();
    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      distanceMeters: 0,
      streetsProgressed: [],
      placesVisited: [],
      npcInteractions: 0,
      timeOfDay: getTimeOfDay(currentHour),
    };

    // Periodic idempotent sync to backend
    this.startPeriodicSync();
  }

  public async initialize(initialLoc: GeoLocation): Promise<void> {
    this.lastLocation = initialLoc;

    // Detect and establish confirmed district and initial spawn
    const districtRes = districtTracker.update(initialLoc.latitude, initialLoc.longitude);
    this.currentDistrict = districtRes.district;
    this.activeSpawn = getDeterministicSpawnForDistrict(this.currentDistrict, getCurrentTimeSlot(), this.npcs);

    this.streets = await defaultGeoProvider.getNearbyStreets(
      initialLoc.latitude,
      initialLoc.longitude,
      3000
    );
    this.places = await defaultGeoProvider.getNearbyPlaces(
      initialLoc.latitude,
      initialLoc.longitude,
      3000
    );

    // Restore exact street subsegments and exploration progress from local storage
    const savedProgress = localStore.getStreetsProgress();
    const discoveredStreetSet = new Set(this.profile.discoveredStreetIds || []);

    this.streets.forEach((s) => {
      const saved = savedProgress[s.id];
      if (saved) {
        s.discovered = saved.discovered || discoveredStreetSet.has(s.id);
        s.discoveryPercent = saved.discoveryPercent;
        s.exploredDistanceMeters = saved.exploredDistanceMeters || 0;
        s.visitCount = saved.visitCount || s.visitCount;
        const expSet = new Set(saved.exploredSubsegmentIds || []);
        s.segments?.forEach((sub) => {
          if (expSet.has(sub.id)) {
            sub.explored = true;
          }
          if (saved.subsegmentTraversedMeters?.[sub.id]) {
            sub.traversedDistanceMeters = saved.subsegmentTraversedMeters[sub.id];
          }
          if ((saved as any).coveredRanges?.[sub.id]) {
            (sub as any)._coveredIntervals = (saved as any).coveredRanges[sub.id];
          } else if (sub.traversedDistanceMeters > 0) {
            (sub as any)._coveredIntervals = [[0, Math.min(1, sub.traversedDistanceMeters / sub.lengthMeters)]];
          }
        });
      } else if (discoveredStreetSet.has(s.id)) {
        s.discovered = true;
        s.discoveryPercent = Math.max(70, s.discoveryPercent || 100);
        s.segments?.forEach((sub) => {
          sub.explored = true;
          sub.traversedDistanceMeters = sub.lengthMeters;
          (sub as any)._coveredIntervals = [[0, 1]];
        });
      }
    });

    const discoveredPlaceSet = new Set(this.profile.discoveredPlaceIds || []);
    this.places.forEach((p) => {
      if (discoveredPlaceSet.has(p.id)) {
        p.discovered = true;
      }
    });

    // Check day streak
    const today = new Date().toISOString().split('T')[0];
    if (this.profile.lastWalkDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (this.profile.lastWalkDate === yesterday) {
        this.profile.explorationStreak += 1;
      } else {
        this.profile.explorationStreak = 1;
      }
      this.profile.lastWalkDate = today;
      this.saveState();
    }
  }

  public getProfile(): PlayerProfile {
    return this.profile;
  }

  public getCompanion(): Companion {
    return this.companion;
  }

  public getStreets(): StreetSegment[] {
    return this.streets;
  }

  public getPlaces(): Place[] {
    return this.places;
  }

  public getNPCs(): NPC[] {
    return this.npcs;
  }

  public getQuests(): Quest[] {
    return this.quests;
  }

  public getInventory(): InventoryItem[] {
    return this.inventory;
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  public getActiveEncounters(): ProceduralEncounter[] {
    return this.activeEncounters;
  }

  public getItemDetails(itemId: string): Item | undefined {
    return this.itemsMap.get(itemId);
  }

  // Location update processor with real street segment geometric traversal
  public processLocationUpdate(location: GeoLocation): {
    newStreet?: StreetSegment;
    progressedStreet?: StreetSegment;
    newPlace?: Place;
    nearbyNPC?: NPC;
    distanceWalked: number;
    foundItem?: Item;
  } {
    const result: {
      newStreet?: StreetSegment;
      progressedStreet?: StreetSegment;
      newPlace?: Place;
      nearbyNPC?: NPC;
      distanceWalked: number;
      foundItem?: Item;
    } = { distanceWalked: 0 };

    const validation = validateMovement(this.lastLocation, location);
    if (!validation.valid && !location.isSimulated) {
      return result;
    }

    const dist = validation.distanceMeters;
    result.distanceWalked = dist;

    if (dist > 0) {
      this.profile.totalDistanceMeters += Math.round(dist);
      this.currentSession.distanceMeters += Math.round(dist);

      // Walking step conversion: 1m ≈ 1.33 steps (0.75m average stride)
      const steps = Math.round(dist / 0.75);
      this.profile.estimatedSteps = (this.profile.estimatedSteps || 0) + steps;
      this.accumulatedStepBuffer += steps;

      // 200 steps -> 1 action turn (max 6 turns/day from walking)
      while (this.accumulatedStepBuffer >= 200) {
        this.accumulatedStepBuffer -= 200;
        if ((this.profile.todayStepsTurnsGranted || 0) < 6 && this.profile.actionTurns < this.profile.maxActionTurns) {
          this.profile.actionTurns += 1;
          this.profile.todayStepsTurnsGranted = (this.profile.todayStepsTurnsGranted || 0) + 1;
          soundManager.playHappy();
          eventBus.emit('TURN_RECOVERED', { reason: 'steps', currentTurns: this.profile.actionTurns });
        }
      }

      this.updateQuestProgress('EXPLORATION', Math.round(dist));
      this.updateAchievementProgress('ach-distance-5k', Math.round(dist));
      this.updateBehavioralProfile(dist);
    }

    // Passive turn recovery (1 turn every 15 minutes up to maxActionTurns)
    const nowTime = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    if (nowTime - this.lastTurnRecoveryTime >= fifteenMinutes) {
      const turnsToAdd = Math.floor((nowTime - this.lastTurnRecoveryTime) / fifteenMinutes);
      if (this.profile.actionTurns < this.profile.maxActionTurns) {
        this.profile.actionTurns = Math.min(this.profile.maxActionTurns, this.profile.actionTurns + turnsToAdd);
      }
      this.lastTurnRecoveryTime = nowTime;
    }

    // District tracking with 30s hysteresis
    const districtRes = districtTracker.update(location.latitude, location.longitude);
    this.currentDistrict = districtRes.district;

    // Active deterministic spawn management
    const timeSlot = getCurrentTimeSlot();
    if (!this.activeSpawn || this.activeSpawn.district !== this.currentDistrict || this.activeSpawn.expiresAt <= nowTime) {
      this.activeSpawn = getDeterministicSpawnForDistrict(this.currentDistrict, timeSlot, this.npcs);
    }

    const prevLocation = this.lastLocation;
    this.lastLocation = location;

    // Log move event for offline queue
    this.logGameEvent('PLAYER_MOVED', {
      lat: location.latitude,
      lon: location.longitude,
      speed: location.speed,
      timestamp: location.timestamp,
    });
    eventBus.emit('PLAYER_MOVED', location);

    // 1. Street Sub-Segment Traversal & Progress Calculation (Spatial query + deterministic geometric traversal)
    const candidateStreets = filterNearbyStreets(this.streets, location.latitude, location.longitude, 100);
    for (const street of candidateStreets) {
      if (!street.segments || street.segments.length === 0) continue;

      let streetHadNewProgress = false;

      for (let idx = 0; idx < street.segments.length; idx++) {
        const sub = street.segments[idx];
        if (sub.explored) continue;

        // Deterministic geometric check: measures orthogonal corridor distance and physical traversal along the segment axis
        const traversal = computeMovementAlongSegment(
          prevLocation ? prevLocation.latitude : null,
          prevLocation ? prevLocation.longitude : null,
          location.latitude,
          location.longitude,
          sub,
          24, // 24-meter physical street corridor width
          0.50 // 50% segment traversal threshold
        );

        if (traversal.inCorridor && traversal.distanceAlongSegmentMeters > 0) {
          const prevTraversed = sub.traversedDistanceMeters || 0;
          sub.traversedDistanceMeters = traversal.newTraversedTotalMeters;
          const deltaTraversed = sub.traversedDistanceMeters - prevTraversed;

          if (deltaTraversed > 0) {
            streetHadNewProgress = true;
          }

          if (traversal.isNowExplored && !sub.explored) {
            sub.explored = true;
            sub.exploredAt = new Date().toISOString();

            // Partial segment progress milestone reward
            this.addExplorationXP(10);

            // Asynchronously request server-side validation
            this.validateDiscoveryWithServer(street, idx, prevLocation, location);
          }
        }
      }

      if (streetHadNewProgress) {
        // Deterministically compute total explored distance and exact percentage from all segments
        const totalTraversed = street.segments.reduce(
          (sum: number, s: any) => sum + (s.explored ? s.lengthMeters : (s.traversedDistanceMeters || 0)),
          0
        );
        street.exploredDistanceMeters = Math.min(street.lengthMeters, Math.round(totalTraversed));
        street.discoveryPercent = Math.min(
          100,
          Math.round((street.exploredDistanceMeters / Math.max(1, street.lengthMeters)) * 100)
        );

        result.progressedStreet = street;

        this.logGameEvent('STREET_PROGRESS', {
          streetId: street.id,
          exploredDistanceMeters: street.exploredDistanceMeters,
          discoveryPercent: street.discoveryPercent,
        });

        if (!this.currentSession.streetsProgressed.includes(street.id)) {
          this.currentSession.streetsProgressed.push(street.id);
        }

        // Check if street reached completion threshold (>= 70%)
        if (street.discoveryPercent >= 70 && !street.discovered) {
          street.discovered = true;
          street.firstDiscoveredAt = new Date().toISOString();
          street.visitCount = 1;

          this.profile.discoveredStreetIds.push(street.id);
          this.profile.streetsDiscovered += 1;

          // Full milestone XP
          this.addExplorationXP(street.explorationXP);

          // Companion celebration & memory
          this.companion.happiness = Math.min(100, this.companion.happiness + 15);
          this.companion.curiosity = Math.min(100, this.companion.curiosity + 15);
          this.companion.currentThought = `Ohoo! Tänav ${street.name} on nüüd kaardistatud (${street.discoveryPercent}%)!`;

          this.companion.memories.unshift({
            id: `mem-st-${Date.now()}`,
            type: 'discovery',
            summary: `Kaardistasite tänava ${street.name} (${street.district}) ${street.discoveryPercent}% ulatuses.`,
            importance: 5,
            createdAt: new Date().toISOString(),
          });
          if (this.companion.memories.length > 25) this.companion.memories.pop();

          // Roll street item
          const foundItem = this.rollStreetItem(street);
          if (foundItem) {
            this.addItemToInventory(foundItem.id, 1);
            result.foundItem = foundItem;
            eventBus.emit('ITEM_FOUND', foundItem);
          }

          result.newStreet = street;
          this.updateQuestProgress('DISCOVERY', 1);
          this.updateAchievementProgress('ach-first-street', 1);
          this.updateAchievementProgress('ach-five-streets', this.profile.streetsDiscovered);
          this.updateAchievementProgress('ach-ten-streets', this.profile.streetsDiscovered);

          soundManager.playDiscovery();
          soundManager.triggerHaptic([30, 60, 30]);
          eventBus.emit('STREET_DISCOVERED', street);
          break;
        } else {
          street.visitCount = (street.visitCount || 0) + 1;
        }
      }
    }

    // 2. Place Discovery Check (within 45m)
    for (const place of this.places) {
      if (!place.discovered) {
        const distToPlace = haversineDistanceMeters(
          location.latitude,
          location.longitude,
          place.latitude,
          place.longitude
        );

        if (distToPlace <= 45) {
          place.discovered = true;
          place.discoveredAt = new Date().toISOString();
          this.profile.discoveredPlaceIds.push(place.id);
          this.profile.landmarksDiscovered += 1;
          this.addExplorationXP(60);

          if (!this.currentSession.placesVisited.includes(place.id)) {
            this.currentSession.placesVisited.push(place.id);
          }

          this.companion.memories.unshift({
            id: `mem-pl-${Date.now()}`,
            type: 'place',
            summary: `Leidsite salajase paiga: ${place.name}!`,
            importance: 5,
            createdAt: new Date().toISOString(),
          });

          this.updateQuestProgress('SEARCH', 1, place.id);
          result.newPlace = place;

          this.logGameEvent('PLACE_DISCOVERED', { placeId: place.id });
          soundManager.playDiscovery();
          eventBus.emit('PLACE_DISCOVERED', place);
          break;
        }
      }
    }

    // 3. NPC Proximity Check (within 65m)
    const currentHour = new Date().getHours();
    for (const npc of this.npcs) {
      const slot = npc.schedule.find(
        (s) => currentHour >= s.startHour && currentHour < s.endHour
      ) || npc.schedule[0];

      const distToNPC = haversineDistanceMeters(
        location.latitude,
        location.longitude,
        slot.latitude,
        slot.longitude
      );

      if (distToNPC <= 65) {
        result.nearbyNPC = npc;
        if (!this.profile.knownNPCIds.includes(npc.id)) {
          this.profile.knownNPCIds.push(npc.id);
        }
        eventBus.emit('NPC_NEARBY', npc);
        break;
      }
    }

    this.checkCompanionEvolution();
    this.saveState();
    return result;
  }

  // Update Pip's behavioral profile based on real walk telemetry
  private updateBehavioralProfile(deltaMeters: number): void {
    const bp = this.companion.behavioralProfile;
    if (!bp) return;

    bp.averageWalkLengthMeters = Math.round(
      (bp.averageWalkLengthMeters * 0.9) + (deltaMeters * 0.1)
    );

    const hour = new Date().getHours();
    bp.preferredTimeOfDay = getTimeOfDay(hour);

    // Calculate exploration style
    if (this.profile.streetsDiscovered >= 5 && this.inventory.length < 3) {
      bp.explorationStyle = 'completionist';
    } else if (this.inventory.length >= 5) {
      bp.explorationStyle = 'collector';
    } else if (this.npcs.some((n) => n.relationshipLevel >= 2)) {
      bp.explorationStyle = 'social';
    } else {
      bp.explorationStyle = 'wanderer';
    }
  }

  // Validate discovery with authoritative server endpoint
  private async validateDiscoveryWithServer(
    street: StreetSegment,
    subsegmentIndex: number,
    startLoc: GeoLocation | null,
    endLoc: GeoLocation
  ): Promise<void> {
    try {
      const pStart = startLoc
        ? [startLoc.latitude, startLoc.longitude]
        : [endLoc.latitude, endLoc.longitude];
      const pEnd = [endLoc.latitude, endLoc.longitude];

      const response = await fetch('/api/discovery/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streetId: street.id,
          subsegmentIndex,
          subsegmentLengthMeters: street.segments[subsegmentIndex]?.lengthMeters || 40,
          totalStreetLengthMeters: street.lengthMeters,
          playerStart: pStart,
          playerEnd: pEnd,
          timeDeltaMs: startLoc ? endLoc.timestamp - startLoc.timestamp : 1000,
          currentExploredDistanceMeters: street.exploredDistanceMeters,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.isFullyDiscovered && !street.discovered) {
          street.discovered = true;
          this.saveState();
        }
      }
    } catch {
      // Offline fallback: verified locally, will sync when online
    }
  }

  private rollStreetItem(street: StreetSegment): Item | null {
    if (Math.random() > 0.45) return null;

    const availableItems = Array.from(this.itemsMap.values()).filter(
      (it) => !it.foundInDistrict || it.foundInDistrict === street.district
    );

    if (availableItems.length === 0) return null;
    return availableItems[Math.floor(Math.random() * availableItems.length)];
  }

  public addExplorationXP(amount: number): void {
    this.profile.explorationXP += amount;
    soundManager.playXP();

    const newLevel = Math.floor(Math.sqrt(this.profile.explorationXP / 40)) + 1;
    if (newLevel > this.profile.level) {
      this.profile.level = newLevel;
      soundManager.playLevelUp();
      soundManager.triggerHaptic([50, 100, 50, 100]);

      this.companion.happiness = 100;
      this.companion.currentThought = `Palju õnne! Meie uurija tase tõusis: Tase ${newLevel}!`;
    }

    this.saveState();
  }

  // Companion care interactions with behavioral grounding
  public feedCompanion(inventoryItemId?: string): { success: boolean; message: string } {
    let nutrition = 30;
    if (inventoryItemId) {
      const invItem = this.inventory.find((i) => i.itemId === inventoryItemId);
      if (!invItem || invItem.count <= 0) {
        return { success: false, message: 'Sul ei ole seda toitu seljakotis.' };
      }
      const itemDef = this.itemsMap.get(inventoryItemId);
      nutrition = itemDef?.feedNutrition || 30;
      this.consumeItem(inventoryItemId, 1);
    }

    this.companion.hunger = Math.min(100, this.companion.hunger + nutrition);
    this.companion.happiness = Math.min(100, this.companion.happiness + 15);
    this.companion.health = Math.min(100, this.companion.health + 5);
    this.companion.lastInteractionAt = new Date().toISOString();
    this.companion.currentThought = 'Mmm, see maitses imeliselt! Olen valmis edasi minema!';

    soundManager.playCompanionHappy();
    soundManager.triggerHaptic(20);
    this.updateQuestProgress('COMPANION', 1);

    this.logGameEvent('COMPANION_INTERACTED', { action: 'feed' });
    eventBus.emit('COMPANION_INTERACTED', { action: 'feed', companion: this.companion });
    this.saveState();
    return { success: true, message: 'Kaaslane sõi kõhu täis!' };
  }

  public petCompanion(): void {
    this.companion.affection = Math.min(100, this.companion.affection + 8);
    this.companion.happiness = Math.min(100, this.companion.happiness + 10);
    this.companion.lastInteractionAt = new Date().toISOString();
    this.companion.currentThought = '*Pip teeb vaikset rõõmsat nurrumishäält ja surub oma pea su vastu.*';

    soundManager.playCompanionHappy();
    soundManager.triggerHaptic([15, 25]);
    this.updateQuestProgress('COMPANION', 1);
    this.updateAchievementProgress('ach-companion-bond', this.companion.affection);

    this.logGameEvent('COMPANION_INTERACTED', { action: 'pet' });
    eventBus.emit('COMPANION_INTERACTED', { action: 'pet', companion: this.companion });
    this.saveState();
  }

  // Behavioral grounding for Pip's speech
  public talkCompanion(): string {
    const bp = this.companion.behavioralProfile;
    const partiallyExplored = this.streets.find((s) => s.discoveryPercent > 0 && s.discoveryPercent < 70);

    const behavioralThoughts: string[] = [];

    if (bp.preferredTimeOfDay === 'evening') {
      behavioralThoughts.push('Sa tuled alati õhtuhämaruses kõndima. Lambid juba süttivad!');
    } else if (bp.preferredTimeOfDay === 'morning') {
      behavioralThoughts.push('Hommikune kaste ja värske asfaldilõhn... meil on suurepärane algus!');
    }

    if (partiallyExplored) {
      behavioralThoughts.push(
        `Kuule, meil on ${partiallyExplored.name} alles ${partiallyExplored.discoveryPercent}% peal. Kas uurime selle lõpuni?`
      );
    }

    if (bp.explorationStyle === 'wanderer') {
      behavioralThoughts.push('Mulle meeldib, kuidas sa ei torma otse, vaid uitad mööda tundmatuid radu.');
    } else if (bp.explorationStyle === 'completionist') {
      behavioralThoughts.push('Sulle meeldib asjad lõpuni viia. Vaata neid valmis kaardistatud tänavaid!');
    }

    behavioralThoughts.push(
      'Marta kohvikust tuleb nii hea kardemoni lõhn, lähme varsti sinna!',
      'Iga kord, kui me uue tee valime, muutub meie kaart värvilisemaks.',
      'Kas tead, et vanalinna paekivi mäletab kõiki rändureid?'
    );

    const thought = behavioralThoughts[Math.floor(Math.random() * behavioralThoughts.length)];
    this.companion.currentThought = thought;
    this.companion.curiosity = Math.min(100, this.companion.curiosity + 8);
    this.companion.affection = Math.min(100, this.companion.affection + 5);
    this.companion.lastInteractionAt = new Date().toISOString();

    soundManager.playTap();
    this.updateQuestProgress('COMPANION', 1);
    this.logGameEvent('COMPANION_INTERACTED', { action: 'talk', thought });
    eventBus.emit('COMPANION_INTERACTED', { action: 'talk', companion: this.companion });
    this.saveState();
    return thought;
  }

  public playCompanion(): void {
    if (this.companion.energy < 15) {
      this.companion.currentThought = 'Pip on liiga väsinud... Las ta puhkab natuke.';
      return;
    }
    this.companion.energy = Math.max(0, this.companion.energy - 15);
    this.companion.happiness = Math.min(100, this.companion.happiness + 20);
    this.companion.hunger = Math.max(0, this.companion.hunger - 10);
    this.companion.currentThought = 'Pip hüppab rõõmsalt lehtede sees ja teeb saltosid!';

    soundManager.playCompanionHappy();
    this.updateQuestProgress('COMPANION', 1);

    this.logGameEvent('COMPANION_INTERACTED', { action: 'play' });
    eventBus.emit('COMPANION_INTERACTED', { action: 'play', companion: this.companion });
    this.saveState();
  }

  public restCompanion(): void {
    this.companion.energy = Math.min(100, this.companion.energy + 40);
    this.companion.health = Math.min(100, this.companion.health + 10);
    this.companion.currentThought = 'Pip uinub su õlal ja kogub uueks teekonnaks jõudu... zzz';

    soundManager.playTap();
    this.logGameEvent('COMPANION_INTERACTED', { action: 'rest' });
    eventBus.emit('COMPANION_INTERACTED', { action: 'rest', companion: this.companion });
    this.saveState();
  }

  private checkCompanionEvolution(): void {
    if (this.companion.evolutionStage >= 2) return;

    let targetForm: CompanionEvolution | null = null;
    const bp = this.companion.behavioralProfile;

    if (this.profile.totalDistanceMeters >= 1200 || this.profile.streetsDiscovered >= 5) {
      targetForm = 'Scout';
    } else if (this.inventory.length >= 4) {
      targetForm = 'Hoarder';
    } else if (this.npcs.some((n) => n.relationshipLevel >= 2)) {
      targetForm = 'Charmer';
    } else if (bp.preferredTimeOfDay === 'night' && this.profile.totalDistanceMeters >= 600) {
      targetForm = 'Moon';
    }

    if (targetForm && this.profile.level >= 2) {
      this.companion.evolutionStage = 2;
      this.companion.evolutionForm = targetForm;
      this.companion.species = `Udurändur (${targetForm})`;

      soundManager.playLevelUp();
      soundManager.triggerHaptic([60, 100, 60, 100]);

      this.companion.memories.unshift({
        id: `mem-evo-${Date.now()}`,
        type: 'discovery',
        summary: `Kaaslane läbis arenguhüppe ja saavutas vormi: ${targetForm}!`,
        importance: 5,
        createdAt: new Date().toISOString(),
      });

      this.updateAchievementProgress('ach-companion-evolve', 1);
      this.logGameEvent('COMPANION_EVOLVED', { form: targetForm });
      eventBus.emit('COMPANION_EVOLVED', targetForm);
      this.saveState();
    }
  }

  public recordNPCInteraction(
    npcId: string,
    relationshipChange: number,
    memoryText?: string,
    extractedFacts?: string[]
  ): void {
    const npc = this.npcs.find((n) => n.id === npcId);
    if (!npc) return;

    this.currentSession.npcInteractions += 1;
    npc.relationshipPoints += Math.max(1, relationshipChange);

    const thresholds = [0, 30, 70, 130, 210, 320, 480];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (npc.relationshipPoints >= thresholds[i]) {
        if (npc.relationshipLevel < i) {
          npc.relationshipLevel = i;
          soundManager.playQuestComplete();
          this.updateAchievementProgress('ach-npc-friend', i >= 3 ? 1 : 0);
        }
        break;
      }
    }

    if (memoryText) {
      npc.memories.unshift(memoryText);
      if (npc.memories.length > 10) npc.memories.pop();
    }

    if (extractedFacts && extractedFacts.length > 0) {
      extractedFacts.forEach((fact) => {
        if (!npc.memories.includes(fact)) {
          npc.memories.unshift(fact);
        }
      });
      if (npc.memories.length > 15) npc.memories.length = 15;
    }

    this.updateQuestProgress('SOCIAL', 1, npcId);
    this.logGameEvent('NPC_DIALOGUE_FINISHED', { npcId, relChange: relationshipChange });
    this.saveState();
  }

  public addItemToInventory(itemId: string, count = 1): void {
    const existing = this.inventory.find((i) => i.itemId === itemId);
    if (existing) {
      existing.count += count;
    } else {
      this.inventory.push({
        itemId,
        count,
        firstAcquiredAt: new Date().toISOString(),
      });
    }

    this.updateAchievementProgress('ach-collector-five', this.inventory.length);
    this.updateQuestProgress('COLLECTION', count, itemId);
    this.logGameEvent('ITEM_FOUND', { itemId, count });
    this.saveState();
  }

  public consumeItem(itemId: string, count = 1): boolean {
    const existing = this.inventory.find((i) => i.itemId === itemId);
    if (!existing || existing.count < count) return false;

    existing.count -= count;
    if (existing.count <= 0) {
      this.inventory = this.inventory.filter((i) => i.itemId !== itemId);
    }
    this.saveState();
    return true;
  }

  public updateQuestProgress(type: Quest['type'], amount = 1, targetRef?: string): void {
    for (const quest of this.quests) {
      if (quest.status !== 'active') continue;
      if (quest.type !== type) continue;

      if (targetRef && (quest.targetPlaceId || quest.targetStreetId || quest.giverNPCId)) {
        if (
          quest.targetPlaceId !== targetRef &&
          quest.targetStreetId !== targetRef &&
          quest.giverNPCId !== targetRef
        ) {
          continue;
        }
      }

      quest.currentCount = (quest.currentCount || 0) + amount;
      if (quest.targetCount && quest.currentCount >= quest.targetCount) {
        this.completeQuest(quest.id);
      }
    }
    this.saveState();
  }

  public completeQuest(questId: string): void {
    const quest = this.quests.find((q) => q.id === questId);
    if (!quest || quest.status === 'completed') return;

    quest.status = 'completed';
    quest.completedAt = new Date().toISOString();

    if (quest.rewards.xp) {
      this.addExplorationXP(quest.rewards.xp);
    }
    if (quest.rewards.itemId && quest.rewards.itemCount) {
      this.addItemToInventory(quest.rewards.itemId, quest.rewards.itemCount);
    }
    if (quest.rewards.companionHappiness) {
      this.companion.happiness = Math.min(
        100,
        this.companion.happiness + quest.rewards.companionHappiness
      );
    }
    if (quest.rewards.relationshipNPCId && quest.rewards.relationshipPoints) {
      this.recordNPCInteraction(
        quest.rewards.relationshipNPCId,
        quest.rewards.relationshipPoints,
        `Täitis ülesande: ${quest.title}`
      );
    }

    soundManager.playQuestComplete();
    soundManager.triggerHaptic([40, 80, 40, 80]);
    this.logGameEvent('QUEST_COMPLETED', { questId });
    eventBus.emit('QUEST_COMPLETED', quest);

    this.saveState();
  }

  public startQuest(questId: string): void {
    const quest = this.quests.find((q) => q.id === questId);
    if (!quest || quest.status !== 'available') return;

    quest.status = 'active';
    quest.unlockedAt = new Date().toISOString();
    this.logGameEvent('QUEST_STARTED', { questId });
    eventBus.emit('QUEST_STARTED', quest);
    this.saveState();
  }

  public updateAchievementProgress(achId: string, current: number): void {
    const ach = this.achievements.find((a) => a.id === achId);
    if (!ach || ach.unlocked) return;

    ach.progress = Math.min(ach.maxProgress, current);
    if (ach.progress >= ach.maxProgress) {
      ach.unlocked = true;
      ach.unlockedAt = new Date().toISOString();
      this.addExplorationXP(75);
      soundManager.playLevelUp();
      this.logGameEvent('ACHIEVEMENT_UNLOCKED', { achId });
      eventBus.emit('ACHIEVEMENT_UNLOCKED', ach);
    }
    this.saveState();
  }

  private logGameEvent(type: string, payload: Record<string, unknown>): void {
    const event: GameEvent = {
      id: generateUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
      synced: false,
    };
    localStore.enqueueEvent(event);
  }

  private startPeriodicSync(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);

    this.syncTimer = setInterval(async () => {
      const queue = localStore.getEventQueue();
      if (queue.length === 0) return;

      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: queue }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.acknowledgedIds && Array.isArray(data.acknowledgedIds)) {
            localStore.markEventsSynced(data.acknowledgedIds);
          }
        }
      } catch {
        // Offline, retry on next interval
      }
    }, 15000);

    // Unref timer so Node.js can exit in CLI/tests
    if (this.syncTimer && typeof this.syncTimer.unref === 'function') {
      this.syncTimer.unref();
    }
  }

  public getCurrentDistrict(): DistrictName {
    return this.currentDistrict;
  }

  public getActiveSpawn(): NPCSpawnEvent | null {
    return this.activeSpawn;
  }

  public getAccuracyTier(loc?: GeoLocation): AccuracyTier {
    const accuracy = loc ? loc.accuracy : (this.lastLocation?.accuracy ?? 10);
    return getAccuracyTier(accuracy);
  }

  public reportSafetyIssue(lat: number, lon: number, note?: string): void {
    const report = {
      lat,
      lon,
      note: note || 'See koht pole ohutu või ligipääsetav',
      timestamp: new Date().toISOString(),
    };
    this.safetyReports.push(report);
    this.logGameEvent('SAFETY_REPORTED', report);
    soundManager.playTap();
  }

  public checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.profile.lastDailyResetDate !== today) {
      this.profile.lastDailyResetDate = today;
      this.profile.dailyRiskGigsPerformedToday = 0;
      this.profile.todayStepsTurnsGranted = 0;
      this.saveState();
    }
  }

  public recordCashTransaction(
    amount: number,
    category: CashLedgerCategory,
    description: string,
    interactionId?: string
  ): void {
    if (!this.profile.cashLedger) {
      this.profile.cashLedger = [];
    }
    const entry: CashLedgerEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      amount,
      balanceAfter: this.profile.cash,
      category,
      description,
      interactionId,
    };
    this.profile.cashLedger.push(entry);
    if (this.profile.cashLedger.length > 200) {
      this.profile.cashLedger.shift();
    }
  }

  public getEconomyHealthMetrics(): {
    totalInflow: number;
    totalOutflow: number;
    netRaha: number;
    currentBalance: number;
    transactionsCount: number;
  } {
    const ledger = this.profile.cashLedger || [];
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const tx of ledger) {
      if (tx.amount > 0) {
        totalInflow += tx.amount;
      } else {
        totalOutflow += Math.abs(tx.amount);
      }
    }

    return {
      totalInflow,
      totalOutflow,
      netRaha: totalInflow - totalOutflow,
      currentBalance: this.profile.cash,
      transactionsCount: ledger.length,
    };
  }

  public getDistrictProjects(): DistrictProject[] {
    return this.projects;
  }

  public getPlayerNetwork(): PlayerNetwork {
    return this.network;
  }

  public contributeToProject(
    projectId: string,
    cashAmount: number,
    materialsCount: number = 0
  ): { success: boolean; message: string; project?: DistrictProject } {
    this.checkDailyReset();
    const proj = this.projects.find((p) => p.id === projectId);
    if (!proj) {
      return { success: false, message: 'Projekti ei leitud.' };
    }
    if (proj.isUnlocked) {
      return { success: false, message: 'See linnaosa projekt on juba edukalt avatud!' };
    }
    if (cashAmount < 0) {
      return { success: false, message: 'Annetussumma ei saa olla negatiivne.' };
    }
    // Abuse protection: max 50 kr per single donation
    if (cashAmount > 50) {
      return { success: false, message: 'Korraga saab annetada kuni 50 kr (kuritarvituskaitse limiit).' };
    }
    if (cashAmount > 0 && this.profile.cash < cashAmount) {
      return { success: false, message: `Sul pole piisavalt raha (${this.profile.cash}/${cashAmount} kr).` };
    }

    if (cashAmount > 0) {
      this.profile.cash -= cashAmount;
      this.recordCashTransaction(-cashAmount, 'sink_project', `Panus projekti: ${proj.title}`);
      proj.currentCash = Math.min(proj.targetCash, proj.currentCash + cashAmount);
    }

    if (materialsCount > 0) {
      proj.currentMaterials = Math.min(proj.targetMaterials, proj.currentMaterials + materialsCount);
    }

    proj.contributorCount += 1;
    this.network.treasury = (this.network.treasury || 0) + cashAmount;

    // Check project completion
    if (proj.currentCash >= proj.targetCash && proj.currentMaterials >= proj.targetMaterials) {
      proj.isUnlocked = true;
      proj.unlockedAt = new Date().toISOString();
      this.profile.reputation += 15;
      soundManager.playLevelUp();
      eventBus.emit('ACHIEVEMENT_UNLOCKED', { title: proj.title, type: 'project_completed' });
    }

    // Add activity log to network
    this.network.activityLog.unshift({
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      memberId: 'mem-1',
      memberName: `${this.profile.name} (Sina)`,
      action: `Annetas projekti "${proj.title}" ${cashAmount} kr ja ${materialsCount} materjali`,
      amount: cashAmount,
    });
    if (this.network.activityLog.length > 50) {
      this.network.activityLog.pop();
    }

    // Reward modest reputation
    this.profile.reputation += Math.max(1, Math.floor(cashAmount / 10));

    this.saveState();
    return {
      success: true,
      message: proj.isUnlocked
        ? `Projekt "${proj.title}" sai täidetud! Hüve on nüüd aktiivne: ${proj.perkDescription}`
        : `Aitäh! Panustasid ${cashAmount} kr linnaosa arengusse.`,
      project: proj,
    };
  }

  public maintainGear(): { success: boolean; message: string } {
    const cost = 15;
    if (this.profile.cash < cost) {
      return { success: false, message: `Varustuse hoolduseks on vaja ${cost} kr (sul on ${this.profile.cash} kr).` };
    }
    this.profile.cash -= cost;
    this.recordCashTransaction(-cost, 'sink_maintenance', 'Varustuse ja jalanõude tehniline hooldus');

    // Perk: restore companion happiness and grant 1 action turn if below max
    this.companion.happiness = Math.min(100, this.companion.happiness + 20);
    if (this.profile.actionTurns < this.profile.maxActionTurns) {
      this.profile.actionTurns += 1;
    }
    soundManager.playHappy();
    this.saveState();
    return {
      success: true,
      message: 'Jalanõud ja varustus on hooldatud! Kaaslase tuju paranes ja said +1 käigu.',
    };
  }

  public async executeInteraction(command: InteractionCommand): Promise<InteractionExecutionResult> {
    this.checkDailyReset();

    // 1. Idempotency check
    if (this.processedInteractionIds.has(command.interactionId)) {
      return {
        success: false,
        message: 'See tegevus on juba sooritatud (idempotentne kordus).',
        cashDelta: 0,
        reputationDelta: 0,
        turnCost: 0,
      };
    }

    // 2. Find choice in active spawn or fallback
    let choice = this.activeSpawn?.choices?.find((c) => c.id === command.actionId);
    if (!choice && this.activeSpawn) {
      choice = this.activeSpawn.choices?.[0];
    }

    if (!choice) {
      return {
        success: false,
        message: 'Valitud tegevust ei leitud või see pole enam aktiivne.',
        cashDelta: 0,
        reputationDelta: 0,
        turnCost: 0,
      };
    }

    // 3. Daily limit check for risky gig (G in formula)
    if (choice.category === 'risk_gig') {
      const gigLimit = choice.dailyLimit || 3;
      if ((this.profile.dailyRiskGigsPerformedToday || 0) >= gigLimit) {
        return {
          success: false,
          message: `Päevane riskantsete otsade limiit (${gigLimit}/${gigLimit}) on täis. Tule tagasi homme või vali väike töö!`,
          cashDelta: 0,
          reputationDelta: 0,
          turnCost: 0,
        };
      }
    }

    // 4. Action turns verification
    if (this.profile.actionTurns < choice.turnCost) {
      return {
        success: false,
        message: `Sul pole piisavalt käike (${this.profile.actionTurns}/${choice.turnCost}). Kõnni samme või oota käigu taastumist.`,
        cashDelta: 0,
        reputationDelta: 0,
        turnCost: 0,
      };
    }

    // 5. Upfront cash cost check (C in formula)
    const upfrontCost = choice.cashCost || 0;
    if (upfrontCost > 0 && this.profile.cash < upfrontCost) {
      return {
        success: false,
        message: `Sul pole piisavalt raha (${this.profile.cash}/${upfrontCost} kr vajalik ettemaksuks/tooraineks).`,
        cashDelta: 0,
        reputationDelta: 0,
        turnCost: 0,
      };
    }

    // 6. Skill requirements check
    if (choice.requiredSkill) {
      const skillLevel = this.profile.skills[choice.requiredSkill.skill] || 1;
      if (skillLevel < choice.requiredSkill.level) {
        return {
          success: false,
          message: `Nõutav oskus puudub: ${choice.requiredSkill.skill} tase ${choice.requiredSkill.level} (sul on ${skillLevel}).`,
          cashDelta: 0,
          reputationDelta: 0,
          turnCost: 0,
        };
      }
    }

    // 7. Spawn reward cap check
    if (this.activeSpawn && this.activeSpawn.timesInteracted >= this.activeSpawn.rewardCap) {
      return {
        success: false,
        message: 'Selleks tunniks on selle kontaktiga limiit saavutatud. Tule tagasi uuel ajavahemikul.',
        cashDelta: 0,
        reputationDelta: 0,
        turnCost: 0,
      };
    }

    // 8. Deduct action turn cost
    this.profile.actionTurns -= choice.turnCost;

    // 9. Deduct upfront cash cost (C)
    if (upfrontCost > 0) {
      this.profile.cash -= upfrontCost;
      const costCategory: CashLedgerCategory =
        choice.category === 'trade' ? 'trade_cost' : 'gig_cost';
      this.recordCashTransaction(-upfrontCost, costCategory, `Ettemaks/tooraine: ${choice.title}`, command.interactionId);
    }

    // 10. Execute formula: E[Δraha] = p*R - C - (1-p)*L
    const p = choice.successProbability ?? (choice.riskPercent !== undefined ? (100 - choice.riskPercent) / 100 : 1.0);
    const roll = Math.random();
    const isSuccess = roll <= p;

    let cashDelta = -upfrontCost;
    let repDelta = 0;
    let consequence: string | undefined = undefined;
    let message = choice.outcomeText;

    if (isSuccess) {
      const reward = choice.cashReward || 0;
      this.profile.cash += reward;
      cashDelta += reward;
      const incCategory: CashLedgerCategory =
        choice.category === 'small_job'
          ? 'job_income'
          : choice.category === 'trade'
          ? 'trade_income'
          : choice.category === 'risk_gig'
          ? 'gig_income'
          : 'story_reward';
      this.recordCashTransaction(reward, incCategory, `Tasu: ${choice.title}`, command.interactionId);

      repDelta = choice.reputationChange || 0;
      this.profile.reputation += repDelta;
      soundManager.playDiscovery();
    } else {
      // Failure branch: apply failure penalty L
      const loss = choice.failureLoss || 0;
      // Ensure player cash balance cannot drop below zero
      const actualLoss = Math.min(this.profile.cash, loss);
      this.profile.cash -= actualLoss;
      cashDelta -= actualLoss;
      if (actualLoss > 0) {
        this.recordCashTransaction(-actualLoss, 'gig_loss', `Leppetrahv/kahjutasu: ${choice.title}`, command.interactionId);
      }

      repDelta = -2;
      this.profile.reputation = Math.max(0, this.profile.reputation + repDelta);
      consequence = choice.riskDescription || 'Tegevus ebaõnnestus! Kaotasid ettemaksu ja maksid kahjutasu.';
      message = consequence;
      soundManager.playTap();
    }

    // 11. Track limits and stats
    if (choice.category === 'risk_gig') {
      this.profile.dailyRiskGigsPerformedToday = (this.profile.dailyRiskGigsPerformedToday || 0) + 1;
    }
    if (this.activeSpawn) {
      this.activeSpawn.timesInteracted += 1;
    }

    // 12. Mark idempotent interaction ID
    this.processedInteractionIds.add(command.interactionId);

    // Companion reaction
    this.companion.happiness = Math.min(100, Math.max(0, this.companion.happiness + (isSuccess ? 5 : -3)));

    this.logGameEvent('INTERACTION_EXECUTED', {
      command,
      actionId: choice.id,
      category: choice.category,
      isSuccess,
      cashDelta,
      reputationDelta: repDelta,
      turnCost: choice.turnCost,
    });

    this.saveState();
    eventBus.emit('INTERACTION_COMPLETED', { command, choice });

    return {
      success: isSuccess,
      message,
      cashDelta,
      reputationDelta: repDelta,
      turnCost: choice.turnCost,
      consequence,
    };
  }

  public saveState(): void {
    localStore.saveProfile(this.profile);
    localStore.saveCompanion(this.companion);
    localStore.saveInventory(this.inventory);
    localStore.saveNPCs(this.npcs);
    localStore.saveQuests(this.quests);
    localStore.saveAchievements(this.achievements);
    localStore.saveStreetsProgress(this.streets);
    localStore.saveDistrictProjects(this.projects);
    localStore.saveNetwork(this.network);
  }
}

export const gameEngine = new GameEngine();
