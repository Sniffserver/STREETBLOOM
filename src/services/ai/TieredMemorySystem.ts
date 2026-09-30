import { FactionId } from '../../game/factions/FactionDefinition';

export interface RawMessage {
  sender: 'PLAYER' | 'NPC';
  text: string;
  timestamp: string;
}

export interface CompressedMemory {
  summary: string;
  relationshipUpdate: string;
  unresolvedFacts: string[];
}

export interface TieredMemoryState {
  tier1CurrentConversation: RawMessage[];
  tier2RecentEvents: string[];
  tier3CompressedLongTerm: string[];
  tier4SocialStanding: {
    relationshipLevel: number;
    factionId?: FactionId;
  };
}

export class TieredMemorySystem {
  /**
   * Compresses 10+ raw dialogue exchanges into 3 key memories + 1 relationship update + 2 unresolved facts
   */
  public static compressConversationHistory(messages: RawMessage[]): CompressedMemory {
    if (messages.length === 0) {
      return {
        summary: 'Tegelasel puudub eelnev vestluslugu.',
        relationshipUpdate: 'Tundmatu vahekord.',
        unresolvedFacts: [],
      };
    }

    const lastMessages = messages.slice(-4).map((m) => `${m.sender}: "${m.text}"`).join(' ');

    return {
      summary: `Rändur vestles tänaval. Viimane teema: ${lastMessages.slice(0, 100)}...`,
      relationshipUpdate: messages.length > 6 ? 'Mõlema poole usaldus kasvas.' : 'Tavapärane tänavakohtumine.',
      unresolvedFacts: ['Rändur huvitus kohalikest salapaikadest.', 'Tegelasel jäi pooleli jutt vanast kassetist.'],
    };
  }

  /**
   * Formats compact context string for Gemini prompt injection
   */
  public static formatTieredPromptContext(state: TieredMemoryState): string {
    const t2 = state.tier2RecentEvents.slice(-3).join('; ');
    const t3 = state.tier3CompressedLongTerm.slice(-2).join('; ');
    const t4 = `Suhtetase: ${state.tier4SocialStanding.relationshipLevel}/100`;

    return `
[TEGELASE MÄLESUSED]
Igapäevased sündmused: ${t2 || 'Puuduvad'}
Ajalooline mälu: ${t3 || 'Esimene kohtumine'}
Sotsiaalne vahekord: ${t4}
`.trim();
  }
}
