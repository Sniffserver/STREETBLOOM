import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCSimulation, SimulatedNPCInstance } from '../game/npc/NPCSimulation';
import { GeoLocation } from '../types/game';

test('NPC State Machine & Distance Visibility Tiers', () => {
  const npc: SimulatedNPCInstance = {
    id: 'enc-test-1',
    archetype: 'WORKER',
    name: 'Jaan',
    title: 'Ehitaja',
    avatar: '👷',
    district: 'Kalamaja',
    state: 'SPAWNED',
    anchorLat: 59.4370,
    anchorLon: 24.7530,
    currentLat: 59.4370,
    currentLon: 24.7530,
    headingDegrees: 0,
    speedMs: 0.8,
    spawnTimeMs: Date.now(),
    expiresAtMs: Date.now() + 600000,
    isPersistent: false,
    currentHp: 40,
    maxHp: 40,
    attackPower: 8,
    defensePower: 5,
    tradeStock: {},
    groupMemberCount: 1,
    distanceToPlayerMeters: 80,
    visibilityTier: 'HIDDEN',
  };

  // Far away (>70m)
  const playerFar: GeoLocation = { latitude: 59.4380, longitude: 24.7550, accuracy: 5, speed: 1.2, heading: 0, timestamp: 1000 };
  NPCSimulation.updateInstance(npc, playerFar);
  assert.equal(npc.visibilityTier, 'HIDDEN');

  // Radar faint (35-70m)
  const playerFaint: GeoLocation = { latitude: 59.4374, longitude: 24.7530, accuracy: 5, speed: 1.2, heading: 0, timestamp: 2000 };
  NPCSimulation.updateInstance(npc, playerFaint);
  assert.equal(npc.visibilityTier, 'RADAR_FAINT');

  // Close / Map Visible (12-35m)
  const playerVisible: GeoLocation = { latitude: 59.4372, longitude: 24.7530, accuracy: 5, speed: 1.2, heading: 0, timestamp: 3000 };
  NPCSimulation.updateInstance(npc, playerVisible);
  assert.equal(npc.visibilityTier, 'MAP_VISIBLE');

  // Interactable (<12m)
  const playerTouch: GeoLocation = { latitude: 59.43705, longitude: 24.7530, accuracy: 5, speed: 0, heading: 0, timestamp: 4000 };
  NPCSimulation.updateInstance(npc, playerTouch);
  assert.equal(npc.visibilityTier, 'INTERACTABLE');
  assert.equal(npc.state, 'INTERACTABLE');
});
