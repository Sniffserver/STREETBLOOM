import { SimulatedNPCInstance } from './NPCSimulation';
import { PlayerSkills } from '../../types/game';

export type CombatPlayerAction = 'attack' | 'defend' | 'item' | 'run';

export interface CombatTurnResult {
  playerDamageDealt: number;
  npcDamageDealt: number;
  playerHpRemaining: number;
  npcHpRemaining: number;
  isCombatOver: boolean;
  outcome: 'player_won' | 'player_fled' | 'player_knockout' | 'ongoing';
  combatLog: string[];
  rewardCash?: number;
  rewardXp?: number;
}

export class NPCCombat {
  /**
   * Deterministic combat step execution
   */
  public static executeTurn(
    playerAction: CombatPlayerAction,
    playerCurrentHp: number,
    playerMaxHp: number,
    playerSkills: PlayerSkills,
    npc: SimulatedNPCInstance,
    rngRoll = Math.random()
  ): CombatTurnResult {
    const combatLog: string[] = [];
    let playerHp = playerCurrentHp;
    let npcHp = npc.currentHp;
    let isCombatOver = false;
    let outcome: 'player_won' | 'player_fled' | 'player_knockout' | 'ongoing' = 'ongoing';
    let playerDamageDealt = 0;
    let npcDamageDealt = 0;
    let rewardCash: number | undefined;
    let rewardXp: number | undefined;

    // 1. Player Action Resolution
    if (playerAction === 'run') {
      const escapeChance = 0.5 + (playerSkills.stealth || 1) * 0.05;
      if (rngRoll < escapeChance) {
        combatLog.push('Kasutasid osavalt tänavanurki ja põgenesid edukalt konfliktist!');
        return {
          playerDamageDealt: 0,
          npcDamageDealt: 0,
          playerHpRemaining: playerHp,
          npcHpRemaining: npcHp,
          isCombatOver: true,
          outcome: 'player_fled',
          combatLog,
        };
      } else {
        combatLog.push('Põgenemiskatse ebaõnnestus! Vastane blokeeris tee.');
      }
    } else if (playerAction === 'defend') {
      combatLog.push('Võtsid kaitseasendi ja valmistusid vastulöögiks.');
    } else if (playerAction === 'attack') {
      // Base player attack (scaled by StreetSmart skill)
      const baseAtk = 8 + (playerSkills.streetSmart || 1) * 2;
      const defMitigation = Math.max(0, npc.defensePower * 0.4);
      playerDamageDealt = Math.max(3, Math.round(baseAtk - defMitigation + (rngRoll * 4 - 2)));
      npcHp = Math.max(0, npcHp - playerDamageDealt);
      npc.currentHp = npcHp;
      combatLog.push(`Ründasid ja tabasid vastast (-${playerDamageDealt} HP).`);

      if (npcHp <= 0) {
        isCombatOver = true;
        outcome = 'player_won';
        rewardCash = 10 + Math.floor(rngRoll * 15);
        rewardXp = 25;
        combatLog.push(`Võit! Vastane taganes. Leidsid ${rewardCash} kr ja teenisid ${rewardXp} XP.`);
        return {
          playerDamageDealt,
          npcDamageDealt: 0,
          playerHpRemaining: playerHp,
          npcHpRemaining: 0,
          isCombatOver: true,
          outcome,
          combatLog,
          rewardCash,
          rewardXp,
        };
      }
    } else if (playerAction === 'item') {
      const heal = 15;
      playerHp = Math.min(playerMaxHp, playerHp + heal);
      combatLog.push(`Kasutasid energiabatooni ja taastasid +${heal} HP.`);
    }

    // 2. NPC Turn
    if (!isCombatOver && npcHp > 0) {
      const isDefending = playerAction === 'defend';
      const rawAtk = npc.attackPower;
      const defReduction = isDefending ? 0.7 : 0.2; // Defending cuts damage by 70%
      npcDamageDealt = Math.max(1, Math.round(rawAtk * (1 - defReduction)));

      playerHp = Math.max(0, playerHp - npcDamageDealt);
      combatLog.push(`${npc.name} (${npc.title}) ründas vastu (-${npcDamageDealt} HP).`);

      if (playerHp <= 0) {
        isCombatOver = true;
        outcome = 'player_knockout';
        combatLog.push('Sinu energia sai otsa. Taandusid lähimasse turvalisse paika.');
      }
    }

    return {
      playerDamageDealt,
      npcDamageDealt,
      playerHpRemaining: playerHp,
      npcHpRemaining: npcHp,
      isCombatOver,
      outcome,
      combatLog,
      rewardCash,
      rewardXp,
    };
  }
}
