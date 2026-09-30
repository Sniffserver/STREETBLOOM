import { GeoLocation } from '../../types/game';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';

export interface MeaningfulMovementEvent {
  timestamp: number;
  previous: GeoLocation;
  current: GeoLocation;
  displacementMeters: number;
  walkingMeters: number;
  heading?: number;
  speedMps?: number;
  accuracyMeters: number;
  isMeaningful: boolean;
}

export class MovementAnalyzer {
  private lastAcceptedLocation: GeoLocation | null = null;
  private minDisplacementThresholdMeters: number;
  private maxAllowedSpeedMps: number; // Speed cap (12 m/s = ~43 km/h to filter transit jumps)

  constructor(minDisplacementMeters = 5, maxSpeedMps = 12) {
    this.minDisplacementThresholdMeters = minDisplacementMeters;
    this.maxAllowedSpeedMps = maxSpeedMps;
  }

  /**
   * Analyzes candidate location and calculates displacement/walking metrics
   */
  public analyze(current: GeoLocation): MeaningfulMovementEvent {
    const timestamp = current.timestamp || Date.now();

    if (!this.lastAcceptedLocation) {
      this.lastAcceptedLocation = { ...current };
      return {
        timestamp,
        previous: current,
        current,
        displacementMeters: 0,
        walkingMeters: 0,
        heading: current.heading ?? undefined,
        speedMps: current.speed ?? 0,
        accuracyMeters: current.accuracy,
        isMeaningful: true,
      };
    }

    const prev = this.lastAcceptedLocation;
    const distanceMeters = haversineDistanceMeters(
      prev.latitude,
      prev.longitude,
      current.latitude,
      current.longitude
    );

    const timeDeltaSec = Math.max(0.1, (timestamp - prev.timestamp) / 1000);
    const calculatedSpeedMps = current.speed ?? distanceMeters / timeDeltaSec;

    // Check if movement exceeds noise threshold and doesn't exceed teleport speed cap
    const exceedsThreshold = distanceMeters >= this.minDisplacementThresholdMeters;
    const isWithinSpeedCap =
      current.isSimulated || current.isTeleport || calculatedSpeedMps <= this.maxAllowedSpeedMps;

    const isMeaningful = exceedsThreshold && isWithinSpeedCap;

    if (isMeaningful) {
      this.lastAcceptedLocation = { ...current };
    }

    return {
      timestamp,
      previous: prev,
      current,
      displacementMeters: distanceMeters,
      walkingMeters: isMeaningful ? distanceMeters : 0,
      heading: current.heading ?? undefined,
      speedMps: calculatedSpeedMps,
      accuracyMeters: current.accuracy,
      isMeaningful,
    };
  }

  public reset(location?: GeoLocation): void {
    this.lastAcceptedLocation = location ? { ...location } : null;
  }
}
