import { GeoLocation } from '../../types/game';

export interface SyntheticWalkResult {
  simulatedMeters: number;
  stepsCount: number;
  streetsDiscovered: number;
  encountersTriggered: number;
  rareEventsTriggered: number;
}

export class WalkSimulator {
  /**
   * Simulates walking along a synthetic path in Tallinn without requiring physical walking
   */
  public static simulateWalk(
    startLoc: GeoLocation,
    distanceMeters: number,
    onStepCallback?: (loc: GeoLocation) => void
  ): SyntheticWalkResult {
    const stepSizeMeters = 10;
    const stepsCount = Math.round(distanceMeters / stepSizeMeters);
    const latDelta = 0.00009; // ~10m latitude delta

    let currentLat = startLoc.latitude;
    let currentLon = startLoc.longitude;

    let streetsDiscovered = 0;
    let encountersTriggered = 0;
    let rareEventsTriggered = 0;

    for (let i = 0; i < stepsCount; i++) {
      currentLat += latDelta;

      const loc: GeoLocation = {
        latitude: currentLat,
        longitude: currentLon,
        accuracy: 5,
        speed: 1.4,
        heading: 0,
        timestamp: Date.now() + i * 1000,
        isSimulated: true,
      };

      if (onStepCallback) {
        onStepCallback(loc);
      }

      if (i % 5 === 0) streetsDiscovered += 1;
      if (i % 12 === 0) encountersTriggered += 1;
      if (i % 30 === 0) rareEventsTriggered += 1;
    }

    return {
      simulatedMeters: distanceMeters,
      stepsCount,
      streetsDiscovered,
      encountersTriggered,
      rareEventsTriggered,
    };
  }
}
