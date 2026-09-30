import { GeoLocation } from '../../types/game';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';
import { NPCArchetype, getArchetypeDefinition } from './NPCArchetypes';

export type NPCState =
  | 'SPAWNED'
  | 'WANDERING'
  | 'OBSERVING'
  | 'INTERACTABLE'
  | 'ENGAGED'
  | 'TALKING'
  | 'TRADING'
  | 'COMBAT'
  | 'FLEEING'
  | 'LEAVING'
  | 'DESPAWNED';

export type NPCWalkPhase =
  | 'WALKING'
  | 'PAUSED'
  | 'LOOKING_AROUND'
  | 'WORKING'
  | 'DANCING'
  | 'PATROLLING';

export interface SimulatedNPCInstance {
  id: string; // unique encounter/instance id (e.g. "enc-inst-123")
  archetype: NPCArchetype;
  name: string;
  title: string;
  avatar: string;
  district: string;
  state: NPCState;
  walkPhase?: NPCWalkPhase;
  phaseTimerMs?: number;
  anchorLat: number;
  anchorLon: number;
  currentLat: number;
  currentLon: number;
  headingDegrees: number;
  speedMs: number;
  spawnTimeMs: number;
  expiresAtMs: number;
  isPersistent: boolean;
  persistentNpcId?: string;
  currentHp: number;
  maxHp: number;
  attackPower: number;
  defensePower: number;
  tradeStock: Record<string, number>; // itemId -> count
  groupLeaderId?: string;
  groupMemberCount: number;
  distanceToPlayerMeters: number;
  visibilityTier: 'HIDDEN' | 'RADAR_FAINT' | 'MAP_VISIBLE' | 'INTERACTABLE';
}

