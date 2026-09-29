import { GeoLocation, StreetSubSegment, StreetSegment } from '../../types/game';

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// Distance from point (pLat, pLon) to line segment between (lat1, lon1) and (lat2, lon2)
export function pointToSegmentDistanceMeters(
  pLat: number,
  pLon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceMeters: number; projectionFactor: number } {
  const x = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const y = lat2 - lat1;
  const dx = (pLon - lon1) * Math.cos(((lat1 + pLat) / 2) * (Math.PI / 180));
  const dy = pLat - lat1;

  const segLengthSq = x * x + y * y;
  if (segLengthSq === 0) {
    return {
      distanceMeters: haversineDistanceMeters(pLat, pLon, lat1, lon1),
      projectionFactor: 0,
    };
  }

  const t = Math.max(0, Math.min(1, (dx * x + dy * y) / segLengthSq));
  const projLat = lat1 + t * (lat2 - lat1);
  const projLon = lon1 + t * (lon2 - lon1);

  return {
    distanceMeters: haversineDistanceMeters(pLat, pLon, projLat, projLon),
    projectionFactor: t,
  };
}

// Distance from point to polyline
export function pointToPolylineDistanceMeters(
  pLat: number,
  pLon: number,
  coordinates: [number, number][] // [lon, lat] pairs
): number {
  if (coordinates.length === 0) return Infinity;
  if (coordinates.length === 1) {
    return haversineDistanceMeters(pLat, pLon, coordinates[0][1], coordinates[0][0]);
  }

  let minDistance = Infinity;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const lon1 = coordinates[i][0];
    const lat1 = coordinates[i][1];
    const lon2 = coordinates[i + 1][0];
    const lat2 = coordinates[i + 1][1];

    const { distanceMeters } = pointToSegmentDistanceMeters(pLat, pLon, lat1, lon1, lat2, lon2);
    if (distanceMeters < minDistance) {
      minDistance = distanceMeters;
    }
  }

  return minDistance;
}

// Helper to merge and measure disjoint normalized intervals [[start, end], ...] in [0, 1]
export function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current[0] <= last[1] + 0.02) {
      // Overlapping or adjacent within 2% tolerance
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export function computeCoveredFraction(intervals: [number, number][]): number {
  const merged = mergeIntervals(intervals);
  let totalFraction = 0;
  for (const [start, end] of merged) {
    totalFraction += Math.max(0, Math.min(1, end) - Math.max(0, start));
  }
  return Math.min(1, Math.max(0, totalFraction));
}

// Split polyline coordinates into discrete geometric sub-segments with length
export function buildStreetSubSegments(
  streetId: string,
  coordinates: [number, number][] // [lon, lat] pairs
): StreetSubSegment[] {
  if (coordinates.length < 2) return [];

  const subSegments: StreetSubSegment[] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const length = haversineDistanceMeters(p1[1], p1[0], p2[1], p2[0]);

    subSegments.push({
      id: `${streetId}-sub-${i}`,
      startIndex: i,
      endIndex: i + 1,
      startPoint: p1,
      endPoint: p2,
      lengthMeters: Math.max(10, Math.round(length)),
      traversedDistanceMeters: 0,
      explored: false,
    });
  }

  return subSegments;
}

export interface SegmentTraversalResult {
  inCorridor: boolean;
  distanceAlongSegmentMeters: number;
  newTraversedTotalMeters: number;
  isNowExplored: boolean;
}

