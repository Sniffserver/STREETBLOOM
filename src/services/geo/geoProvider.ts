import { StreetSegment, Place } from '../../types/game';
import { SEED_STREETS, SEED_PLACES, TALLINN_CENTER } from '../../data/tallinnSeed';
import { haversineDistanceMeters, buildStreetSubSegments, calculatePolylineLengthMeters } from './geoUtils';
import { osmGeoProvider } from './osmGeoProvider';

export interface GeoDataProvider {
  getNearbyStreets(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<StreetSegment[]>;
  getNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<Place[]>;
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export class HybridGeoDataProvider implements GeoDataProvider {
  private localStreets: Map<string, StreetSegment> = new Map();
  private localPlaces: Map<string, Place> = new Map();

  constructor() {
    // Seed with Tallinn data
    SEED_STREETS.forEach((s) => this.localStreets.set(s.id, { ...s }));
    SEED_PLACES.forEach((p) => this.localPlaces.set(p.id, { ...p }));
  }

  public async getNearbyStreets(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<StreetSegment[]> {
    // Check if within 12km of Tallinn Center
    const distToTallinn = haversineDistanceMeters(
      latitude,
      longitude,
      TALLINN_CENTER.latitude,
      TALLINN_CENTER.longitude
    );

    if (distToTallinn < 12000) {
      return Array.from(this.localStreets.values());
    }

    // Try live OpenStreetMap Overpass Bounding Box ingestion
    const delta = 0.015; // ~1.5 km bbox
    const osmStreets = await osmGeoProvider.getStreetsForBBox(
      latitude - delta,
      longitude - delta,
      latitude + delta,
      longitude + delta
    );

    if (osmStreets && osmStreets.length > 0) {
      osmStreets.forEach((s) => {
        if (!this.localStreets.has(s.id)) {
          this.localStreets.set(s.id, s);
        }
      });
      return Array.from(this.localStreets.values());
    }

    // Fallback: Generate procedural realistic street grid for arbitrary location
    return this.generateProceduralStreetsForArea(latitude, longitude, radiusMeters);
  }

  public async getNearbyPlaces(
    latitude: number,
    longitude: number,
    _radiusMeters: number
  ): Promise<Place[]> {
    const distToTallinn = haversineDistanceMeters(
      latitude,
      longitude,
      TALLINN_CENTER.latitude,
      TALLINN_CENTER.longitude
    );

    if (distToTallinn < 15000) {
      return Array.from(this.localPlaces.values());
    }

    return this.generateProceduralPlacesForArea(latitude, longitude);
  }

  private generateProceduralStreetsForArea(
    lat: number,
    lon: number,
    _radius: number
  ): StreetSegment[] {
    const streets: StreetSegment[] = [];
    const baseLat = Math.floor(lat * 100) / 100;
    const baseLon = Math.floor(lon * 100) / 100;

    const streetNames = [
      'Pargi puiestee',
      'Kivi tänav',
      'Jõe põik',
      'Männiku tee',
      'Koidu tänav',
      'Kase allee',
      'Uus tänav',
      'Rahu tee',
      'Allika tänav',
      'Vabaduse puiestee',
      'Päikese allee',
      'Keskuse tänav',
    ];

    let seed = Math.abs(Math.sin(baseLat * 100 + baseLon * 10)) * 1000;

    for (let i = 0; i < 8; i++) {
      const id = `proc-st-${Math.floor(baseLat * 100)}-${Math.floor(baseLon * 100)}-${i}`;
      if (this.localStreets.has(id)) {
        streets.push(this.localStreets.get(id)!);
        continue;
      }

      const offsetLat = (pseudoRandom(seed++) - 0.5) * 0.008;
      const offsetLon = (pseudoRandom(seed++) - 0.5) * 0.012;
      const dirX = (pseudoRandom(seed++) - 0.5) * 0.006;
      const dirY = (pseudoRandom(seed++) - 0.5) * 0.004;

      const p1: [number, number] = [lon + offsetLon, lat + offsetLat];
      const p2: [number, number] = [lon + offsetLon + dirX, lat + offsetLat + dirY];
      const p3: [number, number] = [lon + offsetLon + dirX * 2, lat + offsetLat + dirY * 1.8];

      const coords: [number, number][] = [p1, p2, p3];
      const lengthMeters = calculatePolylineLengthMeters(coords);
      const name = streetNames[i % streetNames.length];

      const segment: StreetSegment = {
        id,
        name,
        district: 'Kohalik piirkond',
        coordinates: coords,
        segments: buildStreetSubSegments(id, coords),
        discovered: false,
        discoveryPercent: 0,
        exploredDistanceMeters: 0,
        visitCount: 0,
        explorationXP: 25 + (i % 3) * 5,
        lengthMeters,
        description: `Kohalik tänav ränduri teel.`,
      };

      this.localStreets.set(id, segment);
      streets.push(segment);
    }

    return streets;
  }

  private generateProceduralPlacesForArea(lat: number, lon: number): Place[] {
    const places: Place[] = [];
    const id = `proc-place-${Math.floor(lat * 100)}-${Math.floor(lon * 100)}`;
    if (this.localPlaces.has(id)) {
      places.push(this.localPlaces.get(id)!);
      return places;
    }

    const place: Place = {
      id,
      name: 'Salapärane hooviallikas',
      category: 'secret',
      district: 'Kohalik piirkond',
      latitude: lat + 0.0015,
      longitude: lon + 0.002,
      discovered: false,
      description: 'Vaikne nurgake, kuhu viib tallatud metsarada.',
      icon: '✨',
    };
    this.localPlaces.set(id, place);
    places.push(place);
    return places;
  }
}

export const defaultGeoProvider = new HybridGeoDataProvider();
