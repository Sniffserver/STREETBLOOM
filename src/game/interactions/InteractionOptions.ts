import { NPCArchetype } from '../npc/NPCArchetypes';
import { SimulatedNPCInstance } from '../npc/NPCSimulation';

export type InteractionActionType =
  | 'TALK'
  | 'ASK_DIRECTIONS'
  | 'TRADE'
  | 'QUEST'
  | 'FIGHT'
  | 'GIFT'
  | 'LEAVE';

export interface InteractionOption {
  type: InteractionActionType;
  label: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  unavailableReason?: string;
}

export class InteractionOptions {
  public static getAvailableOptions(npc: SimulatedNPCInstance): InteractionOption[] {
    const options: InteractionOption[] = [];

    // 1. TALK - Available for almost all NPCs
    options.push({
      type: 'TALK',
      label: 'Räägi (Talk)',
      description: 'Loo tegelasega kontakt ja alusta vestlust.',
      icon: '💬',
      isAvailable: true,
    });

    // 2. ASK_DIRECTIONS - Available for Civilian, Worker, Student, Tourist, Night Worker
    const canAsk = ['CIVILIAN', 'WORKER', 'STUDENT', 'TOURIST', 'NIGHT_WORKER', 'MYSTERY_STRANGER'].includes(npc.archetype);
    if (canAsk) {
      options.push({
        type: 'ASK_DIRECTIONS',
        label: 'Küsi teed & vihjeid (Ask Directions)',
        description: 'Küsi teavet piirkonna tänavate ja varjatud kohtade kohta.',
        icon: '🗺️',
        isAvailable: true,
      });
    }

    // 3. TRADE - Vendor, Black Market Trader, Student, Drifter
    const canTrade = ['VENDOR', 'BLACK_MARKET_TRADER', 'STUDENT', 'DRIFTER'].includes(npc.archetype);
    options.push({
      type: 'TRADE',
      label: 'Kauple (Trade)',
      description: 'Vaata tegelase kaubavarustust ja osta või müü esemeid.',
      icon: '🎒',
      isAvailable: canTrade,
      unavailableReason: canTrade ? undefined : 'See tegelane ei tegele kauplemisega.',
    });

    // 4. QUEST - Worker, Vendor, Night Worker, Civilian
    const canQuest = ['WORKER', 'VENDOR', 'NIGHT_WORKER', 'CIVILIAN'].includes(npc.archetype);
    if (canQuest) {
      options.push({
        type: 'QUEST',
        label: 'Küsi ülesannet (Ask for Quest)',
        description: 'Paku oma abi ja teeni kohalikku mainet ning tasu.',
        icon: '📜',
        isAvailable: true,
      });
    }

    // 5. FIGHT - Street Tough, Security, Raver
    const canFight = ['STREET_TOUGH', 'SECURITY', 'RAVER'].includes(npc.archetype);
    if (canFight) {
      options.push({
        type: 'FIGHT',
        label: 'Astu võitlusse (Fight)',
        description: 'Lahenda konflikt jõuga ja pane oma vastupidavus proovile.',
        icon: '⚔️',
        isAvailable: true,
      });
    }

    // 6. LEAVE - Always available
    options.push({
      type: 'LEAVE',
      label: 'Lahu rahumeelselt (Leave)',
      description: 'Astu eemale ja jätka linnaga tutvumist.',
      icon: '🚶',
      isAvailable: true,
    });

    return options;
  }
}
