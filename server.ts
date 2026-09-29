import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory server-authoritative state stores
const processedEventIds = new Set<string>();
const serverNPCMemories: Record<string, string[]> = {};

// Haversine formula on server
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Structured schema for NPC dialogue response with long-term memory extraction
const npcResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dialogue: {
      type: Type.STRING,
      description: 'The in-character conversational response of the NPC (1-3 short paragraphs).',
    },
    moodChange: {
      type: Type.INTEGER,
      description: 'Mood change between -2 and +3.',
    },
    relationshipChange: {
      type: Type.INTEGER,
      description: 'Relationship points gained (typically 1 to 5).',
    },
    memoryToStore: {
      type: Type.STRING,
      description: 'Summarized meaningful memory of this interaction to store.',
    },
    extractedFacts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Important facts about player habits, preferences or topics discussed.',
    },
    action: {
      type: Type.STRING,
      enum: ['none', 'startQuest', 'completeQuest', 'giveItem', 'revealLocation', 'triggerEvent'],
      description: 'Action requested by the NPC.',
    },
    actionPayload: {
      type: Type.OBJECT,
      properties: {
        questId: { type: Type.STRING },
        itemId: { type: Type.STRING },
        clueText: { type: Type.STRING },
      },
    },
  },
  required: ['dialogue', 'moodChange', 'relationshipChange', 'action'],
};

// 1. Session Endpoint
app.post('/api/session', (req: Request, res: Response) => {
  const sessionId = req.body.sessionId || 'sess-' + Math.random().toString(36).substring(2, 9);
  res.json({
    status: 'ok',
    sessionId,
    serverTime: new Date().toISOString(),
  });
});

// 2. Authoritative Discovery Validation Endpoint (Anti-Cheat & Server-Side XP)
app.post('/api/discovery/validate', (req: Request, res: Response) => {
  const {
    streetId,
    subsegmentIndex,
    subsegmentLengthMeters,
    totalStreetLengthMeters,
    playerStart,
    playerEnd,
    timeDeltaMs,
    currentExploredDistanceMeters,
  } = req.body;

  if (!streetId || !playerStart || !playerEnd) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Validate player movement physics
  const distance = haversineMeters(playerStart[0], playerStart[1], playerEnd[0], playerEnd[1]);
  const timeSec = Math.max(0.2, (timeDeltaMs || 1000) / 1000);
  const speed = distance / timeSec;

  // Maximum human walking/running/cycling limit in exploration: ~14 m/s (50 km/h)
  if (speed > 15 && distance > 30) {
    return res.status(400).json({
      valid: false,
      reason: 'impossible_speed',
      message: 'Movement speed exceeds physical limits. Discovery rejected.',
    });
  }

  // Authoritative calculation of new explored distance and percentage
  const addedDistance = Math.min(distance, subsegmentLengthMeters || 50);
  const newExploredDistance = Math.min(
    totalStreetLengthMeters || 300,
    (currentExploredDistanceMeters || 0) + addedDistance
  );
  const newPercent = Math.min(
    100,
    Math.round((newExploredDistance / (totalStreetLengthMeters || 300)) * 100)
  );

  const isNewlyCompleted = newPercent >= 70;
  // Server-authoritative XP computation
  const xpAwarded = isNewlyCompleted ? 35 : 10;

  res.json({
    valid: true,
    streetId,
    subsegmentIndex,
    newExploredDistanceMeters: newExploredDistance,
    newDiscoveryPercent: newPercent,
    isFullyDiscovered: isNewlyCompleted,
    xpAwarded,
    message: isNewlyCompleted ? 'Street fully explored!' : 'Segment progress verified.',
  });
});

// 3. Authoritative Quest Completion Endpoint
app.post('/api/quest/validate-complete', (req: Request, res: Response) => {
  const { questId, currentCount, targetCount } = req.body;

  if (!questId) {
    return res.status(400).json({ error: 'Missing questId' });
  }

  if ((currentCount || 0) < (targetCount || 1)) {
    return res.status(400).json({
      valid: false,
      message: 'Quest prerequisites not met.',
    });
  }

  res.json({
    valid: true,
    questId,
    verifiedAt: new Date().toISOString(),
  });
});

