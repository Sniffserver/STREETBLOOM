import { DistrictName } from '../../types/game';
import { DISTRICT_IDENTITIES } from './DistrictIdentity';

export type DistrictStandingTier =
  | 'STRANGER'           // 0 - 14
  | 'KNOWN_LOCAL'        // 15 - 29
  | 'RESPECTED_RESIDENT' // 30 - 49
  | 'NEIGHBORHOOD_HERO'  // 50 - 74
  | 'DISTRICT_LEGEND';   // 75+

export interface DistrictPerks {
  discountPercent: number;          // 0 to 25
  rareSpawnMultiplier: number;      // 1.0 to 2.5
  unlocksSecretLocations: boolean;
  unlocksExclusiveQuests: boolean;
  specialDialogueUnlocked: boolean;
  titleLabel: string;
}

export interface DistrictStandingInfo {
  district: DistrictName;
  reputationPoints: number;
  tier: DistrictStandingTier;
  perks: DistrictPerks;
}

export class DistrictReputationEngine {
  private reputationMap: Record<DistrictName, number>;

  constructor(initialReputation?: Partial<Record<DistrictName, number>>) {
    this.reputationMap = {
      Kesklinn: initialReputation?.Kesklinn ?? 15,
      Kalamaja: initialReputation?.Kalamaja ?? 34,
      Kadriorg: initialReputation?.Kadriorg ?? 10,
      Kopli: initialReputation?.Kopli ?? 5,
      Kristiine: initialReputation?.Kristiine ?? 12,
      Mustamäe: initialReputation?.Mustamäe ?? 8,
      Lasnamäe: initialReputation?.Lasnamäe ?? 6,
      Nõmme: initialReputation?.Nõmme ?? 14,
      Pirita: initialReputation?.Pirita ?? 10,
      Haabersti: initialReputation?.Haabersti ?? 8,
    };
  }

  public getReputation(district: DistrictName): number {
    return this.reputationMap[district] || 0;
  }

  public getAllReputations(): Record<DistrictName, number> {
    return { ...this.reputationMap };
  }

  public addReputation(district: DistrictName, points: number): {
    oldPoints: number;
    newPoints: number;
    tierUpgraded: boolean;
    standing: DistrictStandingInfo;
  } {
    const oldPoints = this.getReputation(district);
    const newPoints = Math.min(100, Math.max(0, oldPoints + points));
    this.reputationMap[district] = newPoints;

    const oldTier = this.getStandingTier(oldPoints);
    const newTier = this.getStandingTier(newPoints);

    return {
      oldPoints,
      newPoints,
      tierUpgraded: oldTier !== newTier,
      standing: this.getStandingInfo(district),
    };
  }

  public getStandingTier(points: number): DistrictStandingTier {
    if (points >= 75) return 'DISTRICT_LEGEND';
    if (points >= 50) return 'NEIGHBORHOOD_HERO';
    if (points >= 30) return 'RESPECTED_RESIDENT';
    if (points >= 15) return 'KNOWN_LOCAL';
    return 'STRANGER';
  }

  public getStandingInfo(district: DistrictName): DistrictStandingInfo {
    const points = this.getReputation(district);
    const tier = this.getStandingTier(points);

    let perks: DistrictPerks;

    switch (tier) {
      case 'DISTRICT_LEGEND':
        perks = {
          discountPercent: 25,
          rareSpawnMultiplier: 2.5,
          unlocksSecretLocations: true,
          unlocksExclusiveQuests: true,
          specialDialogueUnlocked: true,
          titleLabel: 'Linnaosa Legend',
        };
        break;
      case 'NEIGHBORHOOD_HERO':
        perks = {
          discountPercent: 20,
          rareSpawnMultiplier: 2.0,
          unlocksSecretLocations: true,
          unlocksExclusiveQuests: true,
          specialDialogueUnlocked: true,
          titleLabel: 'Kvartali Kangelane',
        };
        break;
      case 'RESPECTED_RESIDENT':
        perks = {
          discountPercent: 12,
          rareSpawnMultiplier: 1.5,
          unlocksSecretLocations: true,
          unlocksExclusiveQuests: true,
          specialDialogueUnlocked: true,
          titleLabel: 'Austatud Elanik',
        };
        break;
      case 'KNOWN_LOCAL':
        perks = {
          discountPercent: 5,
          rareSpawnMultiplier: 1.2,
          unlocksSecretLocations: false,
          unlocksExclusiveQuests: true,
          specialDialogueUnlocked: false,
          titleLabel: 'Tuntud Kohalik',
        };
        break;
      default:
        perks = {
          discountPercent: 0,
          rareSpawnMultiplier: 1.0,
          unlocksSecretLocations: false,
          unlocksExclusiveQuests: false,
          specialDialogueUnlocked: false,
          titleLabel: 'Võõras Rändur',
        };
        break;
    }

    return {
      district,
      reputationPoints: points,
      tier,
      perks,
    };
  }
}
