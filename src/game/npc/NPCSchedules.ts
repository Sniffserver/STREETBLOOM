import { NPCScheduleSlot, DistrictName } from '../../types/game';
import { NPCArchetype } from './NPCArchetypes';

export class NPCSchedules {
  /**
   * Generates a realistic 24-hour cycle schedule for an NPC archetype located in a district
   */
  public static generateScheduleForArchetype(
    archetype: NPCArchetype,
    district: DistrictName,
    baseLat: number,
    baseLon: number
  ): NPCScheduleSlot[] {
    // Generate small local offsets (20-80m) around anchor coordinate
    const offset1 = { lat: baseLat + 0.0003, lon: baseLon + 0.0004 };
    const offset2 = { lat: baseLat - 0.0003, lon: baseLon - 0.0002 };
    const offset3 = { lat: baseLat + 0.0002, lon: baseLon - 0.0003 };

    switch (archetype) {
      case 'VENDOR':
      case 'BLACK_MARKET_TRADER':
        return [
          {
            startHour: 6,
            endHour: 14,
            locationName: `${district} lett / kiosk`,
            placeType: 'shop',
            latitude: baseLat,
            longitude: baseLon,
            activityDescription: 'Avab müügiletti ja sätib kaupa välja.',
          },
          {
            startHour: 14,
            endHour: 22,
            locationName: `${district} turuplats`,
            placeType: 'market',
            latitude: offset1.lat,
            longitude: offset1.lon,
            activityDescription: 'Kaupleb linlaste ja ränduritega.',
          },
          {
            startHour: 22,
            endHour: 6,
            locationName: `${district} ladu`,
            placeType: 'depot',
            latitude: offset2.lat,
            longitude: offset2.lon,
            activityDescription: 'Inventeerib kaupa ja puhkab.',
          },
        ];

      case 'RAVER':
        return [
          {
            startHour: 21,
            endHour: 3,
            locationName: `${district} klubikoridor`,
            placeType: 'club',
            latitude: baseLat,
            longitude: baseLon,
            activityDescription: 'Tantsib ja suhtleb reiviseltskonnaga.',
          },
          {
            startHour: 3,
            endHour: 8,
            locationName: `${district} tänavanurk`,
            placeType: 'street',
            latitude: offset1.lat,
            longitude: offset1.lon,
            activityDescription: 'Järelpidu ja jahe hommikuõhk.',
          },
          {
            startHour: 8,
            endHour: 21,
            locationName: `${district} korter`,
            placeType: 'home',
            latitude: offset2.lat,
            longitude: offset2.lon,
            activityDescription: 'Magab ja kogub energiat järgmiseks ööks.',
          },
        ];

      case 'SECURITY':
      case 'NIGHT_WORKER':
        return [
          {
            startHour: 20,
            endHour: 2,
            locationName: `${district} peatänav`,
            placeType: 'patrol',
            latitude: baseLat,
            longitude: baseLon,
            activityDescription: 'Õhtune ja öine patrullring.',
          },
          {
            startHour: 2,
            endHour: 7,
            locationName: `${district} tagahoovid`,
            placeType: 'perimeter',
            latitude: offset1.lat,
            longitude: offset1.lon,
            activityDescription: 'Hilisöö perimeetri kontroll.',
          },
          {
            startHour: 7,
            endHour: 20,
            locationName: `${district} tugipunkt`,
            placeType: 'base',
            latitude: offset2.lat,
            longitude: offset2.lon,
            activityDescription: 'Vahetuse üleandmine ja puhkus.',
          },
        ];

      case 'RUNNER':
        return [
          {
            startHour: 6,
            endHour: 10,
            locationName: `${district} pargirada`,
            placeType: 'park',
            latitude: baseLat,
            longitude: baseLon,
            activityDescription: 'Hommikune jooksu- ja venitustrenn.',
          },
          {
            startHour: 10,
            endHour: 18,
            locationName: `${district} kohvik / töö`,
            placeType: 'cafe',
            latitude: offset1.lat,
            longitude: offset1.lon,
            activityDescription: 'Päevased toimetused ja taastumine.',
          },
          {
            startHour: 18,
            endHour: 22,
            locationName: `${district} promenaad`,
            placeType: 'promenade',
            latitude: offset3.lat,
            longitude: offset3.lon,
            activityDescription: 'Õhtune kiirkõnd ja tervisejooks.',
          },
          {
            startHour: 22,
            endHour: 6,
            locationName: `${district} kodu`,
            placeType: 'home',
            latitude: offset2.lat,
            longitude: offset2.lon,
            activityDescription: 'Öine uni ja taastumine.',
          },
        ];

      default:
        // Default civilian / worker schedule
        return [
          {
            startHour: 7,
            endHour: 12,
            locationName: `${district} hommikune tänav`,
            placeType: 'street',
            latitude: baseLat,
            longitude: baseLon,
            activityDescription: 'Liigub kohvikusse või tööle.',
          },
          {
            startHour: 12,
            endHour: 18,
            locationName: `${district} keskus`,
            placeType: 'workplace',
            latitude: offset1.lat,
            longitude: offset1.lon,
            activityDescription: 'Päevased argitoimetused.',
          },
          {
            startHour: 18,
            endHour: 23,
            locationName: `${district} väljak`,
            placeType: 'square',
            latitude: offset3.lat,
            longitude: offset3.lon,
            activityDescription: 'Õhtune jalutuskäik ja suhtlus naabritega.',
          },
          {
            startHour: 23,
            endHour: 7,
            locationName: `${district} elamuala`,
            placeType: 'home',
            latitude: offset2.lat,
            longitude: offset2.lon,
            activityDescription: 'Öörahu.',
          },
        ];
    }
  }
}
