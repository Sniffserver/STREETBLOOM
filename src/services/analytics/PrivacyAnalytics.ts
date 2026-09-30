export type AnalyticsEventType =
  | 'street_discovered'
  | 'encounter_spawned'
  | 'encounter_approached'
  | 'encounter_ignored'
  | 'talk'
  | 'trade'
  | 'combat'
  | 'flee'
  | 'quest_started'
  | 'quest_completed'
  | 'npc_promoted'
  | 'companion_evolution';

export interface LocalAnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class PrivacyAnalytics {
  private static events: LocalAnalyticsEvent[] = [];

  public static track(type: AnalyticsEventType, details?: Record<string, unknown>): void {
    const item: LocalAnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      details,
      timestamp: new Date().toISOString(),
    };

    this.events.push(item);
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  public static getEvents(): LocalAnalyticsEvent[] {
    return [...this.events];
  }

  public static clearEvents(): void {
    this.events = [];
  }
}
