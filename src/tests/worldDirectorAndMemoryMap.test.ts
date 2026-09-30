import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanionBehaviorEngine } from '../game/companion/CompanionBehavior';
import { MicroEventEngine } from '../game/events/MicroEventEngine';
import { WorldDirector } from '../game/world/WorldDirector';
import { WorldClock } from '../game/world/WorldClock';

test('1. CompanionBehaviorEngine: tracks exploration & organically evolves into EXPLORER', () => {
  const compEngine = new CompanionBehaviorEngine();

  // Simulate discovering 10 streets
  for (let i = 0; i < 10; i++) {
    compEngine.recordStreetDiscovered();
  }

  const stats = compEngine.getStats();
  assert.equal(stats.streetsDiscoveredCount, 10);
  assert.equal(stats.evolution, 'EXPLORER');
  assert.ok(stats.evolutionUnlockedAt);
});

test('2. CompanionBehaviorEngine: develops favorite district preferences', () => {
  const compEngine = new CompanionBehaviorEngine();

  // Simulate visiting Kalamaja 6 times
  for (let i = 0; i < 6; i++) {
    compEngine.recordStreetTraversal('Kalamaja', false);
  }

  const stats = compEngine.getStats();
  assert.equal(stats.favoriteDistrict, 'Kalamaja');

  const suggestion = compEngine.generateSuggestion('Kesklinn', false);
  assert.ok(suggestion.text.includes('Kalamaja'));
});

test('3. MicroEventEngine: catalog contains 5-30 second texture events', () => {
  const micro = MicroEventEngine.rollMicroEvent('Kalamaja', false);
  if (micro) {
    assert.ok(micro.durationSeconds >= 5 && micro.durationSeconds <= 30);
    assert.ok(micro.title);
  }
});

test('4. WorldDirector: orchestrates encounters, micro-events and companion suggestions', () => {
  const worldDir = new WorldDirector();
  const timeInfo = WorldClock.getTimeInfo(59.44, 24.73);

  const context = {
    location: { latitude: 59.44, longitude: 24.73, accuracy: 5, timestamp: Date.now(), speed: 1.4, heading: 90 },
    district: 'Kalamaja' as const,
    worldTime: timeInfo,
    movement: { distanceSinceLastSpawnMeters: 60, recentSpeedMs: 1.4, headingDegrees: 90, accumulatedExplorationMeters: 100 },
    activeNpcCount: 0,
    nearbyStreets: [],
    nearbyPlaces: [],
    playerLevel: 1,
    explorationLevel: 1,
    companionMood: 'happy',
    recentEncounterIds: [],
    recentArchetypes: [],
  };

  const result = worldDir.evaluateWorldState(context);
  assert.ok(result.category);
  assert.ok(result.narrativeText);
});
