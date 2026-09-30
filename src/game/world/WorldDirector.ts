import { EncounterDirector, EncounterDecision } from '../encounters/EncounterDirector';
import { EncounterContext } from '../encounters/EncounterContext';
import { MicroEventEngine, MicroEvent } from '../events/MicroEventEngine';
import { CompanionBehaviorEngine, CompanionSuggestion } from '../companion/CompanionBehavior';

export type WorldEventCategory =
  | 'NPC_ENCOUNTER'
  | 'MICRO_EVENT'
  | 'RARE_EVENT'
  | 'DISCOVERY_UNLOCKED'
  | 'COMPANION_SUGGESTION';

export interface WorldEventResult {
  category: WorldEventCategory;
  timestamp: string;
  npcEncounter?: EncounterDecision;
  microEvent?: MicroEvent;
  companionSuggestion?: CompanionSuggestion;
  narrativeText?: string;
}

export class WorldDirector {
  private encounterDirector: EncounterDirector;
  private companionEngine: CompanionBehaviorEngine;

  constructor(seed?: number) {
    this.encounterDirector = new EncounterDirector(seed);
    this.companionEngine = new CompanionBehaviorEngine();
  }

  public getCompanionEngine(): CompanionBehaviorEngine {
    return this.companionEngine;
  }

  /**
   * Orchestrates world evaluation across NPC encounters, micro-events, and companion reactions
   */
  public evaluateWorldState(context: EncounterContext): WorldEventResult {
    const isNight = context.worldTime.phase === 'NIGHT' || context.worldTime.phase === 'DEEP_NIGHT';

    // Update companion traversal stats
    this.companionEngine.recordStreetTraversal(context.district, isNight);

    // 1. Evaluate NPC Encounters
    const npcDecision = this.encounterDirector.evaluate(context);
    if (npcDecision.type === 'SPAWN_ENCOUNTER') {
      this.companionEngine.recordNPCInteraction(npcDecision.archetype);

      return {
        category: 'NPC_ENCOUNTER',
        timestamp: new Date().toISOString(),
        npcEncounter: npcDecision,
        narrativeText: `Kohtusid linnaosas ${context.district}: ${npcDecision.archetype}`,
      };
    }

    // 2. Evaluate Micro-Events (Texture events)
    const micro = MicroEventEngine.rollMicroEvent(context.district, isNight);
    if (micro) {
      if (micro.type === 'NPC_DROPPED_ITEM') {
        this.companionEngine.recordItemFound();
      }

      return {
        category: 'MICRO_EVENT',
        timestamp: new Date().toISOString(),
        microEvent: micro,
        narrativeText: micro.title,
      };
    }

    // 3. Companion organic observations/suggestions
    if (Math.random() < 0.15) {
      const suggestion = this.companionEngine.generateSuggestion(context.district, isNight);
      return {
        category: 'COMPANION_SUGGESTION',
        timestamp: new Date().toISOString(),
        companionSuggestion: suggestion,
        narrativeText: suggestion.text,
      };
    }

    return {
      category: 'DISCOVERY_UNLOCKED',
      timestamp: new Date().toISOString(),
      narrativeText: `Tänavate kaardistamine linnaosas ${context.district}`,
    };
  }
}

export const worldDirector = new WorldDirector();
