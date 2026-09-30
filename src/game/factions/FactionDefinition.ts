export type FactionId =
  | 'LOCALS'
  | 'WORKERS'
  | 'NIGHTLIFE'
  | 'STREET'
  | 'TRADERS'
  | 'SECURITY'
  | 'MYSTERIOUS';

export interface FactionDefinition {
  id: FactionId;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultStanding: number; // e.g. 0
}

export const FACTION_DEFINITIONS: Record<FactionId, FactionDefinition> = {
  LOCALS: {
    id: 'LOCALS',
    name: 'Kohalikud (Locals)',
    description: 'Pikaajalised elanikud, kohvikukülastajad ja pargivahid.',
    icon: '🏡',
    color: '#34d399',
    defaultStanding: 10,
  },
  WORKERS: {
    id: 'WORKERS',
    name: 'Töölised (Workers)',
    description: 'Sadamagrupikud, kullerid, teetöölised ja öövahetuse meeskonnad.',
    icon: '🔧',
    color: '#fbbf24',
    defaultStanding: 5,
  },
  NIGHTLIFE: {
    id: 'NIGHTLIFE',
    name: 'Ööelu (Nightlife)',
    description: 'Klubilised, DJ-d, elektroonilised tantsijad ja reividirektorid.',
    icon: '🪩',
    color: '#a855f7',
    defaultStanding: 0,
  },
  STREET: {
    id: 'STREET',
    name: 'Tänavarahvas (Street Network)',
    description: 'Allee kullerid, grafitikunstnikud ja rulapargi noored.',
    icon: '🛹',
    color: '#f97316',
    defaultStanding: 0,
  },
  TRADERS: {
    id: 'TRADERS',
    name: 'Kaupmehed (Traders)',
    description: 'Turuletipidajad, kollektsionäärid ja antiigikaupmehed.',
    icon: '⚖️',
    color: '#38bdf8',
    defaultStanding: 10,
  },
  SECURITY: {
    id: 'SECURITY',
    name: 'Turvateenistus (Security)',
    description: 'Kvartalivalvurid, turvamehed ja patrullovitserid.',
    icon: '🛡️',
    color: '#60a5fa',
    defaultStanding: 5,
  },
  MYSTERIOUS: {
    id: 'MYSTERIOUS',
    name: 'Varjud & Teadjad (Shadows)',
    description: 'Mantlites varjukujud, ajaloohuvilised ja salajased teejuhid.',
    icon: '👁️',
    color: '#e879f9',
    defaultStanding: 0,
  },
};
