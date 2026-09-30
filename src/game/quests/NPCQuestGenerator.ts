import { Quest, DistrictName } from '../../types/game';
import { SimulatedNPCInstance } from '../npc/NPCSimulation';

export class NPCQuestGenerator {
  /**
   * Generates a GPS exploration quest tied to an NPC and district
   */
  public static createQuestFromNPC(
    npc: SimulatedNPCInstance,
    district: DistrictName,
    customTitle?: string
  ): Quest {
    const questId = `quest-npc-${npc.id}-${Date.now()}`;
    const title = customTitle || `Piirkonna vaatlus: ${district}`;
    const targetDistance = 150; // 150 meters walk requirement

    return {
      id: questId,
      title,
      description: `${npc.name} palus sul läbi uurida tänavaid piirkonnas ${district} ja koguda teavet.`,
      type: 'EXPLORATION',
      giverNPCId: npc.id,
      targetDistanceMeters: targetDistance,
      targetCount: targetDistance,
      currentCount: 0,
      status: 'available',
      district,
      rewards: {
        xp: 60,
        itemId: 'street_snacks',
        itemCount: 1,
      },
    };
  }
}
