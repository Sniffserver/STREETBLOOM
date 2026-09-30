import { FactionId } from './FactionDefinition';

export interface FactionStandingInfo {
  tier: 'HOSTILE' | 'SUSPICIOUS' | 'NEUTRAL' | 'FRIENDLY' | 'HONORED';
  label: string;
  priceMultiplier: number;
  questAvailabilityBonus: number;
  encounterSpawnMultiplier: number;
}

export class FactionReputation {
  public static getStandingInfo(points: number): FactionStandingInfo {
    if (points <= -50) {
      return {
        tier: 'HOSTILE',
        label: 'Vaenulik',
        priceMultiplier: 1.45,
        questAvailabilityBonus: -2,
        encounterSpawnMultiplier: 0.5,
      };
    }
    if (points < -10) {
      return {
        tier: 'SUSPICIOUS',
        label: 'Kahtlustav',
        priceMultiplier: 1.2,
        questAvailabilityBonus: -1,
        encounterSpawnMultiplier: 0.8,
      };
    }
    if (points < 30) {
      return {
        tier: 'NEUTRAL',
        label: 'Neutraalne',
        priceMultiplier: 1.0,
        questAvailabilityBonus: 0,
        encounterSpawnMultiplier: 1.0,
      };
    }
    if (points < 70) {
      return {
        tier: 'FRIENDLY',
        label: 'Sõbralik',
        priceMultiplier: 0.88,
        questAvailabilityBonus: 1,
        encounterSpawnMultiplier: 1.2,
      };
    }
    return {
      tier: 'HONORED',
      label: 'Austatud',
      priceMultiplier: 0.78,
      questAvailabilityBonus: 2,
      encounterSpawnMultiplier: 1.4,
    };
  }

  public static clampPoints(points: number): number {
    return Math.max(-100, Math.min(100, points));
  }
}
