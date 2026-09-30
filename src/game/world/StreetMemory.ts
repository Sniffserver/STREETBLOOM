export type StreetMemoryItemType =
  | 'NPC_MEETING'          // "You met Marta here"
  | 'COMPANION_EVOLUTION'   // "Pip evolved here"
  | 'QUEST_COMPLETED'       // "Completed quest: Cinnamon Roll Delivery"
  | 'SECRET_FOUND'          // "Discovered secret courtyard"
  | 'COMBAT_VICTORY';       // "Defeated Street Tough in duel"

export interface StreetMemoryItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: StreetMemoryItemType;
  relatedEntityId?: string;
}

export interface StreetMemory {
  streetId: string;
  streetName: string;
  district: string;

  visitCount: number;
  firstDiscoveredAt: string;
  lastVisitedAt: string;

  encountersCount: number;
  questsCompletedCount: number;

  favorite?: boolean;
  notes?: string;

  keyMemories: StreetMemoryItem[];
}

export class StreetMemoryEngine {
  private memoriesMap: Map<string, StreetMemory> = new Map();

  constructor(initialMemories?: StreetMemory[]) {
    if (initialMemories) {
      initialMemories.forEach((m) => this.memoriesMap.set(m.streetId, m));
    }
  }

  public getMemory(streetId: string): StreetMemory | undefined {
    return this.memoriesMap.get(streetId);
  }

  public getAllMemories(): StreetMemory[] {
    return Array.from(this.memoriesMap.values());
  }

  public getOrCreateMemory(streetId: string, streetName: string, district: string): StreetMemory {
    let mem = this.memoriesMap.get(streetId);
    if (!mem) {
      mem = {
        streetId,
        streetName,
        district,
        visitCount: 0,
        firstDiscoveredAt: new Date().toISOString(),
        lastVisitedAt: new Date().toISOString(),
        encountersCount: 0,
        questsCompletedCount: 0,
        favorite: false,
        keyMemories: [],
      };
      this.memoriesMap.set(streetId, mem);
    }
    return mem;
  }

  public recordVisit(streetId: string, streetName: string, district: string): StreetMemory {
    const mem = this.getOrCreateMemory(streetId, streetName, district);
    mem.visitCount += 1;
    mem.lastVisitedAt = new Date().toISOString();
    return mem;
  }

  public recordEventMemory(
    streetId: string,
    streetName: string,
    district: string,
    title: string,
    description: string,
    type: StreetMemoryItemType,
    relatedEntityId?: string
  ): StreetMemory {
    const mem = this.getOrCreateMemory(streetId, streetName, district);

    const memoryItem: StreetMemoryItem = {
      id: `smem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      title,
      description,
      type,
      relatedEntityId,
    };

    mem.keyMemories.unshift(memoryItem);
    if (mem.keyMemories.length > 20) mem.keyMemories.pop();

    if (type === 'NPC_MEETING' || type === 'COMBAT_VICTORY') {
      mem.encountersCount += 1;
    } else if (type === 'QUEST_COMPLETED') {
      mem.questsCompletedCount += 1;
    }

    return mem;
  }

  public toggleFavorite(streetId: string): boolean {
    const mem = this.memoriesMap.get(streetId);
    if (!mem) return false;
    mem.favorite = !mem.favorite;
    return mem.favorite;
  }

  public updateNotes(streetId: string, notes: string): void {
    const mem = this.memoriesMap.get(streetId);
    if (mem) {
      mem.notes = notes;
    }
  }
}
