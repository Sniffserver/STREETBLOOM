export type FactionId =
  | 'LOCALS'
  | 'WORKERS'
  | 'NIGHTLIFE'
  | 'STREET'
  | 'TRADERS'
  | 'SECURITY'
  | 'MYSTERIOUS';

export interface FactionInfo {
  id: FactionId;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultDisposition: 'neutral' | 'friendly' | 'cautious' | 'suspicious';
}

export const FACTIONS: Record<FactionId, FactionInfo> = {
  LOCALS: {
    id: 'LOCALS',
    name: 'Kohalikud (Locals)',
    description: 'Long-time neighborhood residents, cafe patrons, and park keepers.',
    icon: '🏡',
    color: '#34d399',
    defaultDisposition: 'friendly',
  },
  WORKERS: {
    id: 'WORKERS',
    name: 'Töölised (Workers)',
    description: 'Port builders, delivery drivers, municipal staff, and night shift crews.',
    icon: '🔧',
    color: '#fbbf24',
    defaultDisposition: 'neutral',
  },
  NIGHTLIFE: {
    id: 'NIGHTLIFE',
    name: 'Ööelu (Nightlife)',
    description: 'Underground clubbers, DJ collectivities, electronic dancers, and rave organizers.',
    icon: '🪩',
    color: '#a855f7',
    defaultDisposition: 'neutral',
  },
  STREET: {
    id: 'STREET',
    name: 'Tänavarahvas (Street Network)',
    description: 'Alley couriers, graffiti artists, street-smart youth, and rooftop spotters.',
    icon: '🛹',
    color: '#f97316',
    defaultDisposition: 'cautious',
  },
  TRADERS: {
    id: 'TRADERS',
    name: 'Kaupmehed (Traders)',
    description: 'Flea market booth keepers, collectors, barterers, and antique scavengers.',
    icon: '⚖️',
    color: '#38bdf8',
    defaultDisposition: 'friendly',
  },
  SECURITY: {
    id: 'SECURITY',
    name: 'Turvateenistus (Security)',
    description: 'District watchmen, venue bouncers, and commercial patrol officers.',
    icon: '🛡️',
    color: '#60a5fa',
    defaultDisposition: 'cautious',
  },
  MYSTERIOUS: {
    id: 'MYSTERIOUS',
    name: 'Varjud & Teadjad (Shadows)',
    description: 'Enigmatic figures in trench coats, secret historians, and occult street guides.',
    icon: '👁️',
    color: '#e879f9',
    defaultDisposition: 'suspicious',
  },
};

export interface PlayerFactionStanding {
  factionId: FactionId;
  reputationPoints: number; // -100 to +100
}

export function getStandingLabel(points: number): {
  tier: 'Hostile' | 'Suspicious' | 'Neutral' | 'Friendly' | 'Honored';
  label: string;
  priceModifier: number; // e.g. 1.25 for suspicious, 0.85 for honored
} {
  if (points <= -50) {
    return { tier: 'Hostile', label: 'Vaenulik', priceModifier: 1.5 };
  }
  if (points < -10) {
    return { tier: 'Suspicious', label: 'Kahtlustav', priceModifier: 1.2 };
  }
  if (points < 25) {
    return { tier: 'Neutral', label: 'Neutraalne', priceModifier: 1.0 };
  }
  if (points < 65) {
    return { tier: 'Friendly', label: 'Sõbralik', priceModifier: 0.9 };
  }
  return { tier: 'Honored', label: 'Austatud', priceModifier: 0.8 };
}
