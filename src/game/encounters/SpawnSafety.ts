import { haversineDistanceMeters } from '../../services/geo/geoUtils';

// Tallinn Water / Bay Bounding Boxes (e.g. Tallinn Bay, Kopli Bay, Lake Ülemiste)
const WATER_AND_RESTRICTED_AREAS: Array<{
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  label: string;
}> = [
  // Lake Ülemiste (restricted water catchment)
  { minLat: 59.378, maxLat: 59.405, minLon: 24.745, maxLon: 24.795, label: 'Ülemiste järv (water/restricted)' },
  // Tallinn Bay North of harbor
  { minLat: 59.460, maxLat: 59.520, minLon: 24.680, maxLon: 24.850, label: 'Tallinna laht (open sea)' },
  // Kopli Bay water area
  { minLat: 59.435, maxLat: 59.465, minLon: 24.640, maxLon: 24.690, label: 'Kopli laht (sea water)' },
];

export interface SafetyCheckResult {
  safe: boolean;
  reason?:
    | 'too_close'
    | 'too_far'
    | 'in_water'
    | 'dangerous_infrastructure'
    | 'out_of_bounds';
}

export class SpawnSafety {
  /**
   * Validates if a proposed spawn coordinate is physically safe, accessible, and not in water/hazard areas
   */
  public static validateSpawnPoint(
    playerLat: number,
    playerLon: number,
    candidateLat: number,
    candidateLon: number,
    minDistMeters = 25,
    maxDistMeters = 70
  ): SafetyCheckResult {
    const dist = haversineDistanceMeters(
      playerLat,
      playerLon,
      candidateLat,
      candidateLon
    );

    // 1. Distance check
    if (dist < minDistMeters) {
      return { safe: false, reason: 'too_close' };
    }
    if (dist > maxDistMeters) {
      return { safe: false, reason: 'too_far' };
    }

    // 2. Water / Restricted area check
    for (const zone of WATER_AND_RESTRICTED_AREAS) {
      if (
        candidateLat >= zone.minLat &&
        candidateLat <= zone.maxLat &&
        candidateLon >= zone.minLon &&
        candidateLon <= zone.maxLon
      ) {
        return { safe: false, reason: 'in_water' };
      }
    }

    // 3. Coordinate sanity check
    if (
      isNaN(candidateLat) ||
      isNaN(candidateLon) ||
      candidateLat < -90 ||
      candidateLat > 90 ||
      candidateLon < -180 ||
      candidateLon > 180
    ) {
      return { safe: false, reason: 'out_of_bounds' };
    }

    return { safe: true };
  }
}
