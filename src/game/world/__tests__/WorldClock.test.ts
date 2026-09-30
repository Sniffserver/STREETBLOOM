import { WorldClock } from '../WorldClock';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runWorldClockTests(): void {
  const tallinnLat = 59.437;
  const tallinnLon = 24.7535;

  // Test 1: June Summer solstice daylight
  const juneNoon = new Date('2026-06-21T12:00:00Z');
  const juneInfo = WorldClock.getTimeInfo(tallinnLat, tallinnLon, juneNoon);
  assert(juneInfo.phase === 'DAY', 'June noon should be DAY');
  assert(juneInfo.isDaytime === true, 'June noon should be daytime');
  assert(juneInfo.sunAltitudeDegrees > 30, 'June sun altitude should be elevated');

  // Test 2: January Winter solstice noon vs night
  const janNoon = new Date('2026-01-15T12:00:00Z');
  const janNoonInfo = WorldClock.getTimeInfo(tallinnLat, tallinnLon, janNoon);
  assert(janNoonInfo.isDaytime === true, 'Jan noon should be daytime');

  const janNight = new Date('2026-01-15T21:00:00Z');
  const janNightInfo = WorldClock.getTimeInfo(tallinnLat, tallinnLon, janNight);
  assert(janNightInfo.isDaytime === false, 'Jan 21:00 should be night');

  // Test 3: Midnight / Deep Night
  const midnight = new Date('2026-09-15T23:30:00Z');
  const midnightInfo = WorldClock.getTimeInfo(tallinnLat, tallinnLon, midnight);
  assert(!midnightInfo.isDaytime, 'Midnight should not be daytime');
}
