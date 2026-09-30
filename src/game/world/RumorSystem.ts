import { DistrictName } from '../../types/game';

export interface Rumor {
  id: string;
  statement: string;
  sourceNPCName: string;
  targetDistrict: DistrictName;
  targetStreetName?: string;
  relatedNPCName?: string;
  confidence: number; // 0.0 to 1.0
  isTrue: boolean;
  discoveredAt: string;
}

export const SEED_RUMORS: Rumor[] = [
  {
    id: 'rumor-blue-light',
    statement: 'Telliskivi vana ladustamisplatsi kohal on viimasel ajal nähtud kummalist sinakat kuma.',
    sourceNPCName: 'Jaanus',
    targetDistrict: 'Kalamaja',
    targetStreetName: 'Telliskivi tänav',
    relatedNPCName: 'Marta',
    confidence: 0.85,
    isTrue: true,
    discoveredAt: new Date().toISOString(),
  },
  {
    id: 'rumor-cassette-vault',
    statement: 'Keegi olevat peitnud Kalamaja keldrivõlvi 90ndate reivi kassetilindi.',
    sourceNPCName: 'Marta',
    targetDistrict: 'Kalamaja',
    relatedNPCName: 'Sergei',
    confidence: 0.7,
    isTrue: true,
    discoveredAt: new Date().toISOString(),
  },
];

export class RumorEngine {
  private rumors: Rumor[];

  constructor(initialRumors?: Rumor[]) {
    this.rumors = initialRumors || [...SEED_RUMORS];
  }

  public getRumors(): Rumor[] {
    return this.rumors;
  }

  public getRumorsForNPC(npcName: string): Rumor[] {
    return this.rumors.filter((r) => r.sourceNPCName === npcName || r.relatedNPCName === npcName);
  }

  public addRumor(rumor: Omit<Rumor, 'id' | 'discoveredAt'>): Rumor {
    const item: Rumor = {
      ...rumor,
      id: `rumor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      discoveredAt: new Date().toISOString(),
    };
    this.rumors.push(item);
    return item;
  }
}
