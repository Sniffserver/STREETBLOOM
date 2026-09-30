import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { CombatActionType, CombatEncounter, CombatEncounterState, CombatStats } from './CombatEncounter';
import { CombatResolver, CombatTurnOutcome } from './CombatResolver';

export class CombatEngine {
  /**
   * Starts a new combat encounter
   */
  public static startEncounter(
    npc: SimulatedNPCInstance,
    playerStats: CombatStats,
    playerHp: number
  ): CombatEncounterState {
    return CombatEncounter.createEncounter(npc, playerStats, playerHp);
  }

  /**
   * Executes a combat action choice
   */
  public static executeAction(
    state: CombatEncounterState,
    action: CombatActionType,
    useItemName?: string
  ): CombatTurnOutcome {
    return CombatResolver.resolveTurn(state, action, useItemName);
  }
}
