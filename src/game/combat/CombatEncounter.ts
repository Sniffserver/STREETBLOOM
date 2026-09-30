import { SimulatedNPCInstance } from '../npc/NPCSimulation';

export interface CombatStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export type CombatActionType = 'ATTACK' | 'DEFEND' | 'SPECIAL' | 'ITEM' | 'RUN' | 'TALK' | 'BRIBE';

export type NPCFightingStyle = 'CAUTIOUS_WORKER' | 'AGGRESSIVE_TOUGH' | 'DISCIPLINED_SECURITY' | 'ERRATIC_DRIFTER';

export interface CombatEncounterState {
  encounterId: string;
  npcInstance: SimulatedNPCInstance;
  npcFightingStyle: NPCFightingStyle;
  playerStats: CombatStats;
  playerCurrentHp: number;
  npcCurrentHp: number;
  turnNumber: number;
  isCompleted: boolean;
  winner?: 'PLAYER' | 'NPC' | 'FLED' | 'PACIFIED' | 'BRIBED';
  companionAdvice: string;
  combatLogs: string[];
}

export class CombatEncounter {
  public static resolveStyle(npc: SimulatedNPCInstance): NPCFightingStyle {
    if (npc.archetype === 'WORKER' || npc.archetype === 'NIGHT_WORKER') return 'CAUTIOUS_WORKER';
    if (npc.archetype === 'SECURITY') return 'DISCIPLINED_SECURITY';
    if (npc.archetype === 'DRIFTER' || npc.archetype === 'HOMELESS_WANDERER') return 'ERRATIC_DRIFTER';
    return 'AGGRESSIVE_TOUGH';
  }

  public static createEncounter(
    npc: SimulatedNPCInstance,
    playerStats: CombatStats,
    playerHp: number
  ): CombatEncounterState {
    const style = this.resolveStyle(npc);
    let advice = 'Pip sosistab: "Oleme valmis iga käigu jaoks!"';

    if (style === 'AGGRESSIVE_TOUGH') {
      advice = 'Pip sosistab: "Ta näeb kuri välja! Äkki aitaks altkäemaks (BRIBE) või põgenemine?"';
    } else if (style === 'CAUTIOUS_WORKER') {
      advice = 'Pip sosistab: "Ta on kaitseasendis. Räägi (TALK) temaga rahulikult!"';
    }

    return {
      encounterId: `comb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      npcInstance: npc,
      npcFightingStyle: style,
      playerStats,
      playerCurrentHp: playerHp,
      npcCurrentHp: npc.currentHp,
      turnNumber: 1,
      isCompleted: false,
      companionAdvice: advice,
      combatLogs: [`Astudes konflikti vastasega ${npc.name} (${npc.title})!`],
    };
  }
}
