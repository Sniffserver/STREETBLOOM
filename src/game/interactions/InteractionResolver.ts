import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { InteractionActionType } from './InteractionOptions';
import { getArchetypeDefinition } from '../npc/NPCArchetypes';
import { npcManager, PromotedNPCResult } from '../npc/NPCManager';

export interface InteractionResolutionResult {
  action: InteractionActionType;
  success: boolean;
  dialogueLine: string;
  relationshipChange: number;
  xpGained: number;
  cashGained?: number;
  promotedNPCResult?: PromotedNPCResult;
}

export class InteractionResolver {
  public static resolve(
    npc: SimulatedNPCInstance,
    action: InteractionActionType
  ): InteractionResolutionResult {
    const def = getArchetypeDefinition(npc.archetype);

    switch (action) {
      case 'TALK': {
        const line = def.sampleDialogue[Math.floor(Math.random() * def.sampleDialogue.length)] ||
          `Tere, olen ${npc.name}. Mis sinu mure on?`;

        const promotion = npcManager.recordInteraction(
          npc.id,
          'conversed',
          `Vestles tegelasega ${npc.name} (${npc.district})`,
          3,
          'positive',
          { relPoints: 2 }
        );

        return {
          action: 'TALK',
          success: true,
          dialogueLine: line,
          relationshipChange: 2,
          xpGained: 15,
          promotedNPCResult: promotion,
        };
      }

      case 'ASK_DIRECTIONS': {
        const line = `Lähimad teadaolevad kohad asuvad ${npc.district} südames. Hoidu pimedatest alleedest öisel ajal!`;

        const promotion = npcManager.recordInteraction(
          npc.id,
          'conversed',
          `Küsis teejuhiseid tegelaselt ${npc.name} piirkonnas ${npc.district}`,
          2,
          'neutral',
          { relPoints: 1 }
        );

        return {
          action: 'ASK_DIRECTIONS',
          success: true,
          dialogueLine: line,
          relationshipChange: 1,
          xpGained: 10,
          promotedNPCResult: promotion,
        };
      }

      case 'QUEST': {
        const line = `Mul oleks vaja abi piirkonna ${npc.district} vaatluse ja mõõtmistega. Jaluta veel 100 meetrit sel tänaval!`;

        const promotion = npcManager.recordInteraction(
          npc.id,
          'quest',
          `Sai ülesande tegelaselt ${npc.name}`,
          4,
          'positive',
          { relPoints: 3 }
        );

        return {
          action: 'QUEST',
          success: true,
          dialogueLine: line,
          relationshipChange: 3,
          xpGained: 25,
          cashGained: 10,
          promotedNPCResult: promotion,
        };
      }

      case 'FIGHT': {
        const line = `Valmista end ette! Tänaval kehtivad oma reeglid!`;

        const promotion = npcManager.recordInteraction(
          npc.id,
          'fought',
          `Astudes konflikti tegelasega ${npc.name}`,
          5,
          'negative',
          { relPoints: -3 }
        );

        return {
          action: 'FIGHT',
          success: true,
          dialogueLine: line,
          relationshipChange: -3,
          xpGained: 20,
          promotedNPCResult: promotion,
        };
      }

      case 'LEAVE':
      default: {
        return {
          action: 'LEAVE',
          success: true,
          dialogueLine: 'Rändur astub edasi linnatänavatele.',
          relationshipChange: 0,
          xpGained: 0,
        };
      }
    }
  }
}