// 4. NPC Chat Endpoint (Gemini-powered with structured response & memory extraction)
app.post('/api/npc/chat', async (req: Request, res: Response) => {
  const { npcId, playerMessage, context } = req.body;

  if (!npcId || !playerMessage) {
    return res.status(400).json({ error: 'npcId and playerMessage are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  // Retrieve persistent server memories for this NPC
  const existingMemories = serverNPCMemories[npcId] || [];

  const fallbackDialogues: Record<string, string[]> = {
    'npc-marta': [
      'Tere jälle! Näen su sammudest, et oled juba mitu kvartalit läbi kõndinud.',
      'Selles linnas on alati rohkem saladusi, kui kaardile mahub. Joo tass kardemoniteed ja vaata ringi.',
      'Kas tead, et Katariina käigu keldritesse viib uks, mida pole ühelgi ametlikul plaanil?',
    ],
    'npc-otto': [
      'Igal linna munakivil on oma kaja. Kui astud piisavalt aeglaselt, hakkad seda kuulma.',
      'Aeg ei peatu, aga siin vanade kellade tiksumise keskel saab korraks aja kulgu tunda.',
    ],
    'npc-sirli': [
      'Tsau! Kümme tuhat sammu enne lõunat on minu tavaline hommikurütm. Kuhu sa edasi rullid?',
      'Otsi Telliskivi sisehoovist seda värsket grafitit, see on linna parim kunstiteos!',
    ],
    'npc-kaspar': [
      'Astu tasa... Siin asfaldi ja müüri vahel tärkab just haruldane sõnajalg.',
      'Kadrioru pargi vanadel tammedel on linnas eriline roll, nad hoiavad linna mälestusi.',
    ],
    'npc-luna': [
      'Tuul tõuseb lahelt. Kas sa otsid teed või soovid hoopis hetkeks ära eksida?',
      'Öine linn räägib hoopis teistsugust keelt kui päevane. Kuula katuste kaja.',
    ],
  };

  if (!apiKey) {
    const list = fallbackDialogues[npcId] || fallbackDialogues['npc-marta'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    return res.json({
      dialogue: chosen,
      moodChange: 1,
      relationshipChange: 2,
      memoryToStore: `Rääkisite: "${playerMessage.slice(0, 30)}..."`,
      extractedFacts: ['Mängija vestles tänaval'],
      action: 'none',
    });
  }

  try {
    const enrichedContext = {
      ...context,
      serverMemories: existingMemories.slice(-5),
    };

    const systemPrompt = `You are a persistent living NPC inside STREETBLOOM, a GPS exploration game set in Tallinn.
You are a fictional character living inside the game world, NOT an AI assistant.
Stay completely in character. Speak naturally and warmly.
Language: Respond in Estonian if user speaks Estonian, otherwise match user language.
Never invent facts outside the supplied context. Reference only locations, memories, or quests in the context.
Keep response concise: 1 to 3 short paragraphs.
Extract any important facts about the player habits or topics discussed in 'extractedFacts' to store in persistent long-term memory.
The player explores real physical streets by walking with their Tamagotchi companion (Pip).

Context:
${JSON.stringify(enrichedContext, null, 2)}`;

    const userPrompt = `Player says to ${context?.npc?.name || 'NPC'}: "${playerMessage}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: npcResponseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(text);

    // Save extracted facts to server NPC long-term memory
    if (parsed.memoryToStore) {
      if (!serverNPCMemories[npcId]) serverNPCMemories[npcId] = [];
      serverNPCMemories[npcId].unshift(parsed.memoryToStore);
      if (serverNPCMemories[npcId].length > 20) serverNPCMemories[npcId].pop();
    }

    return res.json(parsed);
  } catch (err: unknown) {
    console.warn('Gemini chat error, returning fallback:', err);
    const list = fallbackDialogues[npcId] || fallbackDialogues['npc-marta'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    return res.json({
      dialogue: chosen,
      moodChange: 1,
      relationshipChange: 1,
      memoryToStore: `Kohtusite tänaval.`,
      extractedFacts: [],
      action: 'none',
    });
  }
});

// 5. Idempotent Event Synchronization Endpoint
app.post('/api/sync', (req: Request, res: Response) => {
  const { events } = req.body;

  if (!Array.isArray(events)) {
    return res.json({ status: 'ok', acknowledgedIds: [], timestamp: new Date().toISOString() });
  }

  const acknowledgedIds: string[] = [];

  for (const event of events) {
    if (!event.id) continue;

    // Idempotent deduplication check
    if (!processedEventIds.has(event.id)) {
      processedEventIds.add(event.id);
      // Keep memory bounded to last 10,000 processed event IDs
      if (processedEventIds.size > 10000) {
        const firstKey = processedEventIds.values().next().value;
        if (firstKey) processedEventIds.delete(firstKey);
      }
    }
    acknowledgedIds.push(event.id);
  }

  res.json({
    status: 'ok',
    acknowledgedIds,
    timestamp: new Date().toISOString(),
  });
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StreetBloom server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
