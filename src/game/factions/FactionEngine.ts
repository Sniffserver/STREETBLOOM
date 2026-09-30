import { FactionId, FACTION_DEFINITIONS } from './FactionDefinition';
import { FactionReputation, FactionStandingInfo } from './FactionReputation';

export class FactionEngine {
  /**
   * Adjusts reputation points for a faction
   */
  public static adjustReputation(
    currentStanding: Record<FactionId, number>,
    factionId: FactionId,
    delta: number
  ): Record<FactionId, number> {
    const updated = { ...currentStanding };
    const prev = updated[factionId] ?? 0;
    updated[factionId] = FactionReputation.clampPoints(prev + delta);
    return updated;
  }

  /**
   * Gets current standing information for a faction
   */
  public static getStanding(
    currentStanding: Record<FactionId, number>,
    factionId: FactionId
  ): FactionStandingInfo {
    const points = currentStanding[factionId] ?? FACTION_DEFINITIONS[factionId]?.defaultStanding ?? 0;
    return FactionReputation.getStandingInfo(points);
  }
}
