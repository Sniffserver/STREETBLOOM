import { StreetSegment, Place, DistrictName } from '../../types/game';
import {
  buildStreetSubSegments,
  calculatePolylineLengthMeters,
  haversineDistanceMeters,
} from './geoUtils';
import { SEED_STREETS, SEED_PLACES, TALLINN_CENTER } from '../../data/tallinnSeed';

const OSM_CACHE_KEY_PREFIX = 'sb_osm_cache_';

interface OverpassWayNode {
  lat: number;
  lon: number;
}

interface OverpassWay {
  type: 'way';
  id: number;
  tags?: {
    name?: string;
    highway?: string;
    district?: string;
    surface?: string;
  };
  geometry?: OverpassWayNode[];
}

export class OSMGeoProvider {
  private cache: Map<string, StreetSegment[]> = new Map();

  constructor() {
    // Pre-populate with seed Tallinn streets
    this.cache.set('tallinn_seed', SEED_STREETS);
  }

  // Fetch real streets from Overpass or cache
  public async getStreetsForBBox(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    fallbackDistrict: DistrictName = 'Kohalik piirkond'
  ): Promise<StreetSegment[]> {
    const bboxKey = `${minLat.toFixed(3)}_${minLon.toFixed(3)}_${maxLat.toFixed(3)}_${maxLon.toFixed(3)}`;

    // 1. In-memory cache
    if (this.cache.has(bboxKey)) {
      return this.cache.get(bboxKey)!;
    }

    // 2. Local storage cache
    try {
      const stored = localStorage.getItem(OSM_CACHE_KEY_PREFIX + bboxKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StreetSegment[];
        this.cache.set(bboxKey, parsed);
        return parsed;
      }
    } catch {
      // Continue to fetch
    }

    // 3. Check if bounding box covers Tallinn center - use high-fidelity seed
    const distToTallinn = haversineDistanceMeters(
      (minLat + maxLat) / 2,
      (minLon + maxLon) / 2,
      TALLINN_CENTER.latitude,
      TALLINN_CENTER.longitude
    );

    if (distToTallinn < 8000) {
      return SEED_STREETS;
    }

    // 4. Overpass API query for arbitrary city anywhere in the world
    try {
      const query = `[out:json][timeout:12];(way["highway"~"primary|secondary|tertiary|residential|pedestrian|living_street|service|footway"]["name"](${minLat},${minLon},${maxLat},${maxLon}););out body geom;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Overpass status ${response.status}`);
      }

      const json = await response.json();
      const elements: OverpassWay[] = json.elements || [];

      const streetMap = new Map<string, StreetSegment>();

      for (const el of elements) {
        if (!el.tags?.name || !el.geometry || el.geometry.length < 2) continue;

        const name = el.tags.name;
        const coords: [number, number][] = el.geometry.map((node) => [node.lon, node.lat]);
        const lengthMeters = calculatePolylineLengthMeters(coords);

        const id = `osm-st-${el.id}`;
        const segment: StreetSegment = {
          id,
          osmId: el.id,
          name,
          district: el.tags.district || fallbackDistrict,
          coordinates: coords,
          segments: buildStreetSubSegments(id, coords),
          discovered: false,
          discoveryPercent: 0,
          exploredDistanceMeters: 0,
          visitCount: 0,
          explorationXP: Math.max(25, Math.min(60, Math.round(lengthMeters / 15))),
          lengthMeters,
          description: `Tänav kaardistatud OpenStreetMapist (${el.tags.highway || 'linnatänav'}).`,
        };

        streetMap.set(id, segment);
      }

      const result = Array.from(streetMap.values());
      if (result.length > 0) {
        this.cache.set(bboxKey, result);
        try {
          localStorage.setItem(OSM_CACHE_KEY_PREFIX + bboxKey, JSON.stringify(result));
        } catch {
          // LocalStorage full
        }
        return result;
      }
    } catch (e) {
      console.warn('Overpass fetch failed, using local fallback:', e);
    }

    return SEED_STREETS;
  }
}

export const osmGeoProvider = new OSMGeoProvider();