// Deterministic geometric check: measures real physical traversal along a street segment
// Prevents fake forward accumulation from backwards walking or stationary jitter by tracking covered intervals
export function computeMovementAlongSegment(
  prevLat: number | null,
  prevLon: number | null,
  currLat: number,
  currLon: number,
  subSegment: StreetSubSegment,
  maxCorridorWidthMeters = 24,
  completionRatio = 0.50
): SegmentTraversalResult {
  const p1 = subSegment.startPoint; // [lon, lat]
  const p2 = subSegment.endPoint;   // [lon, lat]

  const currProj = pointToSegmentDistanceMeters(currLat, currLon, p1[1], p1[0], p2[1], p2[0]);

  // Player must be within street corridor (perpendicular distance check)
  if (currProj.distanceMeters > maxCorridorWidthMeters) {
    return {
      inCorridor: false,
      distanceAlongSegmentMeters: 0,
      newTraversedTotalMeters: subSegment.traversedDistanceMeters || 0,
      isNowExplored: subSegment.explored,
    };
  }

  // If no previous location (first fix), player is standing in corridor but has not yet traversed distance
  if (prevLat === null || prevLon === null) {
    return {
      inCorridor: true,
      distanceAlongSegmentMeters: 0,
      newTraversedTotalMeters: subSegment.traversedDistanceMeters || 0,
      isNowExplored: subSegment.explored,
    };
  }

  const prevProj = pointToSegmentDistanceMeters(prevLat, prevLon, p1[1], p1[0], p2[1], p2[0]);

  // Check if previous position was also near corridor (allowing max 32m when stepping onto street)
  if (prevProj.distanceMeters > maxCorridorWidthMeters + 8) {
    return {
      inCorridor: true,
      distanceAlongSegmentMeters: 0,
      newTraversedTotalMeters: subSegment.traversedDistanceMeters || 0,
      isNowExplored: subSegment.explored,
    };
  }

  // Physical displacement between previous and current GPS fix
  const stepMeters = haversineDistanceMeters(prevLat, prevLon, currLat, currLon);

  // Suppress stationary GPS jitter (< 0.9m physical step)
  if (stepMeters < 0.9) {
    return {
      inCorridor: true,
      distanceAlongSegmentMeters: 0,
      newTraversedTotalMeters: subSegment.traversedDistanceMeters || 0,
      isNowExplored: subSegment.explored,
    };
  }

  // Projection factors clamped to [0, 1]
  const t1 = Math.min(prevProj.projectionFactor, currProj.projectionFactor);
  const t2 = Math.max(prevProj.projectionFactor, currProj.projectionFactor);
  const deltaT = t2 - t1;

  // Longitudinal displacement along segment axis
  const projectedMeters = deltaT * subSegment.lengthMeters;

  // Longitudinal traversal cannot exceed physical movement
  const effectiveProjectedMeters = Math.min(projectedMeters, stepMeters);

  if (effectiveProjectedMeters < 0.5 || deltaT <= 0.001) {
    // Purely perpendicular movement across street or negligible longitudinal progress
    return {
      inCorridor: true,
      distanceAlongSegmentMeters: 0,
      newTraversedTotalMeters: subSegment.traversedDistanceMeters || 0,
      isNowExplored: subSegment.explored,
    };
  }

  // Effective clamped interval for this step
  const clampedStepT = effectiveProjectedMeters / Math.max(1, subSegment.lengthMeters);
  const stepInterval: [number, number] = [t1, Math.min(1, t1 + clampedStepT)];

  // Initialize or retrieve existing covered intervals on this subsegment
  const existingIntervals: [number, number][] = (subSegment as any)._coveredIntervals || [];
  if (existingIntervals.length === 0 && (subSegment.traversedDistanceMeters || 0) > 0) {
    const initialFraction = Math.min(1, (subSegment.traversedDistanceMeters || 0) / subSegment.lengthMeters);
    existingIntervals.push([0, initialFraction]);
  }

  const prevFraction = computeCoveredFraction(existingIntervals);
  const updatedIntervals = mergeIntervals([...existingIntervals, stepInterval]);
  const newFraction = computeCoveredFraction(updatedIntervals);

  // Store updated intervals on subsegment instance
  (subSegment as any)._coveredIntervals = updatedIntervals;

  const gainedFraction = Math.max(0, newFraction - prevFraction);
  const gainedMeters = gainedFraction * subSegment.lengthMeters;

  const previousTraversed = subSegment.traversedDistanceMeters || 0;
  const newTraversedTotal = Math.min(subSegment.lengthMeters, previousTraversed + gainedMeters);
  const requiredMeters = subSegment.lengthMeters * completionRatio;
  const isNowExplored = newTraversedTotal >= requiredMeters || (subSegment.explored);

  return {
    inCorridor: true,
    distanceAlongSegmentMeters: Math.round(gainedMeters * 10) / 10,
    newTraversedTotalMeters: Math.round(newTraversedTotal * 10) / 10,
    isNowExplored,
  };
}

