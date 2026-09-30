import { EncounterContext } from './EncounterContext';
import { NPCArchetype } from '../npc/NPCArchetypes';
import { getDistrictProfile } from '../world/DistrictIdentity';

export class EncounterTables {
  /**
   * Computes weighted archetype probabilities for a given EncounterContext
   */
  public static computeArchetypeWeights(
    context: EncounterContext
  ): Record<NPCArchetype, number> {
    const { worldTime, district, nearbyPlaces, companionPersonality, recentArchetypes, weather } = context;
    const isNighttime = worldTime.phase === 'NIGHT' || worldTime.phase === 'DEEP_NIGHT';
    const isTwilight = worldTime.phase === 'DAWN' || worldTime.phase === 'DUSK';
    const districtProfile = getDistrictProfile(district);

    const weights: Record<NPCArchetype, number> = {
      // Day
      CIVILIAN: 0,
      WORKER: 0,
      STREET_TOUGH: 0,
      VENDOR: 0,
      STUDENT: 0,
      TOURIST: 0,
      RUNNER: 0,
      // Night
      RAVER: 0,
      DRIFTER: 0,
      HOMELESS_WANDERER: 0,
      BLACK_MARKET_TRADER: 0,
      NIGHT_WORKER: 0,
      SECURITY: 0,
      MYSTERY_STRANGER: 0,
    };

    if (isNighttime) {
      // Primary Night Pool
      weights.RAVER = districtProfile.nightArchetypeWeights.RAVER || 1.0;
      weights.DRIFTER = districtProfile.nightArchetypeWeights.DRIFTER || 1.0;
      weights.HOMELESS_WANDERER = districtProfile.nightArchetypeWeights.HOMELESS_WANDERER || 0.8;
      weights.BLACK_MARKET_TRADER = districtProfile.nightArchetypeWeights.BLACK_MARKET_TRADER || 0.9;
      weights.NIGHT_WORKER = districtProfile.nightArchetypeWeights.NIGHT_WORKER || 1.0;
      weights.SECURITY = districtProfile.nightArchetypeWeights.SECURITY || 1.0;
      weights.MYSTERY_STRANGER = districtProfile.nightArchetypeWeights.MYSTERY_STRANGER || 1.2;

      // Small bleed of day workers / toughs in early night
      if (worldTime.phase === 'NIGHT') {
        weights.WORKER = 0.2;
        weights.STREET_TOUGH = 0.4;
      }
    } else if (isTwilight) {
      // Dawn/Dusk blend
      weights.RUNNER = (districtProfile.archetypeWeights.RUNNER || 1.0) * 1.5;
      weights.CIVILIAN = (districtProfile.archetypeWeights.CIVILIAN || 1.0) * 1.0;
      weights.WORKER = (districtProfile.archetypeWeights.WORKER || 1.0) * 1.2;
      weights.STUDENT = (districtProfile.archetypeWeights.STUDENT || 1.0) * 0.8;
      weights.VENDOR = (districtProfile.archetypeWeights.VENDOR || 1.0) * 0.8;
      weights.TOURIST = (districtProfile.archetypeWeights.TOURIST || 1.0) * 0.7;
      weights.STREET_TOUGH = (districtProfile.archetypeWeights.STREET_TOUGH || 1.0) * 0.5;

      // Night bleed in dusk
      if (worldTime.phase === 'DUSK') {
        weights.RAVER = 0.6;
        weights.DRIFTER = 0.5;
        weights.MYSTERY_STRANGER = 0.8;
        weights.SECURITY = 0.7;
      }
    } else {
      // Full Day Pool
      weights.CIVILIAN = districtProfile.archetypeWeights.CIVILIAN || 1.2;
      weights.WORKER = districtProfile.archetypeWeights.WORKER || 1.0;
      weights.STREET_TOUGH = districtProfile.archetypeWeights.STREET_TOUGH || 0.6;
      weights.VENDOR = districtProfile.archetypeWeights.VENDOR || 0.9;
      weights.STUDENT = districtProfile.archetypeWeights.STUDENT || 1.0;
      weights.TOURIST = districtProfile.archetypeWeights.TOURIST || 1.1;
      weights.RUNNER = districtProfile.archetypeWeights.RUNNER || 0.9;
    }

    // 1. POI Modifiers
    nearbyPlaces.forEach((place) => {
      if (place.category === 'park') {
        weights.RUNNER *= 1.4;
        weights.CIVILIAN *= 1.3;
      } else if (place.category === 'cafe') {
        weights.STUDENT *= 1.3;
        weights.VENDOR *= 1.2;
        weights.CIVILIAN *= 1.2;
      } else if (place.category === 'landmark' || place.category === 'cultural') {
        weights.TOURIST *= 1.5;
        weights.VENDOR *= 1.2;
      } else if (place.category === 'secret') {
        weights.MYSTERY_STRANGER *= 1.6;
        weights.BLACK_MARKET_TRADER *= 1.4;
      }
    });

    // 2. Weather Modifiers
    if (weather === 'rain' || weather === 'fog' || weather === 'night_mist') {
      weights.RUNNER *= 0.3;
      weights.TOURIST *= 0.4;
      weights.DRIFTER *= 1.3;
      weights.MYSTERY_STRANGER *= 1.4;
      weights.NIGHT_WORKER *= 1.2;
    }

    // 3. Companion Personality Modifiers
    if (companionPersonality) {
      // Social companion: boosts civilians, students, tourists
      if (companionPersonality.friendliness > 0.6) {
        weights.CIVILIAN *= 1.3;
        weights.STUDENT *= 1.3;
        weights.TOURIST *= 1.2;
      }
      // Brave companion: boosts risky/mysterious encounters
      if (companionPersonality.bravery > 0.6) {
        weights.STREET_TOUGH *= 1.3;
        weights.SECURITY *= 1.2;
        weights.MYSTERY_STRANGER *= 1.3;
      }
      // Shy companion: suppresses aggressive encounters
      if (companionPersonality.bravery < 0.35) {
        weights.STREET_TOUGH *= 0.3;
        weights.SECURITY *= 0.6;
        weights.CIVILIAN *= 1.2;
      }
      // Curious companion: boosts mystery stranger & collectibles
      if (companionPersonality.curiosity > 0.6) {
        weights.MYSTERY_STRANGER *= 1.4;
        weights.BLACK_MARKET_TRADER *= 1.3;
      }
    }

    // 4. Duplicate Suppression Penalty (Anti-Repetition)
    // Most recent archetype gets 0.15x weight, 2nd most recent gets 0.45x, 3rd gets 0.7x
    if (recentArchetypes && recentArchetypes.length > 0) {
      if (recentArchetypes[0] && weights[recentArchetypes[0]]) {
        weights[recentArchetypes[0]] *= 0.15;
      }
      if (recentArchetypes[1] && weights[recentArchetypes[1]]) {
        weights[recentArchetypes[1]] *= 0.45;
      }
      if (recentArchetypes[2] && weights[recentArchetypes[2]]) {
        weights[recentArchetypes[2]] *= 0.70;
      }
    }

    return weights;
  }
}
