import { DistrictName } from '../../types/game';
import { NPCArchetype } from '../npc/NPCArchetypes';

export interface SeasonalWorldModifier {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO string or MM-DD
  endDate: string;   // ISO string or MM-DD
  districts: DistrictName[];
  encounterModifiers: {
    baseSpawnMultiplier: number;
    featuredArchetype: NPCArchetype;
    rareSpawnBonus: number;
  };
  featuredCollectibles: string[];
  seasonalQuestId?: string;
  npcDialogueFlavor: string[];
  companionReactions: string[];
}

export const SEASONAL_CATALOG: SeasonalWorldModifier[] = [
  {
    id: 'season-spring-bloom',
    name: 'Kalamaja Kevadõis (Spring Bloom Festival)',
    description: 'Tänavad täituvad õitsvate pärnade lõhna ja kohalike püstijalakunstnikega.',
    startDate: '03-20',
    endDate: '05-31',
    districts: ['Kalamaja', 'Kesklinn'],
    encounterModifiers: {
      baseSpawnMultiplier: 1.25,
      featuredArchetype: 'CIVILIAN',
      rareSpawnBonus: 0.1,
    },
    featuredCollectibles: ['street_snacks', 'graffiti_sticker'],
    seasonalQuestId: 'quest-spring-bloom',
    npcDialogueFlavor: [
      'Kevadine päike paistab puitmajade fassaadile!',
      'Kas tundsid õitsvate pärnade lõhna tänaval?',
    ],
    companionReactions: [
      'Pip nuusib kevadõhku ja aevastab pehmelt.',
      'Pip hüpleb lõbusalt pärnaõite vahel.',
    ],
  },
  {
    id: 'season-white-nights',
    name: 'Valged Ööd (White Nights Festival)',
    description: 'Põhjamaised valged ööd hoiavad reivereid ja ööaardeid ärkvel varahommikuni.',
    startDate: '06-01',
    endDate: '08-31',
    districts: ['Noblessner', 'Kalamaja'],
    encounterModifiers: {
      baseSpawnMultiplier: 1.4,
      featuredArchetype: 'RAVER',
      rareSpawnBonus: 0.2,
    },
    featuredCollectibles: ['night_pass', 'neon_powder', 'old_cassette'],
    seasonalQuestId: 'quest-white-nights',
    npcDialogueFlavor: [
      'Päike ei loojugi täielikult! Pidu jätkub mutionu hoovis.',
      'Nendes valgetes öödes pole kellaaegadel mingit tähendust.',
    ],
    companionReactions: [
      'Pip silmad säravad öövalguses nagu kaks väikest tähte.',
      'Pip jälgib sadamatuledest peegelduvat helki.',
    ],
  },
];

export class SeasonalEngine {
  /**
   * Evaluates active seasonal modifiers for a given date
   */
  public static getActiveSeason(date: Date = new Date()): SeasonalWorldModifier | undefined {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const currentMMDD = `${month}-${day}`;

    return SEASONAL_CATALOG.find((s) => {
      if (s.startDate <= s.endDate) {
        return currentMMDD >= s.startDate && currentMMDD <= s.endDate;
      }
      // Wrap-around for winter season crossing Dec-Jan
      return currentMMDD >= s.startDate || currentMMDD <= s.endDate;
    });
  }
}
