import { EncounterContext } from './EncounterContext';
import { NPCArchetype } from '../npc/NPCArchetypes';
import { EncounterTables } from './EncounterTables';
import { SpawnResolver, ResolvedSpawnLocation } from './SpawnResolver';
import { getDistrictProfile } from '../world/DistrictIdentity';
import { SeededRNG } from './SeededRng';
import { DEFAULT_ENCOUNTER_CONFIG, EncounterConfig } from './encounterConfig';

export { SeededRNG };

export type EncounterDecision =
  | {
      type: 'NO_ENCOUNTER';
      reason:
        | 'cap_reached'
        | 'insufficient_movement'
        | 'cooldown_active'
        | 'stationary'
        | 'roll_failed'
        | 'no_safe_spawn_point';
      details?: string;
    }
  | {
      type: 'SPAWN_ENCOUNTER';
      archetype: NPCArchetype;
      spawnLocation: ResolvedSpawnLocation;
      groupCount: number;
      reason: string;
      confidence: number;
    };

export class EncounterDirector {
  private rng: SeededRNG;
  private config: EncounterConfig;

  constructor(seed?: number, config: EncounterConfig = DEFAULT_ENCOUNTER_CONFIG) {
    this.rng = new SeededRNG(seed !== undefined ? seed : Date.now());
    this.config = config;
  }

  public setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }

  /**
   * Authoritative Director Evaluation: evaluates context and decides whether to spawn an encounter
   */
  public evaluate(context: EncounterContext): EncounterDecision {
    const { movement, activeNpcCount, companionPersonality, district, worldTime, nearbyPlaces, recentEncounterIds } = context;

    // 1. Active NPC Cap Check
    if (activeNpcCount >= this.config.activeNpcCap) {
      return {
        type: 'NO_ENCOUNTER',
        reason: 'cap_reached',
        details: `Aktiivsete kohtumiste limiit (${activeNpcCount}/${this.config.activeNpcCap}) on täis.`,
      };
    }

    // 2. Stationary Check
    if (
      movement.distanceSinceLastSpawnMeters < 15 &&
      movement.recentSpeedMs < 0.2
    ) {
      return {
        type: 'NO_ENCOUNTER',
        reason: 'stationary',
        details: 'Mängija seisab paigal; uusi tegelasi ei genereerita.',
      };
    }

    // 3. Minimum movement exploration requirement
    if (movement.distanceSinceLastSpawnMeters < this.config.minMovementMeters) {
      return {
        type: 'NO_ENCOUNTER',
        reason: 'insufficient_movement',
        details: `Vajalik vähemalt ${this.config.minMovementMeters}m avastamisliikumist (läbitud ${Math.round(movement.distanceSinceLastSpawnMeters)}m).`,
      };
    }

    // 4. Multi-factor probability model calculation:
    // P(encounter) = base * movement * time * district * place * companion * recentPenalty * densityPenalty
    const baseChance = this.config.baseProbability; // e.g. 0.15

    // Movement Factor: normalized against min movement, capped at 2.0
    const movementFactor = Math.min(2.0, Math.max(1.0, movement.distanceSinceLastSpawnMeters / this.config.minMovementMeters));

    // World-time Factor
    let timeFactor = 1.0;
    if (worldTime.phase === 'NIGHT' || worldTime.phase === 'DEEP_NIGHT') {
      timeFactor = 1.25;
    } else if (worldTime.phase === 'DUSK' || worldTime.phase === 'DAWN') {
      timeFactor = 1.15;
    }

    // District Factor
    const districtProfile = getDistrictProfile(district);
    const districtFactor = districtProfile.baseEncounterMultiplier;

    // Place / Environment Factor
    let placeFactor = 1.0;
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      placeFactor = 1.15;
    }

    // Companion Factor
    let companionFactor = 1.0;
    if (companionPersonality && companionPersonality.curiosity > 0.6) {
      companionFactor = 1.25;
    }

    // Recent-encounter Penalty
    let recentPenalty = 1.0;
    if (recentEncounterIds && recentEncounterIds.length > 0) {
      const recentCount = recentEncounterIds.length;
      recentPenalty = Math.max(0.5, 1.0 - recentCount * 0.15);
    }

    // Session-density Penalty
    const densityPenalty = Math.max(0.2, 1.0 - (activeNpcCount / this.config.activeNpcCap) * 0.5);

    // Final probability product, capped at 0.85
    const computedProbability = Math.min(
      0.85,
      baseChance *
        movementFactor *
        timeFactor *
        districtFactor *
        placeFactor *
        companionFactor *
        recentPenalty *
        densityPenalty
    );

    const spawnRoll = this.rng.next();
    if (spawnRoll > computedProbability) {
      return {
        type: 'NO_ENCOUNTER',
        reason: 'roll_failed',
        details: `Kohtumise tõenäosusproov ebaõnnestus (roll: ${Math.round(spawnRoll * 100)}% > lävend ${Math.round(computedProbability * 100)}%).`,
      };
    }

    // 5. Select Archetype from weighted table
    const weights = EncounterTables.computeArchetypeWeights(context);
    const selectedArchetype = this.weightedSelect(weights);

    // 6. Resolve Safe Spawn Location
    const rngHeading = this.rng.next();
    const rngDist = this.rng.next();
    const rngGroup = this.rng.next();

    const spawnLocation = SpawnResolver.resolveSpawnPosition(
      context.location,
      context.nearbyStreets,
      rngHeading,
      rngDist,
      rngGroup
    );

    if (!spawnLocation) {
      return {
        type: 'NO_ENCOUNTER',
        reason: 'no_safe_spawn_point',
        details: 'Turvalist ja ligipääsetavat tänavakoordinaati ei leitud.',
      };
    }

    return {
      type: 'SPAWN_ENCOUNTER',
      archetype: selectedArchetype,
      spawnLocation,
      groupCount: spawnLocation.groupCount,
      reason: `Avastusretk linnaosas ${district} (${context.worldTime.phaseLabel}): kohatud ${selectedArchetype}`,
      confidence: Math.round((1 - spawnRoll) * 100) / 100,
    };
  }

  private weightedSelect(weights: Record<NPCArchetype, number>): NPCArchetype {
    const entries = Object.entries(weights) as [NPCArchetype, number][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);

    if (totalWeight <= 0) {
      return 'CIVILIAN';
    }

    let randomVal = this.rng.next() * totalWeight;
    for (const [arch, weight] of entries) {
      if (weight <= 0) continue;
      if (randomVal <= weight) {
        return arch;
      }
      randomVal -= weight;
    }

    return entries[0][0];
  }
}

export const defaultEncounterDirector = new EncounterDirector();
