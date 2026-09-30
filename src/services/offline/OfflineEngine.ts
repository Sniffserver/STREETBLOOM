export interface OfflinePendingAction {
  id: string;
  type: 'STREET_DISCOVERY' | 'QUEST_PROGRESS' | 'ITEM_TRADE' | 'NPC_INTERACTION';
  payload: Record<string, unknown>;
  timestamp: string;
}

export class OfflineEngine {
  private static STORAGE_KEY = 'sb_offline_pending_queue';
  private static memoryQueue: OfflinePendingAction[] = [];

  public static isOnline(): boolean {
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  public static queuePendingAction(action: Omit<OfflinePendingAction, 'id' | 'timestamp'>): void {
    const queue = this.getPendingQueue();
    const item: OfflinePendingAction = {
      ...action,
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    queue.push(item);
    this.memoryQueue = queue;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
      } catch {
        // Fallback to in-memory queue
      }
    }
  }

  public static getPendingQueue(): OfflinePendingAction[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // Fallback
      }
    }
    return [...this.memoryQueue];
  }

  public static clearPendingQueue(): void {
    this.memoryQueue = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // Fallback
      }
    }
  }
}
