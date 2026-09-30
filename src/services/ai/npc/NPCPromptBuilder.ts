import { SimulatedNPCInstance } from '../../../game/npc/NPCSimulation';
import { WorldTimeInfo } from '../../../game/world/WorldClock';
import { getArchetypeDefinition } from '../../../game/npc/NPCArchetypes';
import { NPCMemoryService } from './NPCMemoryService';
import { NPCMemoryContainer } from '../../../game/npc/NPCMemory';

export interface NPCPromptContext {
  npc: SimulatedNPCInstance;
  worldTime: WorldTimeInfo;
  district: string;
  relationshipPoints: number;
  memoryContainer?: NPCMemoryContainer;
  playerInput: string;
  language?: string;
}

export class NPCPromptBuilder {
  public static buildPrompt(ctx: NPCPromptContext): string {
    const { npc, worldTime, district, relationshipPoints, memoryContainer, playerInput, language = 'et' } = ctx;
    const archetypeDef = getArchetypeDefinition(npc.archetype);
    const memoryText = NPCMemoryService.buildMemoryContext(memoryContainer);

    return `Sina oled fiktsionaalne linnategelane mängus StreetBloom.
Sinu nimi: ${npc.name}
Sinu tüüp/arhetüüp: ${archetypeDef.label} (${npc.archetype})
Sinu tiitel: ${npc.title}
Asub piirkonnas: ${district}
Hetke kellaaeg/päevafaas: ${worldTime.currentTime ? worldTime.currentTime.toLocaleTimeString() : '12:00'} (${worldTime.phaseLabel})
Suhte tase mängijaga: ${relationshipPoints} punkti (-100 vaenulik, +100 sõbralik)

${memoryText}

MÄNGIJA DIALOOG: "${playerInput}"

MÄNGUREEGILD KOOSTÖÖKS:
1. Vasta oma tegelase isikupäraga eesti keeles (või vastavalt keelele: ${language}).
2. Ole autentne, kohalik, tänavapõhine ja kaasahaarav (maksimaalselt 2-3 lauset).
3. Sinu vastus peab sisaldama väljundis järgmisi struktureeritud väljasid:
   - dialogue: Sinu lausutud tekst
   - moodChange: Meeleolu muutus (-5 kuni +5)
   - relationshipDelta: Suhte muutus (-10 kuni +10)
   - suggestedAction: Üks väärtustest ("NONE", "START_QUEST", "OFFER_TRADE", "REVEAL_LOCATION")
   - locationHint: (Valikuline) Tänava või paiga nimi
   - questTitleHint: (Valikuline) Lühike ülesande eesmärk

TÄHTIS: Sina pakud VAID dialoogi ja soovitust (suggestedAction). Mängumootor kontrollib ja kinnitab kõik hinnad, tasud, tegeliku ülesande ja asukoha kehtivuse!`;
  }
}
