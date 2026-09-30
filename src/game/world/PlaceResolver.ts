import { Place, GeoLocation } from '../../types/game';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';

export interface PlaceContext {
  place: Place;
  distanceMeters: number;
  isNearby: boolean; // within 100m
}

export class PlaceResolver {
  /**
   * Resolves places within proximity of player location
   */
  public static resolveNearbyPlaces(
    location: GeoLocation,
    places: Place[],
    maxRadiusMeters = 200
  ): PlaceContext[] {
    if (!location || !places) return [];

    return places
      .map((place) => {
        const dist = haversineDistanceMeters(
          location.latitude,
          location.longitude,
          place.latitude,
          place.longitude
        );
        return {
          place,
          distanceMeters: Math.round(dist),
          isNearby: dist <= 100,
        };
      })
      .filter((ctx) => ctx.distanceMeters <= maxRadiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}
