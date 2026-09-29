import test from 'node:test';
import assert from 'node:assert';
import {
  haversineDistanceMeters,
  pointToSegmentDistanceMeters,
  pointToPolylineDistanceMeters,
  buildStreetSubSegments,
  computeMovementAlongSegment,
  checkPlayerTraversedSegment,
  calculatePolylineLengthMeters,
  validateMovement,
  maskLocationForPrivacy,
  gpsSmoother,
} from '../services/geo/geoUtils';
import { GameEngine } from '../game/engine/gameEngine';
import { GeoLocation } from '../types/game';

test('haversineDistanceMeters calculates accurate distance', () => {
  // Tallinn Viru Gate to Raekoja Plats ~370m
  const dist = haversineDistanceMeters(59.4368, 24.7500, 59.4373, 24.7451);
  assert.ok(dist > 250 && dist < 450, `Distance ${dist} should be around ~320m`);
});

test('pointToPolylineDistanceMeters detects point on or near street', () => {
  const line: [number, number][] = [
    [24.7495, 59.4368],
    [24.7475, 59.4371],
    [24.7450, 59.4373],
  ];
  // Point directly on segment
  const distOnLine = pointToPolylineDistanceMeters(59.4371, 24.7475, line);
  assert.ok(distOnLine < 1, `Point on line should have distance near 0, got ${distOnLine}`);

  // Point ~20m away
  const distNear = pointToPolylineDistanceMeters(59.4373, 24.7475, line);
  assert.ok(distNear < 35, `Point near line should be within 35m`);
});

test('buildStreetSubSegments and checkPlayerTraversedSegment', () => {
  const coords: [number, number][] = [
    [24.7495, 59.4368],
    [24.7475, 59.4371],
    [24.7450, 59.4373],
  ];
  const subSegments = buildStreetSubSegments('st-test', coords);
  assert.strictEqual(subSegments.length, 2, 'Should create 2 discrete subsegments');
  assert.ok(subSegments[0].lengthMeters > 50, 'Subsegment should have realistic length in meters');

  // Player at midpoint of subsegment 0
  const isTraversed = checkPlayerTraversedSegment(59.43695, 24.7485, subSegments[0], 28);
  assert.strictEqual(isTraversed, true, 'Player should be detected as traversing subsegment 0');

  // Player far away
  const farAway = checkPlayerTraversedSegment(59.4500, 24.7600, subSegments[0], 28);
  assert.strictEqual(farAway, false, 'Far away player should not traverse subsegment');
});

test('validateMovement detects impossible teleportation and speeds', () => {
  const loc1: GeoLocation = {
    latitude: 59.4368,
    longitude: 24.7500,
    accuracy: 5,
    speed: 1.2,
    heading: 0,
    timestamp: 100000,
  };

  // Normal walking 10 meters in 8 seconds
  const loc2: GeoLocation = {
    latitude: 59.4369,
    longitude: 24.7501,
    accuracy: 5,
    speed: 1.3,
    heading: 0,
    timestamp: 108000,
  };
  const validRes = validateMovement(loc1, loc2);
  assert.strictEqual(validRes.valid, true);

  // Impossible jump 1km in 1 second
  const loc3: GeoLocation = {
    latitude: 59.4468,
    longitude: 24.7600,
    accuracy: 5,
    speed: 200,
    heading: 0,
    timestamp: 101000,
  };
  const invalidRes = validateMovement(loc1, loc3);
  assert.strictEqual(invalidRes.valid, false);
});

test('maskLocationForPrivacy rounds coordinates when active', () => {
  const unmasked = maskLocationForPrivacy(59.4368123, 24.7501984, false);
  assert.strictEqual(unmasked.lat, 59.4368123);

  const masked = maskLocationForPrivacy(59.4368123, 24.7501984, true);
  assert.strictEqual(masked.lat, 59.437);
  assert.strictEqual(masked.lon, 24.75);
});

test('Companion care interactions and behavioral profile grounding', () => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  const engine = new GameEngine();
  const initialHappiness = engine.getCompanion().happiness;

  engine.petCompanion();
  assert.ok(
    engine.getCompanion().happiness >= initialHappiness,
    'Petting should increase or maintain companion happiness'
  );

  const feedRes = engine.feedCompanion();
  assert.strictEqual(feedRes.success, true);
  assert.ok(engine.getCompanion().hunger > 50);

  const thought = engine.talkCompanion();
  assert.ok(typeof thought === 'string' && thought.length > 5, 'Pip should speak a grounded thought');
  assert.ok(engine.getCompanion().behavioralProfile !== undefined, 'Pip should have a behavioral profile');
});

