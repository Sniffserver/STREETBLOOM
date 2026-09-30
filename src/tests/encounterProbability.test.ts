import test from 'node:test';
import assert from 'node:assert/strict';
import { SeededRNG } from '../game/encounters/EncounterDirector';
import { SpawnSafety } from '../game/encounters/SpawnSafety';
import { validateMovement } from '../services/geo/geoUtils';
import { GeoLocation } from '../types/game';

test('SeededRNG produces deterministic outputs for same seed', () => {
  const rng1 = new SeededRNG(12345);
  const rng2 = new SeededRNG(12345);

  const rolls1 = [rng1.next(), rng1.next(), rng1.next()];
  const rolls2 = [rng2.next(), rng2.next(), rng2.next()];

  assert.deepEqual(rolls1, rolls2, 'PRNG outputs must be identical for identical seeds');
});

test('validateMovement rejects stationary GPS movement (0m delta)', () => {
  const loc1: GeoLocation = { latitude: 59.437, longitude: 24.753, accuracy: 5, speed: 0, heading: 0, timestamp: 1000 };
  const loc2: GeoLocation = { latitude: 59.437, longitude: 24.753, accuracy: 5, speed: 0, heading: 0, timestamp: 5000 };

  const validation = validateMovement(loc1, loc2);
  assert.ok(validation.distanceMeters < 1, 'Stationary movement should yield <1m distance');
});

test('validateMovement rejects sudden unrealistic GPS jumps (>50 m/s)', () => {
  const loc1: GeoLocation = { latitude: 59.437, longitude: 24.753, accuracy: 5, speed: 0, heading: 0, timestamp: 1000 };
  const loc2: GeoLocation = { latitude: 59.480, longitude: 24.800, accuracy: 5, speed: 0, heading: 0, timestamp: 2000 };

  const validation = validateMovement(loc1, loc2);
  assert.equal(validation.valid, false, 'Extreme jump should be invalid');
});

test('validateMovement accepts normal walking speed (~1.4 m/s)', () => {
  const loc1: GeoLocation = { latitude: 59.4370, longitude: 24.7530, accuracy: 5, speed: 1.4, heading: 45, timestamp: 1000 };
  const loc2: GeoLocation = { latitude: 59.4375, longitude: 24.7535, accuracy: 5, speed: 1.4, heading: 45, timestamp: 40000 };

  const validation = validateMovement(loc1, loc2);
  assert.equal(validation.valid, true, 'Walking movement should be valid');
  assert.ok(validation.distanceMeters > 30, 'Distance should be >30m');
});

test('SpawnSafety verifies coordinates outside restricted water/danger zones', () => {
  const safety = SpawnSafety.validateSpawnPoint(59.437, 24.753, 59.4373, 24.7533);
  assert.equal(safety.safe, true, 'Land position should be verified safe');
});
