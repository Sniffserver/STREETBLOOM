import { DistrictName } from '../../types/game';
import { NPCArchetype } from '../npc/NPCArchetypes';
import { FactionId } from '../factions/FactionDefinition';

export interface DistrictProfile {
  id: string;
  name: DistrictName;

  // Breakdown simulation metrics (scale 1 to 10)
  socialDensity: number;
  nightlife: number;
  commercial: number;
  residential: number;
  mystery: number;
  danger: number;

  encounterDensity: number; // 0.5 to 2.0 multiplier
  encounterBias: Record<NPCArchetype, number>; // archetype -> relative weight multiplier
  eventBias: Record<string, number>; // event type -> relative weight multiplier

  preferredFactions: FactionId[];
  narrativeDescription: string;
}

export type DistrictIdentity = DistrictProfile;

export const DISTRICT_IDENTITIES: Record<DistrictName, DistrictProfile> = {
  Kesklinn: {
    id: 'dist-kesklinn',
    name: 'Kesklinn',
    socialDensity: 9,
    nightlife: 8,
    commercial: 10,
    residential: 4,
    mystery: 5,
    danger: 2,
    encounterDensity: 1.2,
    encounterBias: {
      CIVILIAN: 1.5,
      WORKER: 1.0,
      STREET_TOUGH: 0.6,
      VENDOR: 1.4,
      STUDENT: 1.3,
      TOURIST: 1.8,
      RUNNER: 1.2,
      RAVER: 0.7,
      DRIFTER: 0.8,
      HOMELESS_WANDERER: 0.7,
      BLACK_MARKET_TRADER: 0.5,
      NIGHT_WORKER: 1.0,
      SECURITY: 1.3,
      MYSTERY_STRANGER: 0.9,
    },
    eventBias: {
      MARKET_DAY: 1.5,
      STREET_FAIR: 1.4,
      SECURITY_SWEEP: 1.2,
      TECH_EXPO: 1.3,
    },
    preferredFactions: ['LOCALS', 'TRADERS', 'SECURITY'],
    narrativeDescription: 'Südalinna elav äri- ja ostukvartal, kus kohalikud ja turistid ristuvad tihedas elurütmis.',
  },
  Kalamaja: {
    id: 'dist-kalamaja',
    name: 'Kalamaja',
    socialDensity: 8,
    nightlife: 9,
    commercial: 7,
    residential: 8,
    mystery: 7,
    danger: 3,
    encounterDensity: 1.0,
    encounterBias: {
      CIVILIAN: 1.4,
      WORKER: 1.2,
      STREET_TOUGH: 0.8,
      VENDOR: 1.1,
      STUDENT: 1.5,
      TOURIST: 1.2,
      RUNNER: 1.3,
      RAVER: 1.6,
      DRIFTER: 0.7,
      HOMELESS_WANDERER: 0.6,
      BLACK_MARKET_TRADER: 0.8,
      NIGHT_WORKER: 0.9,
      SECURITY: 0.8,
      MYSTERY_STRANGER: 1.2,
    },
    eventBias: {
      ART_GALLERY_NIGHT: 1.8,
      INDI_MARKET: 1.6,
      BOHEMIAN_GATHERING: 1.7,
    },
    preferredFactions: ['LOCALS', 'NIGHTLIFE', 'STREET'],
    narrativeDescription: 'Puitarhitektuuriga boheemlaslik piirkond, kus tärkavad kohvikud, kunstiteosed ja salajased hoovid.',
  },
  Kadriorg: {
    id: 'dist-kadriorg',
    name: 'Kadriorg',
    socialDensity: 5,
    nightlife: 3,
    commercial: 4,
    residential: 7,
    mystery: 6,
    danger: 1,
    encounterDensity: 0.8,
    encounterBias: {
      CIVILIAN: 1.6,
      WORKER: 0.8,
      STREET_TOUGH: 0.3,
      VENDOR: 0.8,
      STUDENT: 1.2,
      TOURIST: 1.5,
      RUNNER: 1.9,
      RAVER: 0.4,
      DRIFTER: 0.5,
      HOMELESS_WANDERER: 0.4,
      BLACK_MARKET_TRADER: 0.3,
      NIGHT_WORKER: 0.6,
      SECURITY: 1.1,
      MYSTERY_STRANGER: 1.0,
    },
    eventBias: {
      PARK_CONCERT: 1.7,
      HISTORIC_TOUR: 1.5,
    },
    preferredFactions: ['LOCALS', 'TRADERS'],
    narrativeDescription: 'Ajalooline pargipiirkond ja alleed, kus sörkijad ja jalutajad nautivad puiesteede vaikust.',
  },
  Kopli: {
    id: 'dist-kopli',
    name: 'Kopli',
    socialDensity: 4,
    nightlife: 6,
    commercial: 5,
    residential: 6,
    mystery: 9,
    danger: 8,
    encounterDensity: 1.1,
    encounterBias: {
      CIVILIAN: 0.8,
      WORKER: 1.8,
      STREET_TOUGH: 1.7,
      VENDOR: 0.8,
      STUDENT: 0.7,
      TOURIST: 0.4,
      RUNNER: 0.7,
      RAVER: 1.2,
      DRIFTER: 1.5,
      HOMELESS_WANDERER: 1.4,
      BLACK_MARKET_TRADER: 1.8,
      NIGHT_WORKER: 1.4,
      SECURITY: 1.2,
      MYSTERY_STRANGER: 1.5,
    },
    eventBias: {
      UNDERGROUND_AUCTION: 1.8,
      PORT_WORK_SHIFT: 1.6,
      SECRET_TRADE: 1.7,
    },
    preferredFactions: ['WORKERS', 'STREET', 'MYSTERIOUS'],
    narrativeDescription: 'Tööstuslik ja sadamapoolne poolsaar, kus meretuuled kohtuvad tänavasöakuse ja põrandaaluse kaubandusega.',
  },
  Kristiine: {
    id: 'dist-kristiine',
    name: 'Kristiine',
    socialDensity: 6,
    nightlife: 4,
    commercial: 6,
    residential: 9,
    mystery: 4,
    danger: 3,
    encounterDensity: 0.9,
    encounterBias: {
      CIVILIAN: 1.6,
      WORKER: 1.2,
      STREET_TOUGH: 0.7,
      VENDOR: 1.0,
      STUDENT: 1.1,
      TOURIST: 0.6,
      RUNNER: 1.1,
      RAVER: 0.6,
      DRIFTER: 0.8,
      HOMELESS_WANDERER: 0.7,
      BLACK_MARKET_TRADER: 0.6,
      NIGHT_WORKER: 0.8,
      SECURITY: 1.0,
      MYSTERY_STRANGER: 0.7,
    },
    eventBias: {
      NEIGHBORHOOD_YARD_SALE: 1.6,
      RAILWAY_PATROL: 1.3,
    },
    preferredFactions: ['LOCALS', 'WORKERS'],
    narrativeDescription: 'Aedlinnalik elamurajoon vaiksete kõrvaltänavate ja raudteeäärsete ühendusteedega.',
  },
  Mustamäe: {
    id: 'dist-mustamae',
    name: 'Mustamäe',
    socialDensity: 7,
    nightlife: 5,
    commercial: 6,
    residential: 8,
    mystery: 5,
    danger: 4,
    encounterDensity: 1.0,
    encounterBias: {
      CIVILIAN: 1.4,
      WORKER: 1.1,
      STREET_TOUGH: 1.0,
      VENDOR: 0.9,
      STUDENT: 1.8,
      TOURIST: 0.4,
      RUNNER: 1.2,
      RAVER: 0.8,
      DRIFTER: 1.0,
      HOMELESS_WANDERER: 0.9,
      BLACK_MARKET_TRADER: 0.8,
      NIGHT_WORKER: 0.9,
      SECURITY: 1.0,
      MYSTERY_STRANGER: 0.8,
    },
    eventBias: {
      CAMPUS_HACKATHON: 1.8,
      FOREST_RUN: 1.4,
    },
    preferredFactions: ['LOCALS', 'WORKERS', 'STREET'],
    narrativeDescription: 'Teaduspargi ja elamukvartalite keskus, kus üliõpilased ja elanikud jagavad männikutevahelisi teid.',
  },
  Lasnamäe: {
    id: 'dist-lasnamae',
    name: 'Lasnamäe',
    socialDensity: 8,
    nightlife: 6,
    commercial: 7,
    residential: 9,
    mystery: 6,
    danger: 6,
    encounterDensity: 1.3,
    encounterBias: {
      CIVILIAN: 1.2,
      WORKER: 1.5,
      STREET_TOUGH: 1.6,
      VENDOR: 1.1,
      STUDENT: 0.9,
      TOURIST: 0.3,
      RUNNER: 0.9,
      RAVER: 1.0,
      DRIFTER: 1.3,
      HOMELESS_WANDERER: 1.2,
      BLACK_MARKET_TRADER: 1.4,
      NIGHT_WORKER: 1.2,
      SECURITY: 1.4,
      MYSTERY_STRANGER: 1.1,
    },
    eventBias: {
      CANAL_RACE: 1.5,
      COMMERCIAL_RUSH: 1.4,
    },
    preferredFactions: ['WORKERS', 'STREET', 'SECURITY'],
    narrativeDescription: 'Avarate magistraalide ja kanalitega linnasüda, kus kaubanduskeskused ja korterelamud moodustavad omaette rütmi.',
  },
  Nõmme: {
    id: 'dist-nomme',
    name: 'Nõmme',
    socialDensity: 3,
    nightlife: 2,
    commercial: 3,
    residential: 10,
    mystery: 7,
    danger: 1,
    encounterDensity: 0.7,
    encounterBias: {
      CIVILIAN: 1.8,
      WORKER: 0.7,
      STREET_TOUGH: 0.3,
      VENDOR: 0.7,
      STUDENT: 1.0,
      TOURIST: 0.5,
      RUNNER: 2.0,
      RAVER: 0.3,
      DRIFTER: 0.4,
      HOMELESS_WANDERER: 0.4,
      BLACK_MARKET_TRADER: 0.3,
      NIGHT_WORKER: 0.5,
      SECURITY: 0.8,
      MYSTERY_STRANGER: 0.9,
    },
    eventBias: {
      FOREST_WALK: 1.8,
      MARKET_MORNING: 1.6,
    },
    preferredFactions: ['LOCALS'],
    narrativeDescription: 'Männimetsade ja vaiksete liivateedega männilinn, kus valitseb rahu ja looduslähedus.',
  },
  Pirita: {
    id: 'dist-pirita',
    name: 'Pirita',
    socialDensity: 5,
    nightlife: 4,
    commercial: 4,
    residential: 7,
    mystery: 5,
    danger: 1,
    encounterDensity: 0.8,
    encounterBias: {
      CIVILIAN: 1.5,
      WORKER: 0.6,
      STREET_TOUGH: 0.4,
      VENDOR: 0.8,
      STUDENT: 1.0,
      TOURIST: 1.7,
      RUNNER: 1.9,
      RAVER: 0.6,
      DRIFTER: 0.5,
      HOMELESS_WANDERER: 0.4,
      BLACK_MARKET_TRADER: 0.4,
      NIGHT_WORKER: 0.5,
      SECURITY: 0.9,
      MYSTERY_STRANGER: 0.8,
    },
    eventBias: {
      BEACH_RECREATION: 1.8,
      YACHT_REGATTA: 1.5,
    },
    preferredFactions: ['LOCALS', 'TRADERS'],
    narrativeDescription: 'Ranna- ja joogiradadega laheäärne rajoon, kus värske mereõhk teeb ruumi tervisespordile.',
  },
  Haabersti: {
    id: 'dist-haabersti',
    name: 'Haabersti',
    socialDensity: 5,
    nightlife: 3,
    commercial: 5,
    residential: 8,
    mystery: 5,
    danger: 1,
    encounterDensity: 0.85,
    encounterBias: {
      CIVILIAN: 1.5,
      WORKER: 0.9,
      STREET_TOUGH: 0.6,
      VENDOR: 0.9,
      STUDENT: 1.0,
      TOURIST: 0.8,
      RUNNER: 1.5,
      RAVER: 0.5,
      DRIFTER: 0.6,
      HOMELESS_WANDERER: 0.5,
      BLACK_MARKET_TRADER: 0.5,
      NIGHT_WORKER: 0.7,
      SECURITY: 0.9,
      MYSTERY_STRANGER: 0.7,
    },
    eventBias: {
      LAKE_CIRCULATION: 1.6,
      OPEN_AIR_MUSEUM_EXCURSION: 1.5,
    },
    preferredFactions: ['LOCALS'],
    narrativeDescription: 'Järveäärne roheline piirkond ja vabaõhumuuseumi rajad linnaserva vaikuses.',
  },
};

export const DISTRICT_PROFILES = DISTRICT_IDENTITIES;

export class DistrictResolver {
  public static getIdentity(districtName: DistrictName): DistrictProfile {
    return DISTRICT_IDENTITIES[districtName] || DISTRICT_IDENTITIES.Kesklinn;
  }
}

export function getDistrictProfile(districtName: DistrictName): DistrictProfile & {
  baseEncounterMultiplier: number;
  archetypeWeights: Record<NPCArchetype, number>;
  nightArchetypeWeights: Record<NPCArchetype, number>;
} {
  const identity = DistrictResolver.getIdentity(districtName);
  return {
    ...identity,
    baseEncounterMultiplier: identity.encounterDensity,
    archetypeWeights: identity.encounterBias,
    nightArchetypeWeights: identity.encounterBias,
  };
}
