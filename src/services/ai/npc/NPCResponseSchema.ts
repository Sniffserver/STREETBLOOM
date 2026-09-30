import { z } from 'zod';

export type SuggestedNPCAction =
  | 'NONE'
  | 'START_QUEST'
  | 'OFFER_TRADE'
  | 'REVEAL_LOCATION';

export interface NPCDialogueResult {
  dialogue: string;
  moodChange: number; // -5 to +5
  relationshipDelta: number; // -10 to +10
  suggestedAction: SuggestedNPCAction;
  locationHint?: string;
  questTitleHint?: string;
}

export const NPCDialogueSchema = z.object({
  dialogue: z.string().describe('Character spoken dialogue in Estonian or requested language'),
  moodChange: z.number().min(-5).max(5).default(0),
  relationshipDelta: z.number().min(-10).max(10).default(1),
  suggestedAction: z.enum(['NONE', 'START_QUEST', 'OFFER_TRADE', 'REVEAL_LOCATION']).default('NONE'),
  locationHint: z.string().optional().describe('Street or place name if location revealed'),
  questTitleHint: z.string().optional().describe('Short quest objective if quest offered'),
});
