import { DistrictName, StreetSegment } from '../../types/game';
import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { FICTIONAL_CONTRABAND_CATALOG } from '../trading/ShopInventory';

export interface LocationQuest {
  id: string;
  title: string;
  description: string;
  targetDistrict: DistrictName;
  targetStreetName: string;
  targetNPCName: string;
  requiredItemName?: string;
  rewardXP: number;
  rewardCash: number;
  isCompleted: boolean;
}

export class LocationQuestEngine {
  /**
   * Generates a context-grounded narrative quest dynamically from player's discovered streets and nearby NPCs
   */
  public static generateLocationQuest(
    discoveredStreets: StreetSegment[],
    nearbyNPCs: SimulatedNPCInstance[]
  ): LocationQuest | null {
    if (discoveredStreets.length === 0 || nearbyNPCs.length === 0) {
      return null;
    }

    const street = discoveredStreets[Math.floor(Math.random() * discoveredStreets.length)];
    const npc = nearbyNPCs[Math.floor(Math.random() * nearbyNPCs.length)];
    const itemKey = Object.keys(FICTIONAL_CONTRABAND_CATALOG)[0];
    const item = FICTIONAL_CONTRABAND_CATALOG[itemKey];

    return {
      id: `lquest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${street.name}: ${npc.name} Mälestuse Otsing`,
      description: `${npc.name} mäletab et talle jättis midagi olulist tänavale ${street.name}. Otsi üles ese "${item?.name || 'mälestusese'}"!`,
      targetDistrict: street.district || 'Kalamaja',
      targetStreetName: street.name,
      targetNPCName: npc.name,
      requiredItemName: item?.name,
      rewardXP: 60,
      rewardCash: 15,
      isCompleted: false,
    };
  }
}