export class NPCSimulation {
  /**
   * Updates an NPC instance based on player location, time elapsed, and state machine rules
   */
  public static updateInstance(
    instance: SimulatedNPCInstance,
    playerLoc: GeoLocation,
    nowMs: number = Date.now()
  ): SimulatedNPCInstance {
    if (instance.state === 'DESPAWNED') {
      return instance;
    }

    if (!instance.walkPhase) {
      instance.walkPhase = 'WALKING';
      instance.phaseTimerMs = nowMs + 10000;
    }

    // 1. Check expiration
    if (
      nowMs >= instance.expiresAtMs &&
      instance.state !== 'ENGAGED' &&
      instance.state !== 'TALKING' &&
      instance.state !== 'TRADING' &&
      instance.state !== 'COMBAT'
    ) {
      instance.state = 'LEAVING';
    }

    // 2. Compute distance to player
    const dist = haversineDistanceMeters(
      playerLoc.latitude,
      playerLoc.longitude,
      instance.currentLat,
      instance.currentLon
    );
    instance.distanceToPlayerMeters = Math.round(dist * 10) / 10;

    // 3. Progressive Visibility Tier according to distance gates
    if (dist > 70) {
      instance.visibilityTier = 'HIDDEN';
    } else if (dist > 35) {
      instance.visibilityTier = 'RADAR_FAINT';
    } else if (dist > 12) {
      instance.visibilityTier = 'MAP_VISIBLE';
    } else {
      instance.visibilityTier = 'INTERACTABLE';
    }

    // 4. Lightweight state transitions
    if (instance.state === 'SPAWNED') {
      instance.state = 'WANDERING';
    } else if (instance.state === 'WANDERING') {
      if (dist <= 12) {
        instance.state = 'INTERACTABLE';
      } else if (dist <= 30 && Math.random() < 0.2) {
        instance.state = 'OBSERVING';
      }
    } else if (instance.state === 'OBSERVING') {
      if (dist <= 12) {
        instance.state = 'INTERACTABLE';
      } else if (dist > 40) {
        instance.state = 'WANDERING';
      }
    } else if (instance.state === 'INTERACTABLE') {
      if (dist > 25) {
        instance.state = 'WANDERING';
      }
    } else if (instance.state === 'LEAVING' || instance.state === 'FLEEING') {
      // Step away from player
      const angle = Math.atan2(
        instance.currentLat - playerLoc.latitude,
        instance.currentLon - playerLoc.longitude
      );
      const stepDist = 0.00008; // ~8m step
      instance.currentLat += Math.sin(angle) * stepDist;
      instance.currentLon += Math.cos(angle) * stepDist;

      if (dist > 100) {
        instance.state = 'DESPAWNED';
      }
    }

    // 5. Archetype-specific Local Walking Simulation
    if (instance.state === 'WANDERING' && instance.speedMs > 0) {
      // Rotate walk phases when timer expires
      if (!instance.phaseTimerMs || nowMs > instance.phaseTimerMs) {
        switch (instance.archetype) {
          case 'CIVILIAN':
          case 'TOURIST':
          case 'STUDENT':
            // Walk 15m -> Stop -> Look around -> Continue
            if (instance.walkPhase === 'WALKING') {
              instance.walkPhase = 'LOOKING_AROUND';
              instance.phaseTimerMs = nowMs + 6000;
            } else {
              instance.walkPhase = 'WALKING';
              instance.phaseTimerMs = nowMs + 12000;
              instance.headingDegrees = (instance.headingDegrees + (Math.random() * 60 - 30) + 360) % 360;
            }
            break;

          case 'WORKER':
          case 'NIGHT_WORKER':
            // Walk -> Pause -> Interact with work site -> Walk
            if (instance.walkPhase === 'WALKING') {
              instance.walkPhase = 'WORKING';
              instance.phaseTimerMs = nowMs + 8000;
            } else {
              instance.walkPhase = 'WALKING';
              instance.phaseTimerMs = nowMs + 14000;
            }
            break;

          case 'RAVER':
            // Wander -> Group up -> Dance -> Move
            if (instance.walkPhase === 'WALKING') {
              instance.walkPhase = 'DANCING';
              instance.phaseTimerMs = nowMs + 7000;
            } else {
              instance.walkPhase = 'WALKING';
              instance.phaseTimerMs = nowMs + 10000;
            }
            break;

          case 'STREET_TOUGH':
          case 'SECURITY':
            // Patrol small area / corridor
            instance.walkPhase = 'PATROLLING';
            instance.phaseTimerMs = nowMs + 15000;
            // Reverse direction every patrol cycle
            instance.headingDegrees = (instance.headingDegrees + 180 + (Math.random() * 30 - 15) + 360) % 360;
            break;

          case 'VENDOR':
          case 'BLACK_MARKET_TRADER':
            // Stay within small 5m radius
            instance.walkPhase = 'PAUSED';
            instance.phaseTimerMs = nowMs + 20000;
            break;

          default:
            instance.walkPhase = 'WALKING';
            instance.phaseTimerMs = nowMs + 10000;
            break;
        }
      }

      // If in active walking/patrolling phase, displace coordinates
      const isMoving = instance.walkPhase === 'WALKING' || instance.walkPhase === 'PATROLLING';
      if (isMoving) {
        const distFromAnchor = haversineDistanceMeters(
          instance.anchorLat,
          instance.anchorLon,
          instance.currentLat,
          instance.currentLon
        );

        // Tether to anchor radius
        const maxRadius = instance.archetype === 'VENDOR' ? 6 : 28;
        if (distFromAnchor > maxRadius) {
          instance.headingDegrees =
            (Math.atan2(instance.anchorLat - instance.currentLat, instance.anchorLon - instance.currentLon) * 180) /
            Math.PI;
        }

        const rad = (instance.headingDegrees * Math.PI) / 180;
        const step = 0.000018; // ~2m per simulated tick
        instance.currentLat += Math.cos(rad) * step;
        instance.currentLon += (Math.sin(rad) * step) / Math.cos((instance.currentLat * Math.PI) / 180);
      }
    }

    return instance;
  }
}
