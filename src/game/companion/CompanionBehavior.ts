import { DistrictName } from '../../types/game';
import { NPCArchetype } from '../npc/NPCArchetypes';

export type EvolutionPath = 'UNEVOLVED' | 'EXPLORER' | 'SOCIAL' | 'COLLECTOR' | 'NIGHTLING' | 'MYSTIC';

export interface CompanionStats {
  mood: number;       // 0 - 100
  energy: number;     // 0 - 100
  curiosity: number;  // 0 - 100
  bond: number;       // 0 - 100
  
  // Behavioral tracking counters
  streetsDiscoveredCount: number;
  npcInteractionsCount: number;
  itemsFoundCount: number;
  nightExplorationMinutes: number;
  rareEventsEncounteredCount: number;

  // Preferences developed organically
  favoriteDistrict?: DistrictName;
  favoritePlaceType?: string;
  favoriteNPCType?: NPCArchetype;
  favoriteTimePhase?: string;

  // Evolution status
  evolution: EvolutionPath;
  evolutionUnlockedAt?: string;

  districtVisitCounts: Record<string, number>;
  timePhaseCounts: Record<string, number>;
}

export interface CompanionSuggestion {
  text: string;
  expression: 'happy' | 'curious' | 'excited' | 'sleepy' | 'mysterious';
  targetDistrict?: DistrictName;
}

export class CompanionBehaviorEngine {
  private stats: CompanionStats;

  constructor(initialStats?: Partial<CompanionStats>) {
    this.stats = {
      mood: initialStats?.mood ?? 85,
      energy: initialStats?.energy ?? 90,
      curiosity: initialStats?.curiosity ?? 50,
      bond: initialStats?.bond ?? 30,
      streetsDiscoveredCount: initialStats?.streetsDiscoveredCount ?? 0,
      npcInteractionsCount: initialStats?.npcInteractionsCount ?? 0,
      itemsFoundCount: initialStats?.itemsFoundCount ?? 0,
      nightExplorationMinutes: initialStats?.nightExplorationMinutes ?? 0,
      rareEventsEncounteredCount: initialStats?.rareEventsEncounteredCount ?? 0,
      favoriteDistrict: initialStats?.favoriteDistrict,
      favoritePlaceType: initialStats?.favoritePlaceType,
      favoriteNPCType: initialStats?.favoriteNPCType,
      favoriteTimePhase: initialStats?.favoriteTimePhase,
      evolution: initialStats?.evolution ?? 'UNEVOLVED',
      evolutionUnlockedAt: initialStats?.evolutionUnlockedAt,
      districtVisitCounts: initialStats?.districtVisitCounts ?? {},
      timePhaseCounts: initialStats?.timePhaseCounts ?? {},
    };
  }

  public getStats(): CompanionStats {
    return { ...this.stats };
  }

  /**
   * Called when player moves/explores streets
   */
  public recordStreetTraversal(district: DistrictName, isNight: boolean): void {
    this.stats.curiosity = Math.min(100, this.stats.curiosity + 2);
    this.stats.bond = Math.min(100, this.stats.bond + 0.5);

    this.stats.districtVisitCounts[district] = (this.stats.districtVisitCounts[district] || 0) + 1;

    if (isNight) {
      this.stats.nightExplorationMinutes += 2;
      this.stats.timePhaseCounts['NIGHT'] = (this.stats.timePhaseCounts['NIGHT'] || 0) + 1;
    } else {
      this.stats.timePhaseCounts['DAY'] = (this.stats.timePhaseCounts['DAY'] || 0) + 1;
    }

    this.updatePreferences();
    this.evaluateEvolution();
  }

  /**
   * Called when a new street is discovered
   */
  public recordStreetDiscovered(): void {
    this.stats.streetsDiscoveredCount += 1;
    this.stats.mood = Math.min(100, this.stats.mood + 5);
    this.stats.curiosity = Math.min(100, this.stats.curiosity + 5);
    this.evaluateEvolution();
  }

  /**
   * Called when player interacts with an NPC
   */
  public recordNPCInteraction(npcType: NPCArchetype): void {
    this.stats.npcInteractionsCount += 1;
    this.stats.bond = Math.min(100, this.stats.bond + 1);
    this.evaluateEvolution();
  }

  /**
   * Called when player finds an item or trade
   */
  public recordItemFound(): void {
    this.stats.itemsFoundCount += 1;
    this.evaluateEvolution();
  }

  /**
   * Called when a rare/legendary event occurs
   */
  public recordRareEvent(): void {
    this.stats.rareEventsEncounteredCount += 1;
    this.evaluateEvolution();
  }

  /**
   * Update Pip's organic preferences based on play history
   */
  private updatePreferences(): void {
    // Favorite district = highest visit count
    let topDist: DistrictName | undefined;
    let maxVisits = 0;
    for (const [dist, count] of Object.entries(this.stats.districtVisitCounts)) {
      if (count > maxVisits && count >= 5) {
        maxVisits = count;
        topDist = dist as DistrictName;
      }
    }
    if (topDist) this.stats.favoriteDistrict = topDist;

    // Favorite time phase
    if ((this.stats.timePhaseCounts['NIGHT'] || 0) > (this.stats.timePhaseCounts['DAY'] || 0) + 10) {
      this.stats.favoriteTimePhase = 'Ööhämarus';
    } else {
      this.stats.favoriteTimePhase = 'Päevavalgus';
    }
  }

  /**
   * Behavioral evolution trigger checking playstyle thresholds
   */
  public evaluateEvolution(): EvolutionPath {
    if (this.stats.evolution !== 'UNEVOLVED') return this.stats.evolution;

    if (this.stats.streetsDiscoveredCount >= 10) {
      this.stats.evolution = 'EXPLORER';
    } else if (this.stats.npcInteractionsCount >= 15) {
      this.stats.evolution = 'SOCIAL';
    } else if (this.stats.itemsFoundCount >= 20) {
      this.stats.evolution = 'COLLECTOR';
    } else if (this.stats.nightExplorationMinutes >= 30) {
      this.stats.evolution = 'NIGHTLING';
    } else if (this.stats.rareEventsEncounteredCount >= 3) {
      this.stats.evolution = 'MYSTIC';
    }

    if (this.stats.evolution !== 'UNEVOLVED') {
      this.stats.evolutionUnlockedAt = new Date().toISOString();
    }

    return this.stats.evolution;
  }

  /**
   * Generate an organic suggestion or observation from Pip
   */
  public generateSuggestion(currentDistrict: DistrictName, isNight: boolean): CompanionSuggestion {
    if (this.stats.favoriteDistrict && currentDistrict !== this.stats.favoriteDistrict) {
      return {
        text: `Pip sosistab: "Mulle meeldib väga ${this.stats.favoriteDistrict}! Suundume vahelduseks sinna?"`,
        expression: 'excited',
        targetDistrict: this.stats.favoriteDistrict,
      };
    }

    if (isNight && this.stats.evolution === 'NIGHTLING') {
      return {
        text: 'Pip silmad säravad ööhämaruses: "Öine linn on meie päralt, vaatame salapaiku!"',
        expression: 'mysterious',
      };
    }

    if (this.stats.curiosity > 70) {
      return {
        text: 'Pip nuusib õhku: "Siin nurga taga on midagi avastamata, tunnen seda!"',
        expression: 'curious',
      };
    }

    return {
      text: `Pip tammub kõrval: "Toredad tänavad linnaosas ${currentDistrict}! Jätkame kõndimist."`,
      expression: 'happy',
    };
  }
}
