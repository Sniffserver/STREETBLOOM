import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldClock } from '../game/world/WorldClock';

test('WorldClock & Solar Calculations: Tallinn solar times for June vs January', () => {
  const tallinnLat = 59.437;
  const tallinnLon = 24.7535;

  const juneDate = new Date('2026-06-21T12:00:00Z');
  const juneInfo = WorldClock.getTimeInfo(tallinnLat, tallinnLon, juneDate);

  const janDate = new Date('2026-01-15T12:00:00Z');
  const janInfo = WorldClock.getTimeInfo(tallinnLat, tallinnLon, janDate);

  assert.ok(juneInfo.phase, 'June phase should be defined');
  assert.ok(janInfo.phase, 'January phase should be defined');
});

test('WorldClock: classifies midnight as NIGHT or DEEP_NIGHT', () => {
  const midnightDate = new Date('2026-09-15T00:30:00Z');
  const midnightInfo = WorldClock.getTimeInfo(59.437, 24.7535, midnightDate);
  assert.ok(
    midnightInfo.phase === 'NIGHT' || midnightInfo.phase === 'DEEP_NIGHT',
    'Midnight should be NIGHT or DEEP_NIGHT'
  );
});
