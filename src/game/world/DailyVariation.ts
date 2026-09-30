import { DistrictName } from '../../types/game';
import { NPCArchetype } from '../npc/NPCArchetypes';

export interface DailyWorldModifier {
  dayName: string;
  seed: number;
  featuredArchetype: NPCArchetype;
  encounterMultiplier: number;
  specialEventTitle?: string;
  rareSpawnChanceBonus: number;
}

export class DailyVariationEngine {
  private static DAYS = ['Pühapäev', 'Esmaspäev', 'Teisipäev', 'Kolmapäev', 'Neljapäev', 'Reede', 'Laupäev'];

  /**
   * Generates deterministic daily world parameters based on day of week and district
   */
  public static getDailyModifier(district: DistrictName, date: Date = new Date()): DailyWorldModifier {
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = this.DAYS[dayIndex];
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

    let featuredArchetype: NPCArchetype = 'CIVILIAN';
    let specialEventTitle: string | undefined;
    let encounterMultiplier = 1.0;
    let rareSpawnChanceBonus = 0;

    switch (dayIndex) {
      case 1: // Monday: Workers
        featuredArchetype = 'WORKER';
        specialEventTitle = 'Esmaspäevane Töörütm';
        encounterMultiplier = 1.1;
        break;
      case 5: // Friday night: Raver group & Nightlife
        featuredArchetype = 'RAVER';
        specialEventTitle = 'Reedeõhtune Reivirütm';
        encounterMultiplier = 1.4;
        rareSpawnChanceBonus = 0.15;
        break;
      case 0: // Sunday morning: Peaceful Civilians
        featuredArchetype = 'CIVILIAN';
        specialEventTitle = 'Pühapäevane Vaikne Jalutuskäik';
        encounterMultiplier = 0.9;
        break;
      default:
        featuredArchetype = 'TOURIST';
        break;
    }

    return {
      dayName,
      seed,
      featuredArchetype,
      encounterMultiplier,
      specialEventTitle,
      rareSpawnChanceBonus,
    };
  }
}
