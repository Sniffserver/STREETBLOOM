import { CombatActionType, CombatEncounterState } from './CombatEncounter';
import { FactionId } from '../factions/FactionDefinition';

export interface CombatReward {
  xp: number;
  cash: number;
  reputationChanges: Record<FactionId, number>;
  relationshipChange: number;
  foundItemName?: string;
}

export interface CombatTurnOutcome {
  state: CombatEncounterState;
  playerDamageDealt: number;
  npcDamageDealt: number;
  logMessage: string;
  reward?: CombatReward;
}

export class CombatResolver {
  public static resolveTurn(
    state: CombatEncounterState,
    action: CombatActionType,
    useItemName?: string
  ): CombatTurnOutcome {
    if (state.isCompleted) {
      return {
        state,
        playerDamageDealt: 0,
        npcDamageDealt: 0,
        logMessage: 'Konflikt on juba lahendatud.',
      };
    }

    let playerDmg = 0;
    let npcDmg = 0;
    let logMsg = '';
    const npc = state.npcInstance;

    // 1. TALK AVOIDANCE
    if (action === 'TALK') {
      const talkChance = state.npcFightingStyle === 'CAUTIOUS_WORKER' ? 0.85 : 0.55;
      if (Math.random() < talkChance) {
        state.isCompleted = true;
        state.winner = 'PACIFIED';
        logMsg = `Rääkisid vastasega ${npc.name} rahulikult ja saavutasite leppe ilma vägivallata!`;
        state.combatLogs.push(logMsg);

        const reward: CombatReward = {
          xp: 20,
          cash: 0,
          reputationChanges: { LOCALS: 2, STREET: 1, WORKERS: 2, SECURITY: 0, NIGHTLIFE: 0, TRADERS: 0, MYSTERIOUS: 0 },
          relationshipChange: 5,
        };

        return { state, playerDamageDealt: 0, npcDamageDealt: 0, logMessage: logMsg, reward };
      } else {
        logMsg = `${npc.name} ei kuulanud su sõnu ja keeldus leppimast!`;
        state.combatLogs.push(logMsg);
      }
    }

    // 2. BRIBE AVOIDANCE (5 kr coin)
    if (action === 'BRIBE') {
      state.isCompleted = true;
      state.winner = 'BRIBED';
      logMsg = `Andsid tegelasele ${npc.name} mõned mündid (5 kr). Ta naeratab ja lahkub rahulikult.`;
      state.combatLogs.push(logMsg);

      const reward: CombatReward = {
        xp: 15,
        cash: -5,
        reputationChanges: { TRADERS: 2, STREET: 1, LOCALS: 0, WORKERS: 0, SECURITY: 0, NIGHTLIFE: 0, MYSTERIOUS: 0 },
        relationshipChange: 3,
      };

      return { state, playerDamageDealt: 0, npcDamageDealt: 0, logMessage: logMsg, reward };
    }

    // 3. RUN ACTION
    if (action === 'RUN') {
      const runChance = 0.75;
      if (Math.random() < runChance) {
        state.isCompleted = true;
        state.winner = 'FLED';
        logMsg = 'Kasutasid osavalt tänavanurki ja taandusid turvalisse kanti!';
        state.combatLogs.push(logMsg);
        return { state, playerDamageDealt: 0, npcDamageDealt: 0, logMessage: logMsg };
      } else {
        logMsg = 'Põgenemiskatse ebaõnnestus! Vastane tegi tõkke.';
        state.combatLogs.push(logMsg);
      }
    }

    // 4. ITEM ACTION
    if (action === 'ITEM') {
      const healAmount = 20;
      state.playerCurrentHp = Math.min(state.playerStats.maxHp, state.playerCurrentHp + healAmount);
      logMsg = `Kasutasid eina/eset ${useItemName || 'batoon'} ja taastasid +${healAmount} HP.`;
      state.combatLogs.push(logMsg);
    }

    // 5. SPECIAL COMPANION SYNERGY ACTION
    if (action === 'SPECIAL') {
      playerDmg = Math.round(state.playerStats.attack * 1.5);
      state.npcCurrentHp = Math.max(0, state.npcCurrentHp - playerDmg);
      npc.currentHp = state.npcCurrentHp;
      logMsg = `Pip tegi pahaaimamatu haugatuse, haarates vastase tähelepanu! Tgid -${playerDmg} HP kahju.`;
      state.combatLogs.push(logMsg);
    }

    // 6. STANDARD ATTACK
    if (action === 'ATTACK') {
      const baseAtk = state.playerStats.attack;
      const defMitigation = Math.max(0, npc.defensePower * 0.3);
      playerDmg = Math.max(4, Math.round(baseAtk - defMitigation + (Math.random() * 4 - 2)));
      state.npcCurrentHp = Math.max(0, state.npcCurrentHp - playerDmg);
      npc.currentHp = state.npcCurrentHp;

      logMsg = `Ründasid vastast ${npc.name} ja tegid -${playerDmg} HP kahju.`;
      state.combatLogs.push(logMsg);
    }

    // Check NPC Knockout
    if (state.npcCurrentHp <= 0) {
      state.isCompleted = true;
      state.winner = 'PLAYER';

      const reward: CombatReward = {
        xp: 18,
        cash: 8 + Math.floor(Math.random() * 6),
        reputationChanges: { STREET: 2, SECURITY: -2, LOCALS: 0, WORKERS: 0, NIGHTLIFE: 0, TRADERS: 0, MYSTERIOUS: 0 },
        relationshipChange: -5,
      };

      const winMsg = `Võitsid konflikti! Teenisid ${reward.xp} XP ja leidsid ${reward.cash} kr.`;
      state.combatLogs.push(winMsg);

      return { state, playerDamageDealt: playerDmg, npcDamageDealt: 0, logMessage: winMsg, reward };
    }

    // 7. NPC TURN
    if (!state.isCompleted && state.npcCurrentHp > 0) {
      const isDefending = action === 'DEFEND';
      let rawNpcAtk = npc.attackPower;

      if (state.npcFightingStyle === 'AGGRESSIVE_TOUGH') rawNpcAtk *= 1.25;

      const defMitigation = isDefending ? state.playerStats.defense * 0.85 : state.playerStats.defense * 0.3;
      npcDmg = Math.max(1, Math.round(rawNpcAtk - defMitigation + (Math.random() * 3 - 1)));

      state.playerCurrentHp = Math.max(0, state.playerCurrentHp - npcDmg);
      const npcTurnMsg = `${npc.name} tegi vastu-rünnaku (-${npcDmg} HP).`;
      state.combatLogs.push(npcTurnMsg);

      if (state.playerCurrentHp <= 0) {
        state.isCompleted = true;
        state.winner = 'NPC';
        const lossMsg = 'Sinu energia sai otsa. Taandusid lähimasse turvalisse paika.';
        state.combatLogs.push(lossMsg);

        return { state, playerDamageDealt: playerDmg, npcDamageDealt: npcDmg, logMessage: lossMsg };
      }
    }

    state.turnNumber += 1;

    return {
      state,
      playerDamageDealt: playerDmg,
      npcDamageDealt: npcDmg,
      logMessage: logMsg || 'Käik sooritatud.',
    };
  }
}