test('Quest progress tracking and XP calculation', () => {
  const engine = new GameEngine();
  const initialXP = engine.getProfile().explorationXP;

  engine.addExplorationXP(50);
  assert.strictEqual(engine.getProfile().explorationXP, initialXP + 50);
});

test('computeMovementAlongSegment measures physical traversal without mock radius triggers', () => {
  const coords: [number, number][] = [
    [24.7495, 59.4368], // p1
    [24.7450, 59.4373], // p2 (~250m long segment)
  ];
  const sub = buildStreetSubSegments('st-geo-test', coords)[0];
  assert.ok(sub.lengthMeters > 200, 'Segment should be over 200m');

  // Case 1: First fix standing on the segment -> in corridor, but 0 traversal
  const stationaryFix = computeMovementAlongSegment(
    null,
    null,
    59.4369,
    24.7485,
    sub,
    24,
    0.50
  );
  assert.strictEqual(stationaryFix.inCorridor, true);
  assert.strictEqual(stationaryFix.distanceAlongSegmentMeters, 0, 'Stationary player must not accumulate advance');
  assert.strictEqual(stationaryFix.isNowExplored, false, 'Stationary presence must not auto-discover street');

  // Case 2: Player walks 60m along the segment corridor
  // Point A on segment: lon 24.7485, lat 59.4369
  // Point B on segment: lon 24.7475, lat 59.4370
  const walkStep1 = computeMovementAlongSegment(
    59.4369,
    24.7485,
    59.4370,
    24.7475,
    sub,
    24,
    0.50
  );
  assert.strictEqual(walkStep1.inCorridor, true);
  assert.ok(walkStep1.distanceAlongSegmentMeters > 40, 'Walking along street axis should advance meters');
  assert.ok(walkStep1.newTraversedTotalMeters >= walkStep1.distanceAlongSegmentMeters);
  assert.strictEqual(walkStep1.isNowExplored, false, '60m on 250m segment is ~24%, not yet explored');

  // Case 3: Player moves perpendicular and far away (> 50m off corridor)
  const offCorridor = computeMovementAlongSegment(
    59.4370,
    24.7475,
    59.4385, // shifted far north
    24.7475,
    sub,
    24,
    0.50
  );
  assert.strictEqual(offCorridor.inCorridor, false);
  assert.strictEqual(offCorridor.distanceAlongSegmentMeters, 0);

  // Case 4: Reaching completion threshold (50%) marks isNowExplored = true
  sub.traversedDistanceMeters = sub.lengthMeters * 0.45;
  const completingStep = computeMovementAlongSegment(
    59.4370,
    24.7475,
    59.4372,
    24.7460,
    sub,
    24,
    0.50
  );
  assert.strictEqual(completingStep.inCorridor, true);
  assert.strictEqual(completingStep.isNowExplored, true, 'Surpassing 50% must mark segment explored');
});

test('GPSSmoother filters stationary noise jitter and smooths pedestrian motion', () => {
  gpsSmoother.reset(59.4368, 24.7500);

  // Minor jitter 0.8m while stationary
  const jitterFix: GeoLocation = {
    latitude: 59.436805,
    longitude: 24.750005,
    accuracy: 6,
    speed: 0.1,
    heading: 0,
    timestamp: Date.now(),
    isSimulated: false,
  };

  const smoothed = gpsSmoother.smooth(jitterFix);
  assert.strictEqual(smoothed.latitude, 59.4368, 'Jitter below deadband must be suppressed');
  assert.strictEqual(smoothed.longitude, 24.7500, 'Jitter below deadband must be suppressed');
});

// SECTION 27: COMPREHENSIVE GEOMETRY TEST SUITE
test('Geometry Suite Case 1: Player outside corridor produces 0 traversal', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370],
  ];
  const sub = buildStreetSubSegments('st-case-1', coords)[0];
  // 80 meters north of the segment corridor
  const res = computeMovementAlongSegment(59.4378, 24.7510, 59.4378, 24.7520, sub, 24);
  assert.strictEqual(res.inCorridor, false);
  assert.strictEqual(res.distanceAlongSegmentMeters, 0);
  assert.strictEqual(res.newTraversedTotalMeters, 0);
});

