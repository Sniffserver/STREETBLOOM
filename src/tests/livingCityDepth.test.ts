import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCRoutineEngine, ARCHETYPE_DAILY_GOALS } from '../game/npc/NPCRoutineEngine';
import { DISTRICT_IDENTITIES, DistrictResolver } from '../game/world/DistrictIdentity';
import { DistrictReputationEngine } from '../game/world/DistrictReputationEngine';
import { DiscoveryLayerEngine } from '../game/world/DiscoveryLayers';
import { StreetMemoryEngine } from '../game/world/StreetMemory';
import { SimulatedNPCInstance } from '../game/npc/NPCSimulation';

test('1. NPCRoutineEngine: resolves daily goals for Worker, Vendor, Raver', () => {
  const mockWorker: SimulatedNPCInstance = {
    id: 'npc-w1',
    name: 'Jaanus',
    archetype: 'WORKER',
    state: 'WANDERING',
    district: 'Kalamaja',
    anchorLat: 59.44,
    anchorLon: 24.73,
    currentLat: 59.44,
    currentLon: 24.73,
    headingDegrees: 90,
    speedMs: 1.2,
    spawnTimeMs: Date.now(),
    expiresAtMs: Date.now() + 600000,
    isPersistent: false,
    currentHp: 40,
    maxHp: 40,
    attackPower: 8,
    defensePower: 5,
    tradeStock: {},
    distanceToPlayerMeters: 20,
    visibilityTier: 'INTERACTABLE',
    groupMemberCount: 1,
    avatar: '👷',
    title: 'Ehitusmees',
  };

  // 08:00 -> Work
  const workActivity = NPCRoutineEngine.resolveActivity(mockWorker, 9);
  assert.equal(workActivity.activity, 'WORK');
  assert.equal(workActivity.interruption, 'NONE');

  // 12:00 -> Lunch
  const lunchActivity = NPCRoutineEngine.resolveActivity(mockWorker, 12);
  assert.equal(lunchActivity.activity, 'LUNCH');

  // Active Quest Interruption
  const questActivity = NPCRoutineEngine.resolveActivity(mockWorker, 9, {
    hasActiveQuestWithNPC: true,
  });
  assert.equal(questActivity.activity, 'QUEST_WAITING');
  assert.equal(questActivity.interruption, 'ACTIVE_QUEST');
});

test('2. DistrictProfile & Identity: contains social, nightlife, commercial, residential breakdown', () => {
  const kalamaja = DistrictResolver.getIdentity('Kalamaja');
  assert.equal(kalamaja.name, 'Kalamaja');
  assert.equal(kalamaja.residential, 8);
  assert.equal(kalamaja.nightlife, 9);
  assert.ok(kalamaja.encounterBias.RAVER > 1.0);

  const kesklinn = DistrictResolver.getIdentity('Kesklinn');
  assert.equal(kesklinn.commercial, 10);
  assert.equal(kesklinn.socialDensity, 9);
});

test('3. DistrictReputationEngine: calculates tiers, discount perks and rare spawn multipliers', () => {
  const repEngine = new DistrictReputationEngine({ Kalamaja: 34, Kesklinn: 15, Kopli: 5 });

  const kalamajaStanding = repEngine.getStandingInfo('Kalamaja');
  assert.equal(kalamajaStanding.tier, 'RESPECTED_RESIDENT');
  assert.equal(kalamajaStanding.perks.discountPercent, 12);
  assert.equal(kalamajaStanding.perks.rareSpawnMultiplier, 1.5);
  assert.equal(kalamajaStanding.perks.unlocksSecretLocations, true);

  const upgrade = repEngine.addReputation('Kalamaja', 20); // 34 + 20 = 54
  assert.equal(upgrade.newPoints, 54);
  assert.equal(upgrade.tierUpgraded, true);
  assert.equal(upgrade.standing.tier, 'NEIGHBORHOOD_HERO');
  assert.equal(upgrade.standing.perks.discountPercent, 20);
});

test('4. DiscoveryLayerEngine: tracks 5-layer discovery system', () => {
  const layerEngine = new DiscoveryLayerEngine();
  const progress = layerEngine.evaluateProgress('Kalamaja', 35);

  assert.equal(progress.layer2AreaUnderstood, true);
  assert.equal(progress.currentDiscoveryScore > 0, true);
});

test('5. StreetMemoryEngine: logs personal memories like "Met Marta here"', () => {
  const memoryEngine = new StreetMemoryEngine();

  memoryEngine.recordVisit('str-1', 'Soo tänav', 'Kalamaja');
  memoryEngine.recordEventMemory(
    'str-1',
    'Soo tänav',
    'Kalamaja',
    'Kohtumine: Marta',
    'Sa kohtusid siin tänaval Martaga esimest korda.',
    'NPC_MEETING',
    'npc-marta'
  );

  const mem = memoryEngine.getMemory('str-1');
  assert.ok(mem);
  assert.equal(mem!.visitCount, 1);
  assert.equal(mem!.keyMemories.length, 1);
  assert.equal(mem!.keyMemories[0].title, 'Kohtumine: Marta');
  assert.equal(mem!.keyMemories[0].type, 'NPC_MEETING');
});
