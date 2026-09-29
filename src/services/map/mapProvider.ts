import { GeoLocation, StreetSegment, Place, NPC, Quest } from '../../types/game';

export interface MapProvider {
  initialize(container: HTMLElement, initialLocation: GeoLocation): Promise<void>;
  setPlayerLocation(location: GeoLocation): void;
  revealStreet(streetId: string): void;
  revealPlace(placeId: string): void;
  updateStreets(streets: StreetSegment[]): void;
  updatePlaces(places: Place[]): void;
  updateNPCs(npcs: NPC[], onSelectNPC: (npc: NPC) => void): void;
  updateQuests(quests: Quest[]): void;
  panTo(lat: number, lon: number, zoom?: number): void;
  destroy(): void;
}