test('Geometry Suite Case 2: Player inside corridor but stationary produces 0 traversal', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370],
  ];
  const sub = buildStreetSubSegments('st-case-2', coords)[0];
  // Same coordinate (stationary)
  const res = computeMovementAlongSegment(59.4370, 24.7510, 59.4370, 24.7510, sub, 24);
  assert.strictEqual(res.inCorridor, true);
  assert.strictEqual(res.distanceAlongSegmentMeters, 0);
  assert.strictEqual(res.newTraversedTotalMeters, 0);
});

test('Geometry Suite Case 3: Player walks 10m along segment produces ~10m traversal', () => {
  // East-west street along latitude 59.4370
  // At latitude 59.4370, 1 degree longitude is ~6371000 * cos(59.4370 deg) * (pi/180) ≈ 56500m
  // 10m ≈ 0.000177 degrees
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370], // ~282m long
  ];
  const sub = buildStreetSubSegments('st-case-3', coords)[0];
  const lon1 = 24.751000;
  const lon2 = 24.751177; // ~10m walk east
  const res = computeMovementAlongSegment(59.4370, lon1, 59.4370, lon2, sub, 24);
  assert.strictEqual(res.inCorridor, true);
  assert.ok(res.distanceAlongSegmentMeters >= 9.0 && res.distanceAlongSegmentMeters <= 11.0, `Expected ~10m, got ${res.distanceAlongSegmentMeters}`);
  assert.ok(res.newTraversedTotalMeters >= 9.0 && res.newTraversedTotalMeters <= 11.0);
});

test('Geometry Suite Case 4: Player moves perpendicular across street produces little/no longitudinal traversal', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370],
  ];
  const sub = buildStreetSubSegments('st-case-4', coords)[0];
  // Moving purely north-south across the street (from 10m south to 10m north) at same longitude
  const res = computeMovementAlongSegment(59.4369, 24.7520, 59.4371, 24.7520, sub, 24);
  assert.strictEqual(res.inCorridor, true);
  assert.strictEqual(res.distanceAlongSegmentMeters, 0, 'Perpendicular cross must produce 0 longitudinal progress');
});

test('Geometry Suite Case 5: Player enters middle of segment records only actual local traversal', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370], // ~280m segment
  ];
  const sub = buildStreetSubSegments('st-case-5', coords)[0];
  // Player steps in at midpoint t=0.5 (24.7525) and walks ~15m east to 24.75276
  const res = computeMovementAlongSegment(59.4370, 24.75250, 59.4370, 24.75276, sub, 24);
  assert.strictEqual(res.inCorridor, true);
  assert.ok(res.distanceAlongSegmentMeters >= 13 && res.distanceAlongSegmentMeters <= 17);
  assert.strictEqual(res.isNowExplored, false, '15m in middle of 280m street must not mark explored');
});

test('Geometry Suite Case 6: Player jumps 500m due to GPS glitch is rejected', () => {
  const prevLoc: GeoLocation = {
    latitude: 59.4370,
    longitude: 24.7500,
    accuracy: 5,
    speed: 1.2,
    heading: 0,
    timestamp: 1000000,
  };
  const glitchLoc: GeoLocation = {
    latitude: 59.4420, // ~550m jump
    longitude: 24.7500,
    accuracy: 5,
    speed: 100,
    heading: 0,
    timestamp: 1002000, // in 2 seconds
  };
  const validation = validateMovement(prevLoc, glitchLoc);
  assert.strictEqual(validation.valid, false, '500m glitch jump must be rejected');
});

test('Geometry Suite Case 7: Player walks backwards does not create fake forward accumulation', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370],
  ];
  const sub = buildStreetSubSegments('st-case-7', coords)[0];

  // Step 1: Forward 30m east
  const step1 = computeMovementAlongSegment(59.4370, 24.7510, 59.4370, 24.7515, sub, 24);
  const traversedAfterStep1 = step1.newTraversedTotalMeters;
  assert.ok(traversedAfterStep1 > 20);
  sub.traversedDistanceMeters = traversedAfterStep1;

  // Step 2: Backward 30m west (retracing same path)
  const step2 = computeMovementAlongSegment(59.4370, 24.7515, 59.4370, 24.7510, sub, 24);
  assert.strictEqual(step2.distanceAlongSegmentMeters, 0, 'Retracing already-covered ground must not add new traversal');
  assert.strictEqual(step2.newTraversedTotalMeters, traversedAfterStep1, 'Total traversed meters must remain unchanged');
});

