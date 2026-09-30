import { DistrictName } from '../../types/game';

export interface FogStatus {
  mapFogPercent: number;        // 0 to 100 (100 = completely clear map)
  knowledgeFogPercent: number;  // 0 to 100 (100 = full historical knowledge unlocked)
  npcFogPercent: number;        // 0 to 100 (100 = all local character backstories unlocked)
  mysteryFogPercent: number;    // 0 to 100 (100 = all local mysteries unraveled)
}

export class FogEngine {
  public static calculateFogStatus(
    district: DistrictName,
    discoveredStreetsCount: number,
    totalStreetsCount: number,
    districtReputationPoints: number,
    solvedMysteriesCount: number
  ): FogStatus {
    const total = Math.max(1, totalStreetsCount);
    const mapFogPercent = Math.min(100, Math.round((discoveredStreetsCount / total) * 100));
    const knowledgeFogPercent = Math.min(100, districtReputationPoints * 2);
    const npcFogPercent = Math.min(100, Math.round((districtReputationPoints / 50) * 100));
    const mysteryFogPercent = Math.min(100, solvedMysteriesCount * 50);

    return {
      mapFogPercent,
      knowledgeFogPercent,
      npcFogPercent,
      mysteryFogPercent,
    };
  }
}
