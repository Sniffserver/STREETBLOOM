export interface GroupSizeDistribution {
  size: 'SINGLE' | 'PAIR' | 'GROUP';
  memberCount: number;
  probability: number;
}

export class NPCGroupEngine {
  /**
   * Rolls group size according to 75% single, 20% pair, 5% group
   */
  public static rollGroupSize(rngValue: number = Math.random()): {
    sizeLabel: 'SINGLE' | 'PAIR' | 'GROUP';
    memberCount: number;
  } {
    if (rngValue < 0.75) {
      return { sizeLabel: 'SINGLE', memberCount: 1 };
    }
    if (rngValue < 0.95) {
      return { sizeLabel: 'PAIR', memberCount: 2 };
    }
    return { sizeLabel: 'GROUP', memberCount: 3 + Math.floor(Math.random() * 2) }; // 3 or 4 members
  }
}
