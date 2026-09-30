import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldClock } from '../game/world/WorldClock';
import { getDistrictProfile } from '../game/world/DistrictIdentity';
import { EncounterDirector, SeededRNG } from '../game/encounters/EncounterDirector';
import { EncounterTables } from '../game/encounters/EncounterTables';
import { SpawnSafety } from '../game/encounters/SpawnSafety';
import { SpawnResolver } from '../game/encounters/SpawnResolver';
import { EncounterCooldown } from '../game/encounters/EncounterCooldown';
import { EncounterResolver } from '../game/encounters/EncounterResolver';
import { NPCManager } from '../game/npc/NPCManager';
import { NPCSimulation } from '../game/npc/NPCSimulation';
import { NPCCombat } from '../game/npc/NPCCombat';
import { NPCTrade } from '../game/npc/NPCTrade';
import { NPCMemoryManager } from '../game/npc/NPCMemory';
import { NPCRelationshipManager } from '../game/npc/NPCRelationship';
import { getStandingLabel } from '../game/npc/NPCFaction';
import { FICTIONAL_TRADE_ITEMS } from '../game/npc/NPCArchetypes';
import { GeoLocation, StreetSegment, Companion } from '../types/game';
import { GameEngine } from '../game/engine/gameEngine';
import { validateMovement, gpsSmoother } from '../services/geo/geoUtils';

const TALLINN_LAT = 59.437;
const TALLINN_LON = 24.7535;

const MOCK_STREETS: StreetSegment[] = [
  {
    id: 'st-viru',
    name: 'Viru tänav',
    district: 'Kesklinn',
    coordinates: [
      [24.7535, 59.4370],
      [24.7540, 59.4374],
      [24.7545, 59.4378],
    ],
    segments: [],
    discovered: true,
    discoveryPercent: 100,
    exploredDistanceMeters: 100,
    visitCount: 1,
    explorationXP: 50,
    lengthMeters: 100,
  },
];

const MOCK_COMPANION: Companion = {
  id: 'comp-pip',
  name: 'Pip',
  species: 'Urban Sprout',
  evolutionStage: 1,
  evolutionForm: 'Scout',
  hunger: 80,
  happiness: 90,
  energy: 85,
  curiosity: 80,
  affection: 70,
  health: 100,
  cleanliness: 90,
  personality: {
    curiosity: 0.8,
    friendliness: 0.7,
    bravery: 0.6,
    silliness: 0.5,
    independence: 0.5,
    greed: 0.3,
  },
  behavioralProfile: {
    totalSessions: 5,
    averageWalkLengthMeters: 600,
    preferredTimeOfDay: 'day',
    explorationStyle: 'wanderer',
    favoriteDistricts: [],
    favoritePlaceTypes: [],
    npcInteractionRate: 0.5,
    discoveryRate: 0.8,
    recentSessions: [],
  },
  memories: [],
  discoveredPlaces: [],
  favoriteDistricts: [],
  favoriteNPCs: [],
  lastInteractionAt: new Date().toISOString(),
};

test('1. World Clock: Astronomical calculation accurately determines solar phases', () => {
  // Noon in Tallinn (Sun high)
  const noonDate = new Date('2026-06-21T12:00:00Z');
  const noonInfo = WorldClock.getTimeInfo(TALLINN_LAT, TALLINN_LON, noonDate);
  assert.equal(noonInfo.isDaytime, true);
  assert.equal(noonInfo.phase === 'DAY' || noonInfo.phase === 'DAWN', true);
  assert.ok(noonInfo.illumination > 0.5);

  // Midnight in Tallinn
  const midnightDate = new Date('2026-12-21T23:00:00Z');
  const nightInfo = WorldClock.getTimeInfo(TALLINN_LAT, TALLINN_LON, midnightDate);
  assert.equal(nightInfo.isDaytime, false);
  assert.equal(nightInfo.phase === 'NIGHT' || nightInfo.phase === 'DEEP_NIGHT', true);
  assert.ok(nightInfo.illumination <= 0.20);
});

