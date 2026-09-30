import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { InteractionActionType, InteractionOption, InteractionOptions } from './InteractionOptions';
import { InteractionResolutionResult, InteractionResolver } from './InteractionResolver';

export class InteractionEngine {
  /**
   * Retrieves available options for interacting with an NPC
   */
  public static getOptions(npc: SimulatedNPCInstance): InteractionOption[] {
    return InteractionOptions.getAvailableOptions(npc);
  }

  /**
   * Executes an interaction action
   */
  public static executeInteraction(
    npc: SimulatedNPCInstance,
    action: InteractionActionType
  ): InteractionResolutionResult {
    return InteractionResolver.resolve(npc, action);
  }
}
