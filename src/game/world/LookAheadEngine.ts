import { GeoLocation, StreetSegment } from '../../types/game';
import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { haversineDistanceMeters } from '../../services/geo/geoUtils';

export interface LookAheadTarget {
  id: string;
  type: 'COMPANION_INTEREST' | 'NPC_NEARBY' | 'UNKNOWN_SECRET' | 'RARE_ENCOUNTER';
  label: string;
  icon: string;
  distanceMeters: number;
  bearingDegrees: number;
}

export class LookAheadEngine {
  /**
   * Projects 30–80m along player's current heading to detect nearby upcoming nodes
   */
  public static evaluateLookAhead(
    location: GeoLocation,
    headingDegrees: number | null,
    simulatedNPCs: SimulatedNPCInstance[],
    streets: StreetSegment[]
  ): LookAheadTarget[] {
    const targets: LookAheadTarget[] = [];
    const validHeading = headingDegrees !== null && headingDegrees !== undefined ? headingDegrees : 0;

    // 1. Scan for NPCs 25-80m ahead
    simulatedNPCs.forEach((npc) => {
      const dist = haversineDistanceMeters(
        location.latitude,
        location.longitude,
        npc.currentLat,
        npc.currentLon
      );

      if (dist >= 25 && dist <= 85) {
        const isRare = npc.archetype === 'MYSTERY_STRANGER' || npc.archetype === 'BLACK_MARKET_TRADER';
        targets.push({
          id: `ahead-npc-${npc.id}`,
          type: isRare ? 'RARE_ENCOUNTER' : 'NPC_NEARBY',
          label: isRare ? '✨ Haruldane kohtumine ees' : '👤 Keegi teel eespool',
          icon: isRare ? '✨' : '👤',
          distanceMeters: Math.round(dist),
          bearingDegrees: validHeading,
        });
      }
    });

    // 2. Scan for undiscovered street segments or secret spots 30-80m ahead
    streets.forEach((st) => {
      if (!st.discovered && st.coordinates.length > 0) {
        const [lon, lat] = st.coordinates[0];
        const dist = haversineDistanceMeters(
          location.latitude,
          location.longitude,
          lat,
          lon
        );

        if (dist >= 30 && dist <= 80) {
          targets.push({
            id: `ahead-st-${st.id}`,
            type: 'UNKNOWN_SECRET',
            label: '🐾 Tundmatu tänavanurk ees',
            icon: '🐾',
            distanceMeters: Math.round(dist),
            bearingDegrees: validHeading,
          });
        }
      }
    });

    // Return top 2 look-ahead targets sorted by proximity
    return targets.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 2);
  }
}
