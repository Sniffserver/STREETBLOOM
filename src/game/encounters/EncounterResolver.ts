import {
  GeoLocation,
  Place,
  StreetSegment,
  Companion,
  DistrictName,
} from '../../types/game';
import { EncounterCooldown } from './EncounterCooldown';
import { EncounterDirector, EncounterDecision } from './EncounterDirector';
import { EncounterContext } from './EncounterContext';
import { WorldClock } from '../world/WorldClock';
import { NPCArchetype, getArchetypeDefinition } from '../npc/NPCArchetypes';
import { NPCManager } from '../npc/NPCManager';
import { SimulatedNPCInstance } from '../npc/NPCSimulation';

export interface EncounterResolutionResult {
  spawned: boolean;
  instance?: SimulatedNPCInstance;
  decision: EncounterDecision;
  companionComment?: string;
}

export class EncounterResolver {
  private cooldown: EncounterCooldown;
  private director: EncounterDirector;
  private recentArchetypes: NPCArchetype[] = [];
  private recentEncounterIds: string[] = [];

  constructor(
    minMovement = 35,
    cooldownSec = 50,
    director?: EncounterDirector
  ) {
    this.cooldown = new EncounterCooldown(minMovement, cooldownSec);
    this.director = director || new EncounterDirector();
  }

  public getCooldown(): EncounterCooldown {
    return this.cooldown;
  }

  public getDirector(): EncounterDirector {
    return this.director;
  }

  public getRecentArchetypes(): NPCArchetype[] {
    return [...this.recentArchetypes];
  }

  /**
   * Evaluates and resolves encounters when meaningful movement occurs
   */
  public processStep(
    playerLoc: GeoLocation,
    movementDeltaMeters: number,
    district: DistrictName,
    nearbyStreets: StreetSegment[],
    nearbyPlaces: Place[],
    companion: Companion,
    playerLevel: number,
    npcManager: NPCManager,
    weather?: string
  ): EncounterResolutionResult {
    // 1. Accumulate movement
    this.cooldown.addMovement(movementDeltaMeters);

    // 2. Check cooldown gate
    const readyCheck = this.cooldown.isReadyForEncounter();
    if (!readyCheck.ready) {
      return {
        spawned: false,
        decision: {
          type: 'NO_ENCOUNTER',
          reason: readyCheck.reason === 'cooldown_active' ? 'cooldown_active' : 'insufficient_movement',
          details: `Ooterežiim: ${readyCheck.remainingSeconds}s / ${readyCheck.remainingMeters}m`,
        },
      };
    }

    // 3. Build Encounter Context
    const worldTime = WorldClock.getTimeInfo(playerLoc.latitude, playerLoc.longitude);
    const activeInstances = npcManager.getActiveInstances();

    const context: EncounterContext = {
      location: playerLoc,
      movement: {
        distanceSinceLastSpawnMeters: this.cooldown.getAccumulatedMovement(),
        recentSpeedMs: playerLoc.speed || 1.1,
        headingDegrees: playerLoc.heading,
        accumulatedExplorationMeters: this.cooldown.getAccumulatedMovement(),
      },
      worldTime,
      district,
      nearbyPlaces,
      nearbyStreets,
      playerLevel,
      explorationLevel: playerLevel,
      companionMood: companion.currentThought || 'uudishimulik',
      companionPersonality: companion.personality,
      recentEncounterIds: [...this.recentEncounterIds],
      recentArchetypes: [...this.recentArchetypes],
      weather,
      activeNpcCount: activeInstances.length,
    };

    // 4. Evaluate through Director
    const decision = this.director.evaluate(context);

    if (decision.type === 'NO_ENCOUNTER') {
      return {
        spawned: false,
        decision,
      };
    }

    // 5. Spawn instance via NPCManager
    const instance = npcManager.spawnProceduralNPC(
      decision.archetype,
      decision.spawnLocation.latitude,
      decision.spawnLocation.longitude,
      district,
      decision.spawnLocation.headingDegrees,
      decision.groupCount
    );

    // 6. Record history for duplicate suppression
    this.recentArchetypes.unshift(decision.archetype);
    if (this.recentArchetypes.length > 5) {
      this.recentArchetypes.pop();
    }

    this.recentEncounterIds.unshift(instance.id);
    if (this.recentEncounterIds.length > 10) {
      this.recentEncounterIds.pop();
    }

    // 7. Reset cooldown and movement
    this.cooldown.recordSpawn();

    // 8. Generate contextual companion comment
    const companionComment = this.generateCompanionComment(companion, decision.archetype, instance.name);

    return {
      spawned: true,
      instance,
      decision,
      companionComment,
    };
  }

  private generateCompanionComment(
    companion: Companion,
    archetype: NPCArchetype,
    npcName: string
  ): string {
    const def = getArchetypeDefinition(archetype);
    const cName = companion.name || 'Pip';

    if (companion.personality?.curiosity > 0.6) {
      return `${cName} kikitab kõrvu: "Vaata ettepoole! Seal paistab ${def.label.toLowerCase()} (${npcName})."`;
    }
    if (companion.personality?.bravery > 0.6 && archetype === 'STREET_TOUGH') {
      return `${cName} astub julgelt ette: "Tänavahunt teel! Hoiame pea püsti."`;
    }
    if (archetype === 'RAVER') {
      return `${cName} noogutab muusikarütmis: "Kuule, sealt kostub bassi... ${npcName} on lähedal!"`;
    }
    if (archetype === 'VENDOR' || archetype === 'BLACK_MARKET_TRADER') {
      return `${cName} nuusutab õhku: "Kaupmees on läheduses! Ehk on tal midagi põnevat?"`;
    }
    return `${cName} märkab kedagi eespool: "${npcName} (${def.label}) jalutab meie suunas."`;
  }
}

export const defaultEncounterResolver = new EncounterResolver();
