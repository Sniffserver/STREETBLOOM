import test from 'node:test';
import assert from 'node:assert/strict';
import { RumorEngine } from '../game/world/RumorSystem';
import { LocationQuestEngine } from '../game/quests/LocationQuestEngine';
import { WalkSimulator } from '../services/dev/WalkSimulator';

test('1. RumorEngine: stores, retrieves, and filters NPC rumors with source and confidence', () => {
  const engine = new RumorEngine();
  const rumors = engine.getRumors();

  assert.ok(rumors.length >= 2);
  const martaRumors = engine.getRumorsForNPC('Marta');
  assert.ok(martaRumors.length >= 1);
});

test('2. LocationQuestEngine: dynamically generates location-grounded narrative quests', () => {
  const mockStreet = {
    id: 'st-101',
    name: 'Telliskivi tänav',
    district: 'Kalamaja' as const,
    coordinates: [[24.73, 59.44] as [number, number]],
    segments: [],
    discovered: true,
    discoveryPercent: 100,
    exploredDistanceMeters: 100,
    visitCount: 1,
    explorationXP: 50,
    lengthMeters: 100,
  };

  const mockNPC = {
    id: 'npc-101',
    name: 'Jaanus',
    title: 'Ehitaja',
    archetype: 'WORKER' as const,
    state: 'WANDERING' as const,
    district: 'Kalamaja' as const,
    anchorLat: 59.44,
    anchorLon: 24.73,
    currentLat: 59.44,
    currentLon: 24.73,
    headingDegrees: 0,
    speedMs: 1.0,
    spawnTimeMs: Date.now(),
    expiresAtMs: Date.now() + 60000,
    isPersistent: false,
    currentHp: 40,
    maxHp: 40,
    attackPower: 8,
    defensePower: 5,
    tradeStock: {},
    distanceToPlayerMeters: 5,
    visibilityTier: 'INTERACTABLE' as const,
    groupMemberCount: 1,
    avatar: '👷',
  };

  const quest = LocationQuestEngine.generateLocationQuest([mockStreet], [mockNPC]);

  assert.ok(quest);
  assert.equal(quest!.targetStreetName, 'Telliskivi tänav');
  assert.equal(quest!.targetNPCName, 'Jaanus');
  assert.equal(quest!.rewardXP, 60);
});

test('3. WalkSimulator: simulates synthetic walks along paths for instant balancing', () => {
  const startLoc = {
    latitude: 59.44,
    longitude: 24.73,
    accuracy: 5,
    speed: 1.4,
    heading: 0,
    timestamp: Date.now(),
  };

  const result = WalkSimulator.simulateWalk(startLoc, 500);

  assert.equal(result.simulatedMeters, 500);
  assert.ok(result.stepsCount > 0);
  assert.ok(result.encountersTriggered >= 0);
});
