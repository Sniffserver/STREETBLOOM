import { NPCArchetype } from '../npc/NPCArchetypes';

export type EncounterRarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export interface RarityDistribution {
  tier: EncounterRarityTier;
  chance: number; // e.g. 0.70, 0.20, 0.08, 0.02
}

export const RARITY_DISTRIBUTION: RarityDistribution[] = [
  { tier: 'COMMON', chance: 0.70 },
  { tier: 'UNCOMMON', chance: 0.20 },
  { tier: 'RARE', chance: 0.08 },
  { tier: 'LEGENDARY', chance: 0.02 },
];

export const ARCHETYPE_RARITY_MAP: Record<NPCArchetype, EncounterRarityTier> = {
  CIVILIAN: 'COMMON',
  WORKER: 'COMMON',
  TOURIST: 'COMMON',
  STUDENT: 'COMMON',
  RUNNER: 'COMMON',
  RAVER: 'COMMON',

  STREET_TOUGH: 'UNCOMMON',
  VENDOR: 'UNCOMMON',
  NIGHT_WORKER: 'UNCOMMON',
  SECURITY: 'UNCOMMON',

  DRIFTER: 'RARE',
  HOMELESS_WANDERER: 'RARE',
  BLACK_MARKET_TRADER: 'RARE',
  MYSTERY_STRANGER: 'LEGENDARY',
};

export class EncounterRarity {
  /**
   * Rolls a rarity tier using 70 / 20 / 8 / 2 probabilities
   */
  public static rollTier(rngValue: number = Math.random()): EncounterRarityTier {
    if (rngValue < 0.70) return 'COMMON';
    if (rngValue < 0.90) return 'UNCOMMON';
    if (rngValue < 0.98) return 'RARE';
    return 'LEGENDARY';
  }
}