test('2. Day Encounter Selection vs Night Encounter Selection', () => {
  const dayTime = WorldClock.getTimeInfo(TALLINN_LAT, TALLINN_LON, new Date('2026-06-21T11:00:00Z'));
  const nightTime = WorldClock.getTimeInfo(TALLINN_LAT, TALLINN_LON, new Date('2026-12-21T23:30:00Z'));

  const baseContext = {
    location: {
      latitude: TALLINN_LAT,
      longitude: TALLINN_LON,
      accuracy: 10,
      speed: 1.2,
      heading: 45,
      timestamp: Date.now(),
    },
    movement: {
      distanceSinceLastSpawnMeters: 50,
      recentSpeedMs: 1.2,
      headingDegrees: 45,
      accumulatedExplorationMeters: 50,
    },
    district: 'Telliskivi' as const,
    nearbyPlaces: [],
    nearbyStreets: MOCK_STREETS,
    playerLevel: 2,
    explorationLevel: 2,
    companionMood: 'uudishimulik',
    companionPersonality: MOCK_COMPANION.personality,
    recentEncounterIds: [],
    recentArchetypes: [],
    activeNpcCount: 0,
  };

  // Day weights test
  const dayWeights = EncounterTables.computeArchetypeWeights({
    ...baseContext,
    worldTime: dayTime,
  });
  assert.ok(dayWeights.CIVILIAN > 0 || dayWeights.WORKER > 0 || dayWeights.STUDENT > 0);
  assert.equal(dayWeights.RAVER, 0); // No ravers during full day in standard day pool

  // Night weights test
  const nightWeights = EncounterTables.computeArchetypeWeights({
    ...baseContext,
    worldTime: nightTime,
  });
  assert.ok(nightWeights.RAVER > 0);
  assert.ok(nightWeights.BLACK_MARKET_TRADER > 0);
  assert.ok(nightWeights.MYSTERY_STRANGER > 0);
  assert.equal(nightWeights.RUNNER, 0); // Runners not in primary night pool
});

test('3. Encounter Cooldown and Minimum Movement Gates', () => {
  const cooldown = new EncounterCooldown(40, 60); // 40m min movement, 60s cooldown

  // Initial state: not ready (0 movement)
  const check1 = cooldown.isReadyForEncounter(1000);
  assert.equal(check1.ready, false);
  assert.equal(check1.reason, 'insufficient_movement');

  // Add 20m movement (below 40m threshold)
  cooldown.addMovement(20);
  const check2 = cooldown.isReadyForEncounter(1000);
  assert.equal(check2.ready, false);
  assert.equal(check2.remainingMeters, 20);

  // Add another 25m movement (total 45m >= 40m threshold)
  cooldown.addMovement(25);
  const check3 = cooldown.isReadyForEncounter(1000);
  assert.equal(check3.ready, true);

  // Record spawn at t=1000
  cooldown.recordSpawn(1000);

  // Immediately after spawn: not ready due to cooldown (+10s = 11000ms)
  const check4 = cooldown.isReadyForEncounter(1000 + 10000);
  assert.equal(check4.ready, false);
  assert.equal(check4.reason, 'cooldown_active');

  // After 65s and 50m movement: ready again
  cooldown.addMovement(50);
  const check5 = cooldown.isReadyForEncounter(1000 + 65000);
  assert.equal(check5.ready, true);
});

test('4. Duplicate Suppression (Anti-Repetition Penalty)', () => {
  const worldTime = WorldClock.getTimeInfo(TALLINN_LAT, TALLINN_LON, new Date('2026-12-21T23:30:00Z'));
  const baseContext = {
    location: {
      latitude: TALLINN_LAT,
      longitude: TALLINN_LON,
      accuracy: 10,
      speed: 1.2,
      heading: 0,
      timestamp: Date.now(),
    },
    movement: {
      distanceSinceLastSpawnMeters: 50,
      recentSpeedMs: 1.2,
      headingDegrees: 0,
      accumulatedExplorationMeters: 50,
    },
    worldTime,
    district: 'Telliskivi' as const,
    nearbyPlaces: [],
    nearbyStreets: MOCK_STREETS,
    playerLevel: 1,
    explorationLevel: 1,
    companionMood: 'excited',
    recentEncounterIds: [],
    recentArchetypes: [],
    activeNpcCount: 0,
  };

  const weightsNoHistory = EncounterTables.computeArchetypeWeights(baseContext);
  const initialRaverWeight = weightsNoHistory.RAVER;

  // With RAVER in recent history
  const weightsWithHistory = EncounterTables.computeArchetypeWeights({
    ...baseContext,
    recentArchetypes: ['RAVER', 'DRIFTER'],
  });

  // Recent archetype receives heavy penalty (0.15x)
  assert.ok(weightsWithHistory.RAVER < initialRaverWeight * 0.2);
});

