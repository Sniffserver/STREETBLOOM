import { GeoLocation } from '../../types/game';

export interface GPSValidationResult {
  isValid: boolean;
  reason?: string;
}

export class GPSValidation {
  /**
   * Validates if a raw GeoLocation reading is suitable for movement tracking
   */
  public static validate(
    location: GeoLocation,
    maxAccuracyMeters = 40
  ): GPSValidationResult {
    if (!location) {
      return { isValid: false, reason: 'Null or undefined location' };
    }

    if (
      typeof location.latitude !== 'number' ||
      isNaN(location.latitude) ||
      typeof location.longitude !== 'number' ||
      isNaN(location.longitude)
    ) {
      return { isValid: false, reason: 'Invalid coordinate numbers' };
    }

    if (location.latitude < -90 || location.latitude > 90) {
      return { isValid: false, reason: 'Latitude out of bounds' };
    }

    if (location.longitude < -180 || location.longitude > 180) {
      return { isValid: false, reason: 'Longitude out of bounds' };
    }

    // Skip accuracy check if simulated or manual override
    if (!location.isSimulated && location.accuracy > maxAccuracyMeters) {
      return {
        isValid: false,
        reason: `GPS accuracy ${location.accuracy}m exceeds threshold of ${maxAccuracyMeters}m`,
      };
    }

    // Stale fix check (older than 2 minutes)
    const ageMs = Date.now() - location.timestamp;
    if (ageMs > 120000 && !location.isSimulated) {
      return { isValid: false, reason: 'GPS fix is stale (>2 minutes old)' };
    }

    return { isValid: true };
  }
}