test('Geometry Suite Case 8: GPS jitter while stationary does not accumulate traversal', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7550, 59.4370],
  ];
  const sub = buildStreetSubSegments('st-case-8', coords)[0];

  // Oscillate back and forth 5 times by 0.5m
  for (let i = 0; i < 5; i++) {
    const latA = 59.437000;
    const latB = 59.437004; // ~0.45m
    const res = computeMovementAlongSegment(latA, 24.7510, latB, 24.7510, sub, 24);
    assert.strictEqual(res.distanceAlongSegmentMeters, 0, 'Stationary jitter must produce 0 traversal');
    sub.traversedDistanceMeters = res.newTraversedTotalMeters;
  }
  assert.strictEqual(sub.traversedDistanceMeters, 0, 'Total traversed meters after jitter must stay 0');
});

test('Geometry Suite Case 9: Player crosses between two neighboring subsegments', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370], // p0
    [24.7525, 59.4370], // p1 (sub 0 end, sub 1 start)
    [24.7550, 59.4370], // p2 (sub 1 end)
  ];
  const subs = buildStreetSubSegments('st-case-9', coords);
  assert.strictEqual(subs.length, 2);

  // Player walks from near end of sub 0 (24.7523) to beginning of sub 1 (24.7527)
  const resSub0 = computeMovementAlongSegment(59.4370, 24.7523, 59.4370, 24.7527, subs[0], 24);
  const resSub1 = computeMovementAlongSegment(59.4370, 24.7523, 59.4370, 24.7527, subs[1], 24);

  // Both subsegments should only receive their portion of the displacement
  assert.ok(resSub0.distanceAlongSegmentMeters > 0 && resSub0.distanceAlongSegmentMeters < 15);
  assert.ok(resSub1.distanceAlongSegmentMeters > 0 && resSub1.distanceAlongSegmentMeters < 15);
});

// SECTION 28: REGRESSION TEST FOR ORIGINAL PROXIMITY BUG
test('Section 28 Regression Test: Proximity does NOT discover street; actual physical walking DOES', () => {
  const coords: [number, number][] = [
    [24.7500, 59.4370],
    [24.7540, 59.4370], // ~225m street
  ];
  const sub = buildStreetSubSegments('st-proximity-test', coords)[0];

  // 1. Player starts 22m beside the unexplored street and steps into corridor without moving along it
  const nearFix1 = computeMovementAlongSegment(
    null,
    null,
    59.43718, // 20m north of street
    24.7510,
    sub,
    24,
    0.50
  );
  assert.strictEqual(nearFix1.inCorridor, true);
  assert.strictEqual(nearFix1.distanceAlongSegmentMeters, 0, 'Entering corridor must not award traversal');
  assert.strictEqual(nearFix1.isNowExplored, false, 'Street must remain undiscovered on proximity');

  // 2. Player remains near the street (stationary in proximity)
  const nearFix2 = computeMovementAlongSegment(
    59.43718,
    24.7510,
    59.43718,
    24.7510,
    sub,
    24,
    0.50
  );
  assert.strictEqual(nearFix2.distanceAlongSegmentMeters, 0);
  assert.strictEqual(nearFix2.isNowExplored, false, 'Proximity without walking must keep street undiscovered');

  // 3. Now player physically walks 120m along the street corridor (surpassing 50% threshold of 225m)
  sub.traversedDistanceMeters = 0;
  // 120m along 59.4370 is ~0.00212 degrees lon
  const walkAlong = computeMovementAlongSegment(
    59.4370,
    24.7510,
    59.4370,
    24.7532,
    sub,
    24,
    0.50
  );
  assert.strictEqual(walkAlong.inCorridor, true);
  assert.ok(walkAlong.distanceAlongSegmentMeters > 100, 'Physically walking along street increases traversal');
  assert.strictEqual(walkAlong.isNowExplored, true, 'Surpassing physical traversal threshold discovers the street');
});
