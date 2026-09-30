import test from 'node:test';
import assert from 'node:assert/strict';
import { LookAheadEngine } from '../game/world/LookAheadEngine';
import { DailyVariationEngine } from '../game/world/DailyVariation';
import { CityPulseEngine } from '../game/world/CityPulseEngine';
import { HapticService } from '../services/haptics/hapticService';
import { SimulatedNPCInstance } from '../game/npc/NPCSimulation';

test('1. LookAheadEngine: detects upcoming NPCs and secrets 30-80m ahead', () => {
  const mockLocation = {
    latitude: 59.44,
    longitude: 24.73,
    accuracy: 4,
    timestamp: Date.now(),
    speed: 1.4,
    heading: 90,
  };

  const mockNPC: SimulatedNPCInstance = {
    id: 'npc-ahead-1',
    name: 'Jaanus',
    title: 'Ehitaja',
    archetype: 'WORKER',
    state: 'WANDERING',
    district: 'Kalamaja',
    anchorLat: 59.44,
    anchorLon: 24.7305, // ~35 meters away
    currentLat: 59.44,
    currentLon: 24.7305,
    headingDegrees: 90,
    speedMs: 1.0,
    spawnTimeMs: Date.now(),
    expiresAtMs: Date.now() + 600000,
    isPersistent: false,
    currentHp: 40,
    maxHp: 40,
    attackPower: 8,
    defensePower: 5,
    tradeStock: {},
    distanceToPlayerMeters: 35,
    visibilityTier: 'INTERACTABLE',
    groupMemberCount: 1,
    avatar: '👷',
  };

  const targets = LookAheadEngine.evaluateLookAhead(
    mockLocation,
    90,
    [mockNPC],
    []
  );

  assert.ok(targets.length > 0);
  assert.equal(targets[0].type, 'NPC_NEARBY');
  assert.ok(targets[0].label.includes('Keegi teel'));
});

test('2. DailyVariationEngine: computes deterministic daily world parameters', () => {
  const friday = new Date(2026, 8, 25); // Friday
  const monday = new Date(2026, 8, 28); // Monday

  const friMod = DailyVariationEngine.getDailyModifier('Kalamaja', friday);
  const monMod = DailyVariationEngine.getDailyModifier('Kalamaja', monday);

  assert.equal(friMod.featuredArchetype, 'RAVER');
  assert.equal(monMod.featuredArchetype, 'WORKER');
});

test('3. CityPulseEngine: calculates top-level world states behind the scenes', () => {
  const nightPulse = CityPulseEngine.calculateCityPulse(23, true, 50);
  const dayPulse = CityPulseEngine.calculateCityPulse(14, false, 50);

  assert.ok(nightPulse.pulsePercent > 0);
  assert.ok(dayPulse.pulsePercent > 0);
  assert.ok(nightPulse.titleLabel);
});

test('4. HapticService: provides light, double, and long pulse sequences', () => {
  // Verifies method calls complete without throwing
  HapticService.streetDiscovered();
  HapticService.npcEncounter();
  HapticService.rareDiscovery();
  HapticService.companionEvolution();

  assert.ok(true);
});
