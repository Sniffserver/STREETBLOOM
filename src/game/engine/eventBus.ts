export type GameEventType =
  | 'PLAYER_MOVED'
  | 'STREET_TRAVERSAL_UPDATED'
  | 'STREET_DISCOVERED'
  | 'PLACE_DISCOVERED'
  | 'ENCOUNTER_EVALUATED'
  | 'ENCOUNTER_SPAWNED'
  | 'NPC_SPAWNED'
  | 'NPC_NEARBY'
  | 'NPC_INTERACTION_STARTED'
  | 'NPC_INTERACTION_COMPLETED'
  | 'NPC_DESPAWNED'
  | 'TRADE_STARTED'
  | 'TRADE_COMPLETED'
  | 'COMBAT_STARTED'
  | 'COMBAT_COMPLETED'
  | 'NPC_PROMOTED'
  | 'NPC_MEMORY_CREATED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'FACTION_REPUTATION_CHANGED'
  | 'COMPANION_REACTED'
  | 'COMPANION_INTERACTED'
  | 'COMPANION_EVOLVED'
  | 'ITEM_FOUND'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'WORLD_EVENT_TRIGGERED'
  | 'TURN_RECOVERED'
  | 'INTERACTION_COMPLETED';

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
