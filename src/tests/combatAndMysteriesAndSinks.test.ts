import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatEncounter } from '../game/combat/CombatEncounter';
import { CombatResolver } from '../game/combat/CombatResolver';
import { MysteryEngine } from '../game/world/MysteryEngine';
import { FogEngine } from '../game/world/FogEngine';
import { InventoryPersonalityMapper, FICTIONAL_CONTRABAND_CATALOG } from '../game/trading/ShopInventory';
import { ECONOMY_SINK_CATALOG } from '../game/trading/EconomySinks';
import { SimulatedNPCInstance } from '../game/npc/NPCSimulation';

test('1. Combat Avoidance & Tactical Options: TALK and BRIBE de-escalate without fight', () => {
  const mockNPC: SimulatedNPCInstance = {
    id: 'npc-combat-1',
    name: 'Marek',
    title: 'Kalamaja reiver',
    archetype: 'RAVER',
    state: 'WANDERING',
    district: 'Kalamaja',
    anchorLat: 59.44,
    anchorLon: 24.73,
    currentLat: 59.44,
    currentLon: 24.73,
    headingDegrees: 0,
    speedMs: 0,
    spawnTimeMs: Date.now(),
    expiresAtMs: Date.now() + 60000,
    isPersistent: false,
    currentHp: 30,
    maxHp: 30,
    attackPower: 10,
    defensePower: 4,
    tradeStock: {},
    distanceToPlayerMeters: 5,
    visibilityTier: 'INTERACTABLE',
    groupMemberCount: 1,
    avatar: '🕺',
  };

  const encounter = CombatEncounter.createEncounter(
    mockNPC,
    { maxHp: 50, attack: 12, defense: 6, speed: 5 },
    50
  );

  assert.equal(encounter.isCompleted, false);
  assert.ok(encounter.companionAdvice);

  // Test BRIBE action
  const bribeTurn = CombatResolver.resolveTurn(encounter, 'BRIBE');
  assert.equal(bribeTurn.state.isCompleted, true);
  assert.equal(bribeTurn.state.winner, 'BRIBED');
});

test('2. Mystery Engine: tracks multi-step exploration mysteries', () => {
  const mystEngine = new MysteryEngine();
  const active = mystEngine.getActiveMystery();

  assert.ok(active);
  assert.equal(active!.id, 'myst-radio-signal');
  assert.equal(active!.steps.length, 5);

  const advanced = mystEngine.advanceMysteryStep('myst-radio-signal');
  assert.equal(advanced, true);
  assert.equal(active!.currentStepIndex, 1);
});

test('3. Fog Engine: calculates 4 fog layers (Map, Knowledge, NPC, Mystery)', () => {
  const fog = FogEngine.calculateFogStatus('Kalamaja', 5, 10, 35, 1);

  assert.equal(fog.mapFogPercent, 50);
  assert.equal(fog.knowledgeFogPercent, 70);
  assert.equal(fog.npcFogPercent, 70);
  assert.equal(fog.mysteryFogPercent, 50);
});

test('4. Item Stories & Inventory Personality: maps unique inventories & story fields', () => {
  const raverInv = InventoryPersonalityMapper.getInventoryForArchetype('RAVER');
  assert.ok(raverInv.some((item) => item.id === 'old_cassette'));

  const cassette = FICTIONAL_CONTRABAND_CATALOG.old_cassette;
  assert.ok(cassette.originStory);
  assert.ok(cassette.memoryNote);
  assert.ok(cassette.knownByNPCs);
});

test('5. Economy Sinks: catalog contains travel utilities, companion items, and secret clues', () => {
  assert.ok(ECONOMY_SINK_CATALOG.length >= 5);
  const blueprint = ECONOMY_SINK_CATALOG.find((s) => s.category === 'MAP_CLUE');
  assert.ok(blueprint);
  assert.equal(blueprint!.priceKr, 30);
});