// Single-point proximity helper (e.g. for stationary inspection or baseline check)
export function checkPlayerNearSegment(
  playerLat: number,
  playerLon: number,
  subSegment: StreetSubSegment,
  maxProximityThresholdMeters = 24
): boolean {
  const p1 = subSegment.startPoint;
  const p2 = subSegment.endPoint;

  const { distanceMeters } = pointToSegmentDistanceMeters(
    playerLat,
    playerLon,
    p1[1],
    p1[0],
    p2[1],
    p2[0]
  );

  return distanceMeters <= maxProximityThresholdMeters;
}

// Deterministic geometric check: checks if player is within street segment corridor (orthogonal distance)
export function checkPlayerTraversedSegment(
  playerLat: number,
  playerLon: number,
  subSegment: StreetSubSegment,
  maxCorridorWidthMeters = 24
): boolean {
  return checkPlayerNearSegment(playerLat, playerLon, subSegment, maxCorridorWidthMeters);
}

// GPS Noise Filtering & Exponential Smoothing for walking exploration
export class GPSSmoother {
  private smoothedLat: number | null = null;
  private smoothedLon: number | null = null;
  private readonly alpha: number = 0.4; // Responsive smoothing factor for pedestrian motion

  public smooth(location: GeoLocation): GeoLocation {
    // Pass simulated or teleported fixes directly without delay
    if (location.isSimulated || location.isTeleport) {
      this.smoothedLat = location.latitude;
      this.smoothedLon = location.longitude;
      return location;
    }

    if (this.smoothedLat === null || this.smoothedLon === null) {
      this.smoothedLat = location.latitude;
      this.smoothedLon = location.longitude;
      return location;
    }

    const rawDist = haversineDistanceMeters(
      this.smoothedLat,
      this.smoothedLon,
      location.latitude,
      location.longitude
    );

    // Accuracy-aware deadband filter:
    // When speed is low (< 0.5 m/s or null) and displacement is under deadband threshold,
    // pin to stationary coordinates to prevent meter accumulation.
    const deadbandThreshold = Math.max(2.2, Math.min(6.0, (location.accuracy || 10) * 0.25));
    if (rawDist < deadbandThreshold && (location.speed === null || location.speed < 0.5)) {
      return {
        ...location,
        latitude: this.smoothedLat,
        longitude: this.smoothedLon,
      };
    }

    // Exponential moving average for fluid path tracking
    this.smoothedLat = this.smoothedLat + this.alpha * (location.latitude - this.smoothedLat);
    this.smoothedLon = this.smoothedLon + this.alpha * (location.longitude - this.smoothedLon);

    return {
      ...location,
      latitude: this.smoothedLat,
      longitude: this.smoothedLon,
    };
  }

  public reset(lat?: number, lon?: number): void {
    this.smoothedLat = lat ?? null;
    this.smoothedLon = lon ?? null;
  }
}

export const gpsSmoother = new GPSSmoother();

