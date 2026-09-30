export type RelationshipLevel =
  | 0 // Stranger (Võõras)
  | 1 // Recognized (Märgatud)
  | 2 // Acquaintance (Tuttav)
  | 3 // Friendly (Sõbralik)
  | 4 // Trusted (Usaldatud)
  | 5 // Close Friend (Hea sõber)
  | 6; // Legend / Ally (Linna legend / Liitlane)

export interface RelationshipDetails {
  level: RelationshipLevel;
  label: string;
  badge: string;
  pointsToNextLevel: number;
  tradeDiscountPercent: number;
  combatAvoidanceBonus: number; // bonus chance to talk down street toughs
  unlocksSpecialGigs: boolean;
}

export const RELATIONSHIP_TIERS: Record<RelationshipLevel, RelationshipDetails> = {
  0: {
    level: 0,
    label: 'Võõras (Stranger)',
    badge: '⚪ Võõras',
    pointsToNextLevel: 10,
    tradeDiscountPercent: 0,
    combatAvoidanceBonus: 0,
    unlocksSpecialGigs: false,
  },
  1: {
    level: 1,
    label: 'Märgatud (Recognized)',
    badge: '🟢 Märgatud',
    pointsToNextLevel: 15,
    tradeDiscountPercent: 5,
    combatAvoidanceBonus: 0.1,
    unlocksSpecialGigs: false,
  },
  2: {
    level: 2,
    label: 'Tuttav (Acquaintance)',
    badge: '🔵 Tuttav',
    pointsToNextLevel: 25,
    tradeDiscountPercent: 10,
    combatAvoidanceBonus: 0.2,
    unlocksSpecialGigs: true,
  },
  3: {
    level: 3,
    label: 'Sõbralik (Friendly)',
    badge: '🟣 Sõbralik',
    pointsToNextLevel: 40,
    tradeDiscountPercent: 15,
    combatAvoidanceBonus: 0.35,
    unlocksSpecialGigs: true,
  },
  4: {
    level: 4,
    label: 'Usaldatud (Trusted)',
    badge: '🟡 Usaldatud',
    pointsToNextLevel: 60,
    tradeDiscountPercent: 20,
    combatAvoidanceBonus: 0.5,
    unlocksSpecialGigs: true,
  },
  5: {
    level: 5,
    label: 'Hea sõber (Close Friend)',
    badge: '🟠 Hea sõber',
    pointsToNextLevel: 100,
    tradeDiscountPercent: 25,
    combatAvoidanceBonus: 0.75,
    unlocksSpecialGigs: true,
  },
  6: {
    level: 6,
    label: 'Liitlane (Legend / Ally)',
    badge: '⭐ Liitlane',
    pointsToNextLevel: 0,
    tradeDiscountPercent: 30,
    combatAvoidanceBonus: 1.0,
    unlocksSpecialGigs: true,
  },
};

export class NPCRelationshipManager {
  public static getDetails(level: number): RelationshipDetails {
    const clampedLevel = Math.max(0, Math.min(6, Math.floor(level))) as RelationshipLevel;
    return RELATIONSHIP_TIERS[clampedLevel];
  }

  public static addPoints(
    currentLevel: number,
    currentPoints: number,
    pointsGained: number
  ): { newLevel: RelationshipLevel; newPoints: number; leveledUp: boolean } {
    let level = Math.max(0, Math.min(6, currentLevel)) as RelationshipLevel;
    let points = currentPoints + pointsGained;
    let leveledUp = false;

    while (level < 6) {
      const needed = RELATIONSHIP_TIERS[level].pointsToNextLevel;
      if (points >= needed) {
        points -= needed;
        level = (level + 1) as RelationshipLevel;
        leveledUp = true;
      } else {
        break;
      }
    }

    if (level === 6) {
      points = Math.max(0, points);
    }

    return { newLevel: level, newPoints: points, leveledUp };
  }
}
