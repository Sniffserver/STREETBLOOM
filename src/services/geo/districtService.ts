import { DistrictName, AccuracyTier, GeoLocation } from '../../types/game';
import { haversineDistanceMeters } from './geoUtils';

export interface DistrictBoundary {
  name: DistrictName;
  centerLat: number;
  centerLon: number;
  radiusMeters: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  atmosphere: string;
}

export const TALLINN_DISTRICTS: Record<string, DistrictBoundary> = {
  'Old Town': {
    name: 'Old Town',
    centerLat: 59.4373,
    centerLon: 24.7451,
    radiusMeters: 650,
    minLat: 59.4340,
    maxLat: 59.4420,
    minLon: 24.7390,
    maxLon: 24.7520,
    atmosphere: 'Kitsad munakiviturgud, suletud sisehoovid ja vana Hansaaja salajased keldrid.',
  },
  'Kesklinn': {
    name: 'Kesklinn',
    centerLat: 59.4345,
    centerLon: 24.7600,
    radiusMeters: 900,
    minLat: 59.4270,
    maxLat: 59.4380,
    minLon: 24.7500,
    maxLon: 24.7750,
    atmosphere: 'Vilkad puiesteed, ärimajad, kohvikud ja trammirööbaste kolin.',
  },
  'Kalamaja': {
    name: 'Kalamaja',
    centerLat: 59.4450,
    centerLon: 24.7340,
    radiusMeters: 850,
    minLat: 59.4410,
    maxLat: 59.4520,
    minLon: 24.7230,
    maxLon: 24.7460,
    atmosphere: 'Puitmajad, mereäärsed rannapromenaadid, värvilised korteriuksed ja kohvi aroom.',
  },
  'Telliskivi': {
    name: 'Telliskivi',
    centerLat: 59.4400,
    centerLon: 24.7280,
    radiusMeters: 550,
    minLat: 59.4360,
    maxLat: 59.4440,
    minLon: 24.7180,
    maxLon: 24.7360,
    atmosphere: 'Loomelinnak, grafitiga kaetud tellisseinad, töötoad ja noored tegutsejad.',
  },
  'Kadriorg': {
    name: 'Kadriorg',
    centerLat: 59.4385,
    centerLon: 24.7900,
    radiusMeters: 800,
    minLat: 59.4320,
    maxLat: 59.4450,
    minLon: 24.7750,
    maxLon: 24.8100,
    atmosphere: 'Lossipargi iidsed tammed, luigetiigid ja rahulikud puitvillad.',
  },
  'Pirita': {
    name: 'Pirita',
    centerLat: 59.4670,
    centerLon: 24.8300,
    radiusMeters: 1200,
    minLat: 59.4580,
    maxLat: 59.4800,
    minLon: 24.8100,
    maxLon: 24.8600,
    atmosphere: 'Merekohin, männimetsad, kloostrimüürid ja jahtklubi kai.',
  },
};

/**
 * Determine GPS Accuracy Tier:
 * - HIGH (<= 35m): Normal precise location interaction
 * - MEDIUM (35 - 80m): Display uncertainty, allow wider radius / lower risk interactions
 * - POOR (> 80m): Degraded; prompt waiting or accessible list tasks
 */
export function getAccuracyTier(accuracyMeters: number): AccuracyTier {
  if (accuracyMeters <= 35) return 'HIGH';
  if (accuracyMeters <= 80) return 'MEDIUM';
  return 'POOR';
}

/**
 * Detect raw district from coordinates based on closest district center & bounding box
 */
export function detectRawDistrict(lat: number, lon: number): DistrictName {
  let closestDistrict: DistrictName = 'Kesklinn';
  let minDistance = Infinity;

  for (const [name, boundary] of Object.entries(TALLINN_DISTRICTS)) {
    // Check bounding box first
    if (lat >= boundary.minLat && lat <= boundary.maxLat && lon >= boundary.minLon && lon <= boundary.maxLon) {
      return boundary.name;
    }

    const dist = haversineDistanceMeters(lat, lon, boundary.centerLat, boundary.centerLon);
    if (dist < minDistance) {
      minDistance = dist;
      closestDistrict = boundary.name;
    }
  }

  return closestDistrict;
}

/**
 * District Hysteresis Tracker:
 * Prevents GPS jitter near district borders from flip-flopping districts.
 * Requires the player to remain in the candidate district for >= 30 seconds
 * or be clearly inside its radius before confirming the district change.
 */
export class DistrictHysteresisTracker {
  private currentConfirmedDistrict: DistrictName = 'Kesklinn';
  private candidateDistrict: DistrictName | null = null;
  private candidateFirstSeenTimestamp: number = 0;
  private readonly hysteresisDelayMs = 30000; // 30 seconds

  constructor(initialDistrict: DistrictName = 'Kesklinn') {
    this.currentConfirmedDistrict = initialDistrict;
  }

  public update(lat: number, lon: number, now = Date.now()): {
    district: DistrictName;
    changed: boolean;
    isPendingTransition: boolean;
  } {
    const detected = detectRawDistrict(lat, lon);

    if (detected === this.currentConfirmedDistrict) {
      // Firmly in current district; reset any pending transition
      this.candidateDistrict = null;
      this.candidateFirstSeenTimestamp = 0;
      return {
        district: this.currentConfirmedDistrict,
        changed: false,
        isPendingTransition: false,
      };
    }

    // New candidate district detected
    if (this.candidateDistrict !== detected) {
      this.candidateDistrict = detected;
      this.candidateFirstSeenTimestamp = now;
      return {
        district: this.currentConfirmedDistrict,
        changed: false,
        isPendingTransition: true,
      };
    }

    // Candidate has persisted: check if >= 30 seconds have elapsed
    if (now - this.candidateFirstSeenTimestamp >= this.hysteresisDelayMs) {
      const oldDistrict = this.currentConfirmedDistrict;
      this.currentConfirmedDistrict = detected;
      this.candidateDistrict = null;
      this.candidateFirstSeenTimestamp = 0;
      return {
        district: this.currentConfirmedDistrict,
        changed: oldDistrict !== this.currentConfirmedDistrict,
        isPendingTransition: false,
      };
    }

    // Still within the 30-second hysteresis window: keep old confirmed district
    return {
      district: this.currentConfirmedDistrict,
      changed: false,
      isPendingTransition: true,
    };
  }

  public getConfirmedDistrict(): DistrictName {
    return this.currentConfirmedDistrict;
  }

  public forceDistrict(district: DistrictName): void {
    this.currentConfirmedDistrict = district;
    this.candidateDistrict = null;
    this.candidateFirstSeenTimestamp = 0;
  }
}

export const districtTracker = new DistrictHysteresisTracker();
