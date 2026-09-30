import { GoogleGenAI, Type } from '@google/genai';
import { NPCPromptBuilder, NPCPromptContext } from './NPCPromptBuilder';
import { NPCDialogueResult } from './NPCResponseSchema';
import { getArchetypeDefinition } from '../../../game/npc/NPCArchetypes';

export class NPCDialogueService {
  private static aiInstance: GoogleGenAI | null = null;

  private static getAI(): GoogleGenAI | null {
    if (!this.aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '');
      if (apiKey) {
        this.aiInstance = new GoogleGenAI({ apiKey });
      }
    }
    return this.aiInstance;
  }

  /**
   * Generates interactive AI dialogue for an NPC
   */
  public static async generateResponse(ctx: NPCPromptContext): Promise<NPCDialogueResult> {
    const prompt = NPCPromptBuilder.buildPrompt(ctx);
    const ai = this.getAI();

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dialogue: { type: Type.STRING },
                moodChange: { type: Type.NUMBER },
                relationshipDelta: { type: Type.NUMBER },
                suggestedAction: {
                  type: Type.STRING,
                  enum: ['NONE', 'START_QUEST', 'OFFER_TRADE', 'REVEAL_LOCATION'],
                },
                locationHint: { type: Type.STRING },
                questTitleHint: { type: Type.STRING },
              },
              required: ['dialogue', 'moodChange', 'relationshipDelta', 'suggestedAction'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as NPCDialogueResult;
          return {
            dialogue: parsed.dialogue,
            moodChange: parsed.moodChange || 0,
            relationshipDelta: parsed.relationshipDelta || 1,
            suggestedAction: parsed.suggestedAction || 'NONE',
            locationHint: parsed.locationHint,
            questTitleHint: parsed.questTitleHint,
          };
        }
      } catch (err) {
        console.warn('Gemini dialogue generation fallback:', err);
      }
    }

    // Offline / Fallback Dialogue Generator
    const def = getArchetypeDefinition(ctx.npc.archetype);
    const fallbackLines = def.sampleDialogue;
    const randomLine = fallbackLines[Math.floor(Math.random() * fallbackLines.length)] ||
      `Tere, rändur! Linnaosades on praegu palju liikumist.`;

    let suggestedAction: NPCDialogueResult['suggestedAction'] = 'NONE';
    if (ctx.npc.archetype === 'VENDOR' || ctx.npc.archetype === 'BLACK_MARKET_TRADER') {
      suggestedAction = 'OFFER_TRADE';
    } else if (ctx.npc.archetype === 'WORKER' && Math.random() < 0.4) {
      suggestedAction = 'START_QUEST';
    }

    return {
      dialogue: randomLine,
      moodChange: 1,
      relationshipDelta: 2,
      suggestedAction,
      questTitleHint: suggestedAction === 'START_QUEST' ? `Uuri piirkonda ${ctx.district}` : undefined,
    };
  }
}
