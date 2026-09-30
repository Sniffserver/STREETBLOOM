import { GeoLocation, Place, StreetSegment } from '../../types/game';
import { WorldClock, WorldTimeInfo, WorldTimePhase } from './WorldClock';
import { WeatherContext, WeatherModifiers } from './WeatherContext';
import { DistrictResolver } from './DistrictResolver';
import { PlaceResolver, PlaceContext } from './PlaceResolver';

export interface WorldContext {
  timePhase: WorldTimePhase;
  localTime: string;
  timeInfo: WorldTimeInfo;
  district: string;
  nearbyPlaces: PlaceContext[];
  street?: {
    id: string;
    name: string;
    discoveryPercent: number;
  };
  weather: WeatherModifiers;
  encounterDensity: number;
}

export class WorldContextEngine {
  /**
   * Constructs the full unified WorldContext representation
   */
  public static buildContext(
    location: GeoLocation,
    places: Place[] = [],
    activeStreet?: StreetSegment,
    date: Date = new Date()
  ): WorldContext {
    const lat = location?.latitude ?? 59.437;
    const lon = location?.longitude ?? 24.7535;

    const timeInfo = WorldClock.getTimeInfo(lat, lon, date);
    const district = DistrictResolver.resolveDistrict(location);
    const nearbyPlaces = PlaceResolver.resolveNearbyPlaces(location, places);
    const weather = WeatherContext.getWeatherForDate(date);

    // Encounter density modifier based on district, time phase, and weather
    let density = 1.0;
    if (timeInfo.phase === 'DUSK' || timeInfo.phase === 'NIGHT') density *= 1.25;
    if (timeInfo.phase === 'DEEP_NIGHT') density *= 0.7;
    if (weather.condition === 'RAIN' || weather.condition === 'SNOW') density *= 0.8;

    return {
      timePhase: timeInfo.phase,
      localTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeInfo,
      district,
      nearbyPlaces,
      street: activeStreet
        ? {
            id: activeStreet.id,
            name: activeStreet.name,
            discoveryPercent: activeStreet.discoveryPercent,
          }
        : undefined,
      weather,
      encounterDensity: Math.round(density * 100) / 100,
    };
  }
}
