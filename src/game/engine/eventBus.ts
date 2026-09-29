export type GameEventType =
  | 'PLAYER_MOVED'
  | 'STREET_DISCOVERED'
  | 'PLACE_DISCOVERED'
  | 'NPC_NEARBY'
  | 'NPC_DIALOGUE_STARTED'
  | 'NPC_DIALOGUE_FINISHED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'COMPANION_INTERACTED'
  | 'COMPANION_EVOLVED'
  | 'ITEM_FOUND'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'WORLD_EVENT_TRIGGERED';

export type EventCallback<T = unknown> = (data: T) => void;

class EventBus {
  private listeners: Map<GameEventType, Set<EventCallback<any>>> = new Map();

  public on<T = unknown>(event: GameEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit<T = unknown>(event: GameEventType, data: T): void {
    const subs = this.listeners.get(event);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