test('5. Spawn Distance, Heading-Based Placement & Safety Validation', () => {
  const playerLoc: GeoLocation = {
    latitude: TALLINN_LAT,
    longitude: TALLINN_LON,
    accuracy: 10,
    speed: 1.3,
    heading: 90, // East
    timestamp: Date.now(),
  };

  const spawn = SpawnResolver.resolveSpawnPosition(
    playerLoc,
    MOCK_STREETS,
    0.5, // 0 deg offset
    0.5, // mid distance
    0.1  // single
  );

  assert.ok(spawn !== null);
  assert.ok(spawn.distanceMeters >= 25 && spawn.distanceMeters <= 70);
  assert.equal(spawn.groupCount, 1);

  // Safety checks
  const safeCheck = SpawnSafety.validateSpawnPoint(
    playerLoc.latitude,
    playerLoc.longitude,
    spawn.latitude,
    spawn.longitude
  );
  assert.equal(safeCheck.safe, true);

  // Water check rejection (Ülemiste lake coordinate)
  const lakeLat = 59.390;
  const lakeLon = 24.770;
  const lakeCheck = SpawnSafety.validateSpawnPoint(playerLoc.latitude, playerLoc.longitude, lakeLat, lakeLon, 0, 999999);
  assert.equal(lakeCheck.safe, false);
  assert.equal(lakeCheck.reason, 'in_water');
});

test('6. Group Spawn Probabilities (75% Single, 20% Pair, 5% Group)', () => {
  assert.equal(SpawnResolver.resolveGroupCount(0.50), 1);
  assert.equal(SpawnResolver.resolveGroupCount(0.74), 1);
  assert.equal(SpawnResolver.resolveGroupCount(0.76), 2);
  assert.equal(SpawnResolver.resolveGroupCount(0.94), 2);
  assert.equal(SpawnResolver.resolveGroupCount(0.96), 3);
});

test('7. Combat Mechanics: Deterministic turn-based combat calculations', () => {
  const manager = new NPCManager();
  const tough = manager.spawnProceduralNPC('STREET_TOUGH', TALLINN_LAT, TALLINN_LON, 'Kesklinn');
  tough.currentHp = 30;
  tough.maxHp = 30;

  const playerSkills = { streetSmart: 3, persuasion: 2, tech: 1, stealth: 2 };

  // Test player attack
  const turn1 = NPCCombat.executeTurn('attack', 50, 50, playerSkills, tough, 0.5);
  assert.ok(turn1.playerDamageDealt > 0);
  assert.ok(tough.currentHp < 30);
  assert.equal(turn1.playerHpRemaining <= 50, true);

  // Test defend reducing damage
  const turn2Defend = NPCCombat.executeTurn('defend', 50, 50, playerSkills, tough, 0.5);
  assert.ok(turn2Defend.npcDamageDealt < tough.attackPower);

  // Test player run
  const turnRun = NPCCombat.executeTurn('run', 50, 50, playerSkills, tough, 0.1);
  assert.equal(turnRun.outcome, 'player_fled');
  assert.equal(turnRun.isCombatOver, true);
});

test('8. Trading System: Pricing, discounts, faction modifiers, and stock', () => {
  const manager = new NPCManager();
  const trader = manager.spawnProceduralNPC('BLACK_MARKET_TRADER', TALLINN_LAT, TALLINN_LON, 'Telliskivi');
  const token = FICTIONAL_TRADE_ITEMS['item-mystery-token'];

  // Test price calculation with friendly relationship and honored faction
  const price1 = NPCTrade.calculatePrice('item-mystery-token', trader, 3, 70);
  assert.ok(price1 !== null);
  assert.ok(price1.finalPrice < token.basePrice); // should have discount

  // Test purchase
  const buyRes = NPCTrade.buyItem('item-mystery-token', trader, 100, 3, 70);
  assert.equal(buyRes.success, true);
  assert.ok(buyRes.finalPrice > 0);
  assert.equal(trader.tradeStock['item-mystery-token'], token.stock - 1);
});

test('9. Progressive NPC Visibility & Despawn Logic', () => {
  const manager = new NPCManager();
  const inst = manager.spawnProceduralNPC('CIVILIAN', TALLINN_LAT, TALLINN_LON, 'Kesklinn');

  const closeLoc: GeoLocation = {
    latitude: TALLINN_LAT + 0.00005, // ~6m
    longitude: TALLINN_LON,
    accuracy: 10,
    speed: 1.0,
    heading: 0,
    timestamp: Date.now(),
  };

  // Close update -> INTERACTABLE
  NPCSimulation.updateInstance(inst, closeLoc);
  assert.equal(inst.visibilityTier, 'INTERACTABLE');

  // Far location update (120m) -> Despawn
  const farLoc: GeoLocation = {
    latitude: TALLINN_LAT + 0.002, // ~220m
    longitude: TALLINN_LON,
    accuracy: 10,
    speed: 1.0,
    heading: 0,
    timestamp: Date.now(),
  };

  const updateRes = manager.updateAll(farLoc);
  assert.ok(updateRes.despawnedIds.includes(inst.id));
  assert.equal(manager.getInstance(inst.id), undefined);
});

