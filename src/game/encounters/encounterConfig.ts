export interface EncounterConfig {
  minMovementMeters: number;
  minCooldownSeconds: number;
  preferredCooldownSeconds: number;
  activeNpcCap: number;
  npcLifetimeSecondsMin: number;
  npcLifetimeSecondsMax: number;
  spawnRangeMinMeters: number;
  spawnRangeMaxMeters: number;
  baseProbability: number;
}

export const DEFAULT_ENCOUNTER_CONFIG: EncounterConfig = {
  minMovementMeters: 30,
  minCooldownSeconds: 45,
  preferredCooldownSeconds: 90,
  activeNpcCap: 3,
  npcLifetimeSecondsMin: 60,
  npcLifetimeSecondsMax: 300,
  spawnRangeMinMeters: 25,
  spawnRangeMaxMeters: 70,
  baseProbability: 0.15,
};
