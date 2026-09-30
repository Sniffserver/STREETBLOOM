import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { NPCMemoryService } from './NPCMemoryService';
import { WorldTimeInfo } from '../world/WorldClock';
import { InventoryItem } from '../../types/game';

export interface DialogueContextPayload {
  npc: {
    id: string;
    name: string;
    archetype: string;
    district: string;
    avatar: string;
  };
  companionThought?: string;
  worldTime?: WorldTimeInfo;
  playerInventoryNames?: string[];
  recentMemories?: string[];
  factionStanding?: string;
}

export interface DialogueGenerationResult {
  dialogue: string;
  moodChange: number;
  relationshipChange: number;
  memoryToStore?: string;
  unlockedNarrative?: string;
}

export class NPCDialogueService {
  /**
   * Generates or fetches context-aware dialogue for an NPC
   */
  public static async requestDialogue(
    npc: SimulatedNPCInstance,
    playerMessage: string,
    playerInventory: InventoryItem[] = [],
    worldTime?: WorldTimeInfo,
    companionMood: string = 'happy'
  ): Promise<DialogueGenerationResult> {
    const memoryPrompt = NPCMemoryService.getFormattedMemoryPrompt(npc.id);
    const itemNames = playerInventory.map((i) => i.itemId);

    // Check for narrative trigger item matches
    let unlockedNarrative: string | undefined;
    if (itemNames.includes('old_cassette') && npc.archetype === 'RAVER') {
      unlockedNarrative = 'Kuule... sul on see vana helikassett taskus! Kas see on see 90ndate lint?';
    } else if (itemNames.includes('vintage_lighter') && npc.archetype === 'WORKER') {
      unlockedNarrative = 'Oota korraks... see messingist tulemasin... minu vanaisa kaotas selle Kopli depoos!';
    } else if (itemNames.includes('broken_phone') && npc.archetype === 'BLACK_MARKET_TRADER') {
      unlockedNarrative = 'See nuputelefon su käes... seal sees on krüpteeritud võti, eks?';
    }

    try {
      const payload: DialogueContextPayload = {
        npc: {
          id: npc.id,
          name: npc.name,
          archetype: npc.archetype,
          district: npc.district,
          avatar: npc.avatar,
        },
        companionThought: `Pip on ${companionMood}`,
        worldTime,
        playerInventoryNames: itemNames,
        recentMemories: [memoryPrompt],
      };

      const res = await fetch('/api/npc/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: npc.id,
          playerMessage: unlockedNarrative ? `${playerMessage} (Näitan eset)` : playerMessage,
          context: payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.memoryToStore) {
          NPCMemoryService.addMemory(npc.id, 'conversed' as any, data.memoryToStore, 3);
        }
        return {
          dialogue: unlockedNarrative ? `${unlockedNarrative}\n\n${data.dialogue}` : data.dialogue,
          moodChange: data.moodChange || 1,
          relationshipChange: data.relationshipChange || 2,
          memoryToStore: data.memoryToStore,
          unlockedNarrative,
        };
      }
    } catch {
      // Offline / fallback path
    }

    // Local in-character fallback response
    const fallbackText = unlockedNarrative || `Tere! Mina olen ${npc.name}. Varjulinna tänavatel liigub praegu palju huvitavat.`;
    return {
      dialogue: fallbackText,
      moodChange: 1,
      relationshipChange: 1,
      unlockedNarrative,
    };
  }
}