// Spatial filtering: Fast bounding box pre-filter for streets to avoid O(all streets) geometry loops
export function filterNearbyStreets(
  streets: StreetSegment[],
  lat: number,
  lon: number,
  radiusMeters = 80
): StreetSegment[] {
  const latDelta = radiusMeters / 111000;
  const lonDelta = radiusMeters / (111000 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));

  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLon = lon - lonDelta;
  const maxLon = lon + lonDelta;

  return streets.filter((street) => {
    if (!street.coordinates || street.coordinates.length === 0) return false;
    let sMinLat = Infinity, sMaxLat = -Infinity, sMinLon = Infinity, sMaxLon = -Infinity;
    for (let i = 0; i < street.coordinates.length; i++) {
      const cLon = street.coordinates[i][0];
      const cLat = street.coordinates[i][1];
      if (cLat < sMinLat) sMinLat = cLat;
      if (cLat > sMaxLat) sMaxLat = cLat;
      if (cLon < sMinLon) sMinLon = cLon;
      if (cLon > sMaxLon) sMaxLon = cLon;
    }
    return !(sMaxLat < minLat || sMinLat > maxLat || sMaxLon < minLon || sMinLon > maxLon);
  });
}

// Calculate total length of polyline coordinates
export function calculatePolylineLengthMeters(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineDistanceMeters(
      coordinates[i][1],
      coordinates[i][0],
      coordinates[i + 1][1],
      coordinates[i + 1][0]
    );
  }
  return Math.max(20, Math.round(total));
}

export interface MovementValidationResult {
  valid: boolean;
  reason?: 'impossible_speed' | 'massive_jump' | 'poor_accuracy' | 'stale_timestamp' | 'teleport';
  distanceMeters: number;
}

export function validateMovement(
  prevLoc: GeoLocation | null,
  newLoc: GeoLocation,
  maxWalkingSpeedMs = 12 // ~43 km/h
): MovementValidationResult {
  if (newLoc.isTeleport) {
    // Explicit teleport positioning: valid move, 0 walked distance
    return { valid: true, distanceMeters: 0 };
  }

  if (!prevLoc) {
    return { valid: true, distanceMeters: 0 };
  }

  // Reject stale or backwards-traveling timestamps
  if (newLoc.timestamp < prevLoc.timestamp - 1000 && !newLoc.isSimulated) {
    return { valid: false, reason: 'stale_timestamp', distanceMeters: 0 };
  }

  const distance = haversineDistanceMeters(
    prevLoc.latitude,
    prevLoc.longitude,
    newLoc.latitude,
    newLoc.longitude
  );

  const timeDiffSec = Math.max(0.1, (newLoc.timestamp - prevLoc.timestamp) / 1000);
  const calculatedSpeed = distance / timeDiffSec;

  // Check impossible jump: > 300 meters in < 4 seconds
  if (distance > 300 && timeDiffSec < 4) {
    return { valid: false, reason: 'massive_jump', distanceMeters: distance };
  }

  // Check speed threshold
  if (calculatedSpeed > maxWalkingSpeedMs && distance > 20) {
    return { valid: false, reason: 'impossible_speed', distanceMeters: distance };
  }

  // Reject inaccurate fixes (> 65m) unless in simulated demo mode
  if (!newLoc.isSimulated && newLoc.accuracy > 65) {
    return { valid: false, reason: 'poor_accuracy', distanceMeters: distance };
  }

  // Deadband: small displacement under 1.2m while speed is low is treated as stationary
  if (distance < 1.2 && (newLoc.speed === null || newLoc.speed < 0.4)) {
    return { valid: true, distanceMeters: 0 };
  }

  return { valid: true, distanceMeters: distance };
}

// Mask coordinates according to privacy radius
export function maskLocationForPrivacy(
  lat: number,
  lon: number,
  privacyRadiusActive: boolean
): { lat: number; lon: number; semanticDesc: string } {
  if (!privacyRadiusActive) {
    return { lat, lon, semanticDesc: 'täpne asukoht' };
  }
  const maskedLat = Math.round(lat * 1000) / 1000;
  const maskedLon = Math.round(lon * 1000) / 1000;
  return {
    lat: maskedLat,
    lon: maskedLon,
    semanticDesc: 'ümbruspiirkond (hägustatud)',
  };
}
