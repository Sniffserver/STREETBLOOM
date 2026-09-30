import { GeoLocation, StreetSegment } from '../../types/game';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';
import { SpawnSafety } from './SpawnSafety';

export interface ResolvedSpawnLocation {
  latitude: number;
  longitude: number;
  distanceMeters: number;
  headingDegrees: number;
  matchedStreetId?: string;
  groupCount: number; // 1 (75%), 2 (20%), 3 (5%)
}

export class SpawnResolver {
  /**
   * Resolves group size based on game design probabilities: 75% single, 20% pair, 5% group
   */
  public static resolveGroupCount(rngRoll: number): number {
    if (rngRoll < 0.75) return 1;
    if (rngRoll < 0.95) return 2;
    return 3;
  }

  /**
   * Calculates a spawn position 25-70 meters from player, preferring heading direction ±(5°-25°)
   * and snapping along walkable street corridors when available.
   */
  public static resolveSpawnPosition(
    playerLoc: GeoLocation,
    nearbyStreets: StreetSegment[],
    rngHeadingOffset: number, // 0.0 to 1.0 (maps to -25° to +25°)
    rngDist: number,          // 0.0 to 1.0 (maps to 28m to 65m)
    rngGroup: number          // 0.0 to 1.0
  ): ResolvedSpawnLocation | null {
    const groupCount = this.resolveGroupCount(rngGroup);
    const targetDist = 28 + rngDist * 35; // 28m to 63m

    // Determine base heading (use player heading if available, otherwise default to randomized forward arc)
    const baseHeading = playerLoc.heading !== null && playerLoc.heading !== undefined
      ? playerLoc.heading
      : Math.floor(rngDist * 360);

    // Prefer 5-25 degrees around movement heading
    const angleOffset = (rngHeadingOffset - 0.5) * 40; // -20 to +20 deg
    const finalHeading = (baseHeading + angleOffset + 360) % 360;

    // 1. Try to find candidate coordinate on nearby street polyline in target distance range
    let bestStreetCoord: { lat: number; lon: number; streetId: string } | null = null;
    let minStreetDiff = Infinity;

    for (const street of nearbyStreets) {
      if (!street.coordinates || street.coordinates.length === 0) continue;
      for (const [sLon, sLat] of street.coordinates) {
        const d = haversineDistanceMeters(playerLoc.latitude, playerLoc.longitude, sLat, sLon);
        if (d >= 25 && d <= 70) {
          const diff = Math.abs(d - targetDist);
          if (diff < minStreetDiff) {
            const safety = SpawnSafety.validateSpawnPoint(
              playerLoc.latitude,
              playerLoc.longitude,
              sLat,
              sLon
            );
            if (safety.safe) {
              minStreetDiff = diff;
              bestStreetCoord = { lat: sLat, lon: sLon, streetId: street.id };
            }
          }
        }
      }
    }

    if (bestStreetCoord) {
      const d = haversineDistanceMeters(
        playerLoc.latitude,
        playerLoc.longitude,
        bestStreetCoord.lat,
        bestStreetCoord.lon
      );
      return {
        latitude: bestStreetCoord.lat,
        longitude: bestStreetCoord.lon,
        distanceMeters: Math.round(d),
        headingDegrees: finalHeading,
        matchedStreetId: bestStreetCoord.streetId,
        groupCount,
      };
    }

    // 2. Trigonometric projection in heading direction
    const rad = (finalHeading * Math.PI) / 180;
    const dLat = (targetDist / 111000) * Math.cos(rad);
    const dLon =
      (targetDist / (111000 * Math.max(0.1, Math.cos((playerLoc.latitude * Math.PI) / 180)))) *
      Math.sin(rad);

    const candidateLat = playerLoc.latitude + dLat;
    const candidateLon = playerLoc.longitude + dLon;

    const safety = SpawnSafety.validateSpawnPoint(
      playerLoc.latitude,
      playerLoc.longitude,
      candidateLat,
      candidateLon
    );

    if (safety.safe) {
      return {
        latitude: candidateLat,
        longitude: candidateLon,
        distanceMeters: Math.round(targetDist),
        headingDegrees: finalHeading,
        groupCount,
      };
    }

    return null;
  }
}
