import { DistrictName, GeoLocation } from '../../types/game';
import { DISTRICT_PROFILES } from './DistrictIdentity';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';

// Approximate centroid coordinates for Tallinn districts
const DISTRICT_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  OldTown: { lat: 59.437, lon: 24.7453 },
  'Old Town': { lat: 59.437, lon: 24.7453 },
  Kesklinn: { lat: 59.4331, lon: 24.7542 },
  Kalamaja: { lat: 59.4448, lon: 24.7381 },
  Telliskivi: { lat: 59.4395, lon: 24.7292 },
  Kadriorg: { lat: 59.4385, lon: 24.7821 },
  Pirita: { lat: 59.4667, lon: 24.8333 },
};

export class DistrictResolver {
  /**
   * Resolves district name based on latitude/longitude
   */
  public static resolveDistrict(location: GeoLocation): DistrictName {
    if (!location) return 'Kesklinn';

    let nearestDistrict: DistrictName = 'Kesklinn';
    let minDistance = Infinity;

    for (const [name, centroid] of Object.entries(DISTRICT_CENTROIDS)) {
      const dist = haversineDistanceMeters(
        location.latitude,
        location.longitude,
        centroid.lat,
        centroid.lon
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestDistrict = name;
      }
    }

    return nearestDistrict;
  }
}
