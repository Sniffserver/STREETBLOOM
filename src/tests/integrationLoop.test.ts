import test from 'node:test';
import assert from 'node:assert/strict';
import { gameEngine } from '../game/engine/gameEngine';
import { npcManager } from '../game/npc/NPCManager';
import { GeoLocation } from '../types/game';

test('Living City v0.5 Integration Loop (Definition of Done)', async () => {
  // 1. Initialize Game
  const startLoc: GeoLocation = {
    latitude: 59.4370,
    longitude: 24.7530,
    accuracy: 5,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
  };
  await gameEngine.initialize(startLoc);

  // 2. Simulate GPS walking 50 meters
  const walkLoc: GeoLocation = {
    latitude: 59.4375,
    longitude: 24.7535,
    accuracy: 5,
    speed: 1.4,
    heading: 45,
    timestamp: Date.now() + 40000,
  };
  const updateRes = gameEngine.processLocationUpdate(walkLoc);

  assert.ok(updateRes.distanceWalked > 30, 'Walk distance should be >30m');

  // 3. Spawn a procedural NPC
  const spawnedNpc = npcManager.spawnProceduralNPC(
    'WORKER',
    59.4375,
    24.7535,
    'Kalamaja'
  );
  assert.ok(spawnedNpc, 'NPC should spawn');
  assert.ok(spawnedNpc.name, 'NPC should have a name');

  // 4. Record interaction and test promotion roll
  npcManager.recordInteraction(
    spawnedNpc.id,
    'helped',
    'Aitas Jaanil kadunud tööriistakasti leida',
    5,
    'positive',
    { relPoints: 10 }
  );

  const promoRes2 = npcManager.recordInteraction(
    spawnedNpc.id,
    'quest',
    'Täitis Kalamaja tänavate kaardistamise ülesande',
    5,
    'positive',
    { relPoints: 10 }
  );

  assert.equal(promoRes2.promoted, true, 'NPC should be promoted to persistent status');
  assert.equal(promoRes2.npc?.name, spawnedNpc.name, 'Promoted NPC name should match');
});
