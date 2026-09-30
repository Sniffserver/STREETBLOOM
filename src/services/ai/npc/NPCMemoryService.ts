import { NPCMemoryContainer } from '../../../game/npc/NPCMemory';

export class NPCMemoryService {
  /**
   * Formats NPC memories into concise context strings for Gemini prompt
   */
  public static buildMemoryContext(memory?: NPCMemoryContainer): string {
    if (!memory || !memory.records || memory.records.length === 0) {
      return 'See on teie esimene silmast silma kohtumine.';
    }

    const recentRecords = memory.records.slice(0, 5);
    const lines = recentRecords.map(
      (r) => `- [${r.tag.toUpperCase()}] ${r.summary} (mõju: ${r.importance}, kättesaadavus: ${r.sentiment})`
    );

    return `Varasemad kohtumised (kokku ${memory.totalInteractions} korda, vaenulikkus/lojaalsus: ${memory.loyaltyScore}):\n${lines.join('\n')}`;
  }
}
