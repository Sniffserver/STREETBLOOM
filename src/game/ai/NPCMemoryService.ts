export type NPCMemoryType =
  | 'met'
  | 'helped'
  | 'fought'
  | 'traded'
  | 'quest'
  | 'betrayed'
  | 'gifted';

export interface NPCMemoryRecord {
  id: string;
  npcId: string;
  type: NPCMemoryType;
  summary: string;
  importance: number; // 1 to 5
  timestamp: string;
  details?: Record<string, unknown>;
}

export class NPCMemoryService {
  private static memories: Record<string, NPCMemoryRecord[]> = {};

  public static addMemory(
    npcId: string,
    type: NPCMemoryType,
    summary: string,
    importance: number = 3,
    details?: Record<string, unknown>
  ): NPCMemoryRecord {
    if (!this.memories[npcId]) {
      this.memories[npcId] = [];
    }

    const record: NPCMemoryRecord = {
      id: 'mem-' + Math.random().toString(36).substring(2, 9),
      npcId,
      type,
      summary,
      importance,
      timestamp: new Date().toISOString(),
      details,
    };

    this.memories[npcId].unshift(record);
    if (this.memories[npcId].length > 15) {
      this.memories[npcId].pop();
    }

    return record;
  }

  public static getMemories(npcId: string): NPCMemoryRecord[] {
    return this.memories[npcId] || [];
  }

  public static getFormattedMemoryPrompt(npcId: string): string {
    const mems = this.getMemories(npcId);
    if (mems.length === 0) return 'Varasemad mälestused puuduvad (esimene kohtumine).';
    return mems
      .slice(0, 4)
      .map((m) => `- [${m.type.toUpperCase()}] ${m.summary} (${new Date(m.timestamp).toLocaleDateString()})`)
      .join('\n');
  }
}
