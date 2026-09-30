export type InteractionTag =
  | 'met'
  | 'helped'
  | 'fought'
  | 'traded'
  | 'quest'
  | 'gifted'
  | 'confronted'
  | 'conversed';

export interface MeaningfulInteractionRecord {
  id: string;
  timestamp: string;
  tag: InteractionTag;
  summary: string;
  importance: number; // 1-10
  sentiment: 'positive' | 'neutral' | 'negative';
  cashDelta?: number;
  itemExchanged?: string;
  questId?: string;
}

export interface NPCMemoryContainer {
  npcId: string;
  isPersistent: boolean;
  totalInteractions: number;
  accumulatedRelationshipPoints: number;
  firstMetAt: string;
  lastMetAt: string;
  records: MeaningfulInteractionRecord[];
  discoveredSecrets: string[];
  loyaltyScore: number; // -100 to +100
}

export class NPCMemoryManager {
  /**
   * Check if a procedural random NPC is eligible to be promoted into a persistent permanent named NPC
   */
  public static evaluatePromotion(
    memory: NPCMemoryContainer,
    relationshipPointsGained: number,
    tag: InteractionTag,
    isSuccess: boolean
  ): { shouldPromote: boolean; reason?: string } {
    if (memory.isPersistent) {
      return { shouldPromote: false };
    }

    // Promotion condition:
    // 1. High accumulated relationship points (>= 15) AND at least 2 interactions
    if (memory.accumulatedRelationshipPoints >= 15 && memory.totalInteractions >= 2) {
      return {
        shouldPromote: true,
        reason: 'Sügav usalduslik suhe ja korduvad kohtumised tegid sellest tegelasest linna püsikontakti!',
      };
    }

    // 2. High importance quest or notable trade/help (+ positive sentiment)
    if (
      isSuccess &&
      (tag === 'quest' || tag === 'helped' || tag === 'gifted') &&
      memory.totalInteractions >= 2 &&
      Math.random() < 0.25 // 25% chance on key milestones
    ) {
      return {
        shouldPromote: true,
        reason: 'Erakordne teene ja vastastikune abi sidus teid püsivalt linna võrgustikku!',
      };
    }

    return { shouldPromote: false };
  }

  /**
   * Append a structured memory record
   */
  public static addInteraction(
    memory: NPCMemoryContainer,
    tag: InteractionTag,
    summary: string,
    importance = 3,
    sentiment: 'positive' | 'neutral' | 'negative' = 'neutral',
    extra?: { cashDelta?: number; itemExchanged?: string; questId?: string }
  ): void {
    memory.totalInteractions += 1;
    memory.lastMetAt = new Date().toISOString();

    const record: MeaningfulInteractionRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      tag,
      summary,
      importance,
      sentiment,
      cashDelta: extra?.cashDelta,
      itemExchanged: extra?.itemExchanged,
      questId: extra?.questId,
    };

    memory.records.unshift(record);
    if (memory.records.length > 20) {
      memory.records.pop();
    }

    if (sentiment === 'positive') {
      memory.loyaltyScore = Math.min(100, memory.loyaltyScore + importance * 2);
    } else if (sentiment === 'negative') {
      memory.loyaltyScore = Math.max(-100, memory.loyaltyScore - importance * 3);
    }
  }
}