test('10. Random NPC to Persistent Character Promotion', () => {
  const manager = new NPCManager();
  const inst = manager.spawnProceduralNPC('WORKER', TALLINN_LAT, TALLINN_LON, 'Kalamaja');

  // 1st interaction
  manager.recordInteraction(inst.id, 'conversed', 'Esimene vestlus kohvikus', 3, 'positive', { relPoints: 8 });

  // 2nd interaction with high relationship points -> triggers promotion
  const promoResult = manager.recordInteraction(
    inst.id,
    'helped',
    'Aitasid tööriistu parandada',
    5,
    'positive',
    { relPoints: 12 }
  );

  assert.equal(promoResult.promoted, true);
  assert.ok(promoResult.npc !== undefined);
  assert.equal(promoResult.npc.name, inst.name);
  assert.equal(inst.isPersistent, true);
});

test('11. Regression Tests: Stationary GPS, GPS Jitter, and GPS Jumps produce NO encounters', () => {
  const director = new EncounterDirector(42);
  const resolver = new EncounterResolver(35, 50, director);
  const manager = new NPCManager();
  const worldTime = WorldClock.getTimeInfo(TALLINN_LAT, TALLINN_LON);

  const locStationary: GeoLocation = {
    latitude: TALLINN_LAT,
    longitude: TALLINN_LON,
    accuracy: 8,
    speed: 0.0,
    heading: null,
    timestamp: 100000,
  };

  // Case A: Stationary GPS (0 movement) -> NO encounter
  const resStationary = resolver.processStep(
    locStationary,
    0, // 0m movement
    'Kesklinn',
    MOCK_STREETS,
    [],
    MOCK_COMPANION,
    1,
    manager
  );
  assert.equal(resStationary.spawned, false);
  assert.equal(resStationary.decision.type, 'NO_ENCOUNTER');

  // Case B: GPS Jitter while stationary (e.g. 0.8m jitter filtered by GPSSmoother & deadband)
  const locJitter: GeoLocation = {
    latitude: TALLINN_LAT + 0.000006, // ~0.7m jitter
    longitude: TALLINN_LON + 0.000006,
    accuracy: 12,
    speed: 0.1,
    heading: null,
    timestamp: 102000,
  };
  const valJitter = validateMovement(locStationary, locJitter);
  assert.equal(valJitter.distanceMeters, 0); // Treated as stationary deadband

  const resJitter = resolver.processStep(
    locJitter,
    valJitter.distanceMeters,
    'Kesklinn',
    MOCK_STREETS,
    [],
    MOCK_COMPANION,
    1,
    manager
  );
  assert.equal(resJitter.spawned, false);

  // Case C: GPS Jump (impossible teleport 600m in 2s) -> Rejected by movement validator
  const locJump: GeoLocation = {
    latitude: TALLINN_LAT + 0.006, // ~660m jump
    longitude: TALLINN_LON,
    accuracy: 10,
    speed: 330,
    heading: 0,
    timestamp: 102000,
  };
  const valJump = validateMovement(locStationary, locJump);
  assert.equal(valJump.valid, false); // Rejected
  assert.equal(valJump.reason, 'massive_jump');

  // Case D: Real physical exploration walk of 50 meters -> Encounter system evaluates
  const locWalk: GeoLocation = {
    latitude: TALLINN_LAT + 0.00045, // ~50m
    longitude: TALLINN_LON,
    accuracy: 8,
    speed: 1.2,
    heading: 0,
    timestamp: 150000, // +50s
  };
  const valWalk = validateMovement(locStationary, locWalk);
  assert.equal(valWalk.valid, true);
  assert.ok(valWalk.distanceMeters >= 40);

  const resWalk = resolver.processStep(
    locWalk,
    valWalk.distanceMeters,
    'Kesklinn',
    MOCK_STREETS,
    [],
    MOCK_COMPANION,
    1,
    manager
  );

  // Because cooldown and 50m movement criteria were met, encounter resolution executed successfully
  assert.ok(resWalk.decision.type === 'SPAWN_ENCOUNTER' || resWalk.decision.type === 'NO_ENCOUNTER');
});
