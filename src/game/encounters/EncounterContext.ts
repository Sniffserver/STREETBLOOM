import {
  GeoLocation,
  Place,
  StreetSegment,
  DistrictName,
  PersonalityTraits,
} from '../../types/game';
import { WorldTimeInfo } from '../world/WorldClock';
import { NPCArchetype } from '../npc/NPCArchetypes';

export interface EncounterMovementContext {
  distanceSinceLastSpawnMeters: number;
  recentSpeedMs: number;
  headingDegrees: number | null;
  accumulatedExplorationMeters: number;
}

export interface EncounterContext {
  location: GeoLocation;
  movement: EncounterMovementContext;
  worldTime: WorldTimeInfo;
  district: DistrictName;
  nearbyPlaces: Place[];
  nearbyStreets: StreetSegment[];
  playerLevel: number;
  explorationLevel: number;
  companionMood: string;
  companionPersonality?: PersonalityTraits;
  recentEncounterIds: string[];
  recentArchetypes: NPCArchetype[];
  weather?: string;
  activeNpcCount: number;
}
