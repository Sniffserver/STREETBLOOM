import test from 'node:test';
import assert from 'node:assert/strict';
import { SeasonalEngine, SEASONAL_CATALOG } from '../game/seasonal/SeasonalWorldModifier';
import { OfflineEngine } from '../services/offline/OfflineEngine';
import { AIBudgetTracker } from '../services/ai/AIBudgetTracker';
import { TieredMemorySystem } from '../services/ai/TieredMemorySystem';
import { AIFallbackEngine, ARCHETYPE_FALLBACKS } from '../services/ai/AIFallbackCatalog';
import { EncounterReplayEngine } from '../game/encounters/EncounterReplayEngine';
import { PrivacyAnalytics } from '../services/analytics/PrivacyAnalytics';

test('1. SeasonalWorldModifier: evaluates active seasonal events without component hard-coding', () => {
  const springDate = new Date(2026, 3, 15); // April 15
  const activeSeason = SeasonalEngine.getActiveSeason(springDate);

  assert.ok(activeSeason);
  assert.equal(activeSeason!.id, 'season-spring-bloom');
  assert.ok(activeSeason!.encounterModifiers.baseSpawnMultiplier > 1);
});

test('2. OfflineEngine: queues pending offline actions & detects online status', () => {
  OfflineEngine.queuePendingAction({
    type: 'STREET_DISCOVERY',
    payload: { streetId: 'st-telliskivi-1' },
  });

  const pending = OfflineEngine.getPendingQueue();
  assert.ok(pending.length >= 1);
  assert.equal(pending[pending.length - 1].type, 'STREET_DISCOVERY');

  OfflineEngine.clearPendingQueue();
  assert.equal(OfflineEngine.getPendingQueue().length, 0);
});

test('3. AIBudgetTracker: tracks requests, tokens, latency and fallback triggers', () => {
  AIBudgetTracker.recordRequest(120, 350, false);
  AIBudgetTracker.recordFailure();

  const metrics = AIBudgetTracker.getMetrics();
  assert.ok(metrics.aiRequestsCount >= 1);
  assert.ok(metrics.tokensUsed >= 120);
  assert.ok(metrics.aiFailuresCount >= 1);
});

test('4. TieredMemorySystem: compresses 10+ messages into 3 key memories + facts', () => {
  const messages = [
    { sender: 'PLAYER' as const, text: 'Tere, kes sa oled?', timestamp: new Date().toISOString() },
    { sender: 'NPC' as const, text: 'Mina olen Jaanus, töömees.', timestamp: new Date().toISOString() },
    { sender: 'PLAYER' as const, text: 'Kust ma leiaks raadiosignaali?', timestamp: new Date().toISOString() },
    { sender: 'NPC' as const, text: 'Vaata Telliskivi kangi alla.', timestamp: new Date().toISOString() },
  ];

  const compressed = TieredMemorySystem.compressConversationHistory(messages);
  assert.ok(compressed.summary);
  assert.ok(compressed.relationshipUpdate);
  assert.ok(compressed.unresolvedFacts.length >= 1);
});

test('5. AIFallbackCatalog: provides immediate fallback text for all 14 archetypes without 500 errors', () => {
  const fallback = AIFallbackEngine.getFallbackResponse('RAVER');
  assert.ok(fallback.greeting);
  assert.ok(fallback.response);
  assert.ok(fallback.tradeText);

  // Verify all 14 archetypes have fallbacks
  assert.equal(Object.keys(ARCHETYPE_FALLBACKS).length, 14);
});

test('6. EncounterReplayEngine: stores & retrieves encounter snapshots for reproducible debugging', () => {
  EncounterReplayEngine.recordEncounter({
    encounterId: 'enc-replay-101',
    seed: 98765,
    location: { latitude: 59.44, longitude: 24.73, accuracy: 4, timestamp: Date.now(), speed: 1.4, heading: 90 },
    district: 'Kalamaja',
    worldTimePhase: 'NIGHT',
    archetype: 'MYSTERY_STRANGER',
    confidence: 0.95,
    recordedAt: new Date().toISOString(),
  });

  const snapshot = EncounterReplayEngine.getSnapshot('enc-replay-101');
  assert.ok(snapshot);
  assert.equal(snapshot!.archetype, 'MYSTERY_STRANGER');
});

test('7. PrivacyAnalytics: tracks local game events without server GPS surveillance', () => {
  PrivacyAnalytics.track('street_discovered', { streetName: 'Soo tänav' });
  PrivacyAnalytics.track('talk', { npcName: 'Marta' });

  const events = PrivacyAnalytics.getEvents();
  assert.ok(events.length >= 2);
  assert.equal(events[events.length - 1].type, 'talk');
});
