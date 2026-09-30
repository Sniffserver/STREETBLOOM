import test from 'node:test';
import assert from 'node:assert/strict';
import { PriceEngine } from '../game/trading/PriceEngine';
import { TradeValidation } from '../game/trading/TradeValidation';
import { CombatEngine } from '../game/combat/CombatEngine';
import { SimulatedNPCInstance } from '../game/npc/NPCSimulation';

const createMockVendor = (): SimulatedNPCInstance => ({
  id: 'enc-vendor-1',
  archetype: 'VENDOR',
  name: 'Marta',
  title: 'Kaupmees',
  avatar: '🧺',
  district: 'Kesklinn',
  state: 'WANDERING',
  anchorLat: 59.437,
  anchorLon: 24.753,
  currentLat: 59.437,
  currentLon: 24.753,
  headingDegrees: 0,
  speedMs: 0,
  spawnTimeMs: Date.now(),
  expiresAtMs: Date.now() + 600000,
  isPersistent: false,
  currentHp: 30,
  maxHp: 30,
  attackPower: 5,
  defensePower: 3,
  tradeStock: { street_snacks: 3, vintage_lighter: 1 },
  groupMemberCount: 1,
  distanceToPlayerMeters: 5,
  visibilityTier: 'INTERACTABLE',
});

test('PriceEngine calculates dynamic discount for good relationship & mark-up for bad reputation', () => {
  const friendlyOffer = PriceEngine.calculateOffer('street_snacks', 80, 20);
  const hostileOffer = PriceEngine.calculateOffer('street_snacks', -50, -40);

  assert.ok(friendlyOffer, 'Friendly offer must exist');
  assert.ok(hostileOffer, 'Hostile offer must exist');
  assert.ok(friendlyOffer!.currentPrice < hostileOffer!.currentPrice, 'Friendly offer must be cheaper than hostile offer');
});

test('TradeValidation enforces distance constraints', () => {
  const npc = createMockVendor();
  npc.distanceToPlayerMeters = 25; // >15m limit

  const validation = TradeValidation.validateBuy(100, npc, 'street_snacks');
  assert.equal(validation.valid, false, 'Should be invalid due to distance');
  assert.ok(validation.reason?.includes('kaugel'), 'Reason should cite distance');
});

test('CombatEngine resolves turns with HP damage and modest anti-farming rewards', () => {
  const npc = createMockVendor();
  const combat = CombatEngine.startEncounter(npc, { maxHp: 50, attack: 15, defense: 5, speed: 10 }, 50);

  const turn1 = CombatEngine.executeAction(combat, 'ATTACK');
  assert.ok(turn1.playerDamageDealt > 0, 'Damage dealt should be positive');
});
