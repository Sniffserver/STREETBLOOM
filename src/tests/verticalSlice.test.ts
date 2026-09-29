import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../game/engine/gameEngine';
import {
  getDeterministicSpawnForDistrict,
  generateInteractionChoices,
  getCurrentTimeSlot,
} from '../services/npc/spawnService';
import { SEED_NPCS } from '../data/npcsSeed';
import { InteractionCommand } from '../types/game';

test('Vertical Slice Loop: Full 5-minute journey with 3 actions and idempotency', async () => {
  const engine = new GameEngine();
  await engine.initialize({
    latitude: 59.437,
    longitude: 24.7535,
    accuracy: 10,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
  });

  const initialProfile = engine.getProfile();
  const initialCash = initialProfile.cash;
  const initialTurns = initialProfile.actionTurns;
  const initialReputation = initialProfile.reputation;

  // 1. Derive deterministic spawn for Kesklinn
  const timeSlot = getCurrentTimeSlot();
  const spawn = getDeterministicSpawnForDistrict('Kesklinn', timeSlot, engine.getNPCs());
  assert.ok(spawn, 'Active spawn should exist for Kesklinn');
  assert.ok(spawn.spawnId.startsWith('spn-'), 'Spawn ID should be deterministically hashed');

  // 2. Execute Action 1: Safe Job (p=1.0, R=24, C=0, L=0)
  const jobChoice = spawn.choices?.find((c) => c.category === 'small_job') || spawn.choices?.[0];
  assert.ok(jobChoice, 'Safe job choice must exist');

  const interactionId1 = `int-test-job-${Date.now()}`;
  const command1: InteractionCommand = {
    interactionId: interactionId1,
    spawnId: spawn.spawnId,
    actionId: jobChoice.id,
    clientTime: new Date().toISOString(),
  };

  const res1 = await engine.executeInteraction(command1);
  assert.equal(res1.success, true, 'Safe job must succeed');
  assert.equal(res1.cashDelta, 24, 'Cash delta must be +24 kr');
  assert.equal(res1.turnCost, 1, 'Turn cost must be 1');
  assert.equal(engine.getProfile().cash, initialCash + 24, 'Profile cash must increase by 24 kr');
  assert.equal(engine.getProfile().actionTurns, initialTurns - 1, 'Action turns must decrease by 1');

  // 3. Idempotency test: retry the same interactionId
  const res1Retry = await engine.executeInteraction(command1);
  assert.equal(res1Retry.success, false, 'Duplicate interaction must be rejected');
  assert.equal(res1Retry.cashDelta, 0, 'No cash awarded on duplicate attempt');
  assert.equal(engine.getProfile().cash, initialCash + 24, 'Cash balance must not change on duplicate');

  // 4. Execute Action 2: Trade (p=1.0, R=38, C=12 => Net=26)
  const tradeChoice = spawn.choices?.find((c) => c.category === 'trade');
  assert.ok(tradeChoice, 'Trade choice must exist');

  const interactionId2 = `int-test-trade-${Date.now()}`;
  const currentCash = engine.getProfile().cash;
  const currentTurns = engine.getProfile().actionTurns;

  const res2 = await engine.executeInteraction({
    interactionId: interactionId2,
    spawnId: spawn.spawnId,
    actionId: tradeChoice.id,
    clientTime: new Date().toISOString(),
  });

  assert.equal(res2.success, true, 'Trade must succeed');
  assert.equal(res2.cashDelta, 26, 'Net cash gain must be +26 kr (38 - 12)');
  assert.equal(engine.getProfile().cash, currentCash + 26, 'Profile cash must reflect net profit');
  assert.equal(engine.getProfile().actionTurns, currentTurns - 1, 'Turn cost must be deducted');

  // 5. Execute Action 3: Risky Gig (daily limit G=3)
  const gigChoice = spawn.choices?.find((c) => c.category === 'risk_gig');
  assert.ok(gigChoice, 'Risky gig choice must exist');

  const interactionId3 = `int-test-gig-${Date.now()}`;
  const res3 = await engine.executeInteraction({
    interactionId: interactionId3,
    spawnId: spawn.spawnId,
    actionId: gigChoice.id,
    clientTime: new Date().toISOString(),
  });

  assert.ok(res3.turnCost === 2, 'Risky gig requires 2 turns');
  assert.ok(
    engine.getProfile().dailyRiskGigsPerformedToday! >= 1,
    'Daily risk gigs count must increment'
  );
});

test('Vertical Slice Branching: Prior choices alter NPC memory and unlock content', async () => {
  const engine = new GameEngine();
  await engine.initialize({
    latitude: 59.437,
    longitude: 24.7535,
    accuracy: 10,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
  });

  const marta = engine.getNPCs().find((n) => n.id === 'npc-marta');
  assert.ok(marta, 'Marta must exist in seed NPCs');

  // Execute small job
  const spawnId = 'spn-marta-branch-test';
  const choicesBefore = generateInteractionChoices('npc-marta', spawnId, marta);
  const initialChoicesCount = choicesBefore.length;

  // Add courier success secret to simulate player completing the courier arc
  marta.knownSecrets.push('PROVEN_COURIER');
  marta.memories.unshift('Valik: Riskantne ots - Õnnestus (+ 65 kr)');

  const choicesAfter = generateInteractionChoices('npc-marta', spawnId, marta);
  assert.ok(
    choicesAfter.length > initialChoicesCount,
    'Unlocked courier action must appear after player proves themselves'
  );

  const unlockedChoice = choicesAfter.find((c) => c.id.includes('master-courier'));
  assert.ok(unlockedChoice, 'Master courier quest must be unlocked');
  assert.equal(unlockedChoice.cashReward, 45, 'Special quest provides 45 kr reward');
});

test('GPS Availability & Radar Fallback Path', () => {
  const engine = new GameEngine();

  // Test high accuracy GPS fix
  const highAccuracyLoc = {
    latitude: 59.437,
    longitude: 24.7535,
    accuracy: 8,
    speed: 1.2,
    heading: 45,
    timestamp: Date.now(),
  };
  assert.equal(engine.getAccuracyTier(highAccuracyLoc), 'HIGH');

  // Test degraded GPS fix (e.g. urban canyon or indoor fallback)
  const degradedLoc = {
    latitude: 59.437,
    longitude: 24.7535,
    accuracy: 95,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
  };
  assert.equal(engine.getAccuracyTier(degradedLoc), 'POOR');

  // Controlled simulated teleport
  const outcome = engine.processLocationUpdate({
    ...highAccuracyLoc,
    isSimulated: true,
  });
  assert.ok(outcome, 'Process location update works cleanly across all GPS states');
});
