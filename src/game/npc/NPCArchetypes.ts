import { FactionId } from './NPCFaction';
import { InteractionChoice } from '../../types/game';

export type DayArchetype =
  | 'CIVILIAN'
  | 'WORKER'
  | 'STREET_TOUGH'
  | 'VENDOR'
  | 'STUDENT'
  | 'TOURIST'
  | 'RUNNER';

export type NightArchetype =
  | 'RAVER'
  | 'DRIFTER'
  | 'HOMELESS_WANDERER'
  | 'BLACK_MARKET_TRADER'
  | 'NIGHT_WORKER'
  | 'SECURITY'
  | 'MYSTERY_STRANGER';

export type NPCArchetype = DayArchetype | NightArchetype;

export type NPCActionType =
  | 'TALK'
  | 'TRADE'
  | 'ASK'
  | 'QUEST'
  | 'FOLLOW'
  | 'FIGHT'
  | 'LEAVE';

export interface FictionalTradeItem {
  id: string;
  name: string;
  description: string;
  category: 'collectible' | 'tool' | 'curio' | 'pass' | 'relic';
  icon: string;
  basePrice: number;
  stock: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export const FICTIONAL_TRADE_ITEMS: Record<string, FictionalTradeItem> = {
  'item-old-cassette': {
    id: 'item-old-cassette',
    name: 'Vana kassett (Old Cassette)',
    description: 'A 90s magnetic tape containing ambient city recordings and synth riffs.',
    category: 'curio',
    icon: '📼',
    basePrice: 12,
    stock: 2,
    rarity: 'common',
  },
  'item-neon-powder': {
    id: 'item-neon-powder',
    name: 'Neoonpulber (Neon Powder)',
    description: 'Luminescent dry pigment used by midnight artists and rave markers.',
    category: 'tool',
    icon: '✨',
    basePrice: 20,
    stock: 3,
    rarity: 'uncommon',
  },
  'item-mystery-token': {
    id: 'item-mystery-token',
    name: 'Müstiline žetoon (Mystery Token)',
    description: 'An engraved brass token stamped with a stylized owl and street glyphs.',
    category: 'relic',
    icon: '🪙',
    basePrice: 35,
    stock: 1,
    rarity: 'rare',
  },
  'item-vintage-lighter': {
    id: 'item-vintage-lighter',
    name: 'Uunikum-tulemasin (Vintage Lighter)',
    description: 'Heavy metal petrol lighter with a warm, steady spark.',
    category: 'tool',
    icon: '🔥',
    basePrice: 15,
    stock: 2,
    rarity: 'common',
  },
  'item-street-sticker': {
    id: 'item-street-sticker',
    name: 'Tänavakleebis (Street Sticker)',
    description: 'Limited edition holographic vinyl sticker from a local graffiti collective.',
    category: 'collectible',
    icon: '🏷️',
    basePrice: 5,
    stock: 5,
    rarity: 'common',
  },
  'item-night-pass': {
    id: 'item-night-pass',
    name: 'Ööpääse (Night Pass)',
    description: 'A wristband stamped with an ultraviolet logo for underground cellar venues.',
    category: 'pass',
    icon: '🎟️',
    basePrice: 40,
    stock: 1,
    rarity: 'rare',
  },
  'item-rare-coin': {
    id: 'item-rare-coin',
    name: 'Haruldane münt (Rare Coin)',
    description: 'An old Baltic transit or trade coin with intriguing patina.',
    category: 'relic',
    icon: '⚜️',
    basePrice: 50,
    stock: 1,
    rarity: 'rare',
  },
  'item-broken-radio': {
    id: 'item-broken-radio',
    name: 'Katkine raadio (Broken Radio)',
    description: 'Portable shortwave receiver that faintly picks up mysterious frequency whispers.',
    category: 'curio',
    icon: '📻',
    basePrice: 25,
    stock: 1,
    rarity: 'uncommon',
  },
};

export interface ArchetypeDefinition {
  archetype: NPCArchetype;
  label: string;
  isNightArchetype: boolean;
  faction: FactionId;
  defaultAvatar: string;
  hpRange: [number, number]; // Base HP for combat
  attackRange: [number, number];
  defenseRange: [number, number];
  primaryBehaviors: string[];
  allowedActions: NPCActionType[];
  tradeInventoryIds?: string[];
  canInitiateCombat: boolean;
  aggressionRate: number; // 0.0 (peaceful) to 0.35 (confrontational)
  fictionalTitles: string[];
  firstNames: string[];
  personalityPresets: {
    friendly: number;
    sarcastic: number;
    curious: number;
    mysterious: number;
  };
  sampleDialogue: string[];
}

export const ARCHETYPE_DEFINITIONS: Record<NPCArchetype, ArchetypeDefinition> = {
  // Day Archetypes
  CIVILIAN: {
    archetype: 'CIVILIAN',
    label: 'Kodanik (Civilian)',
    isNightArchetype: false,
    faction: 'LOCALS',
    defaultAvatar: '🚶',
    hpRange: [25, 35],
    attackRange: [4, 8],
    defenseRange: [2, 5],
    primaryBehaviors: ['walk', 'stop', 'observe', 'talk'],
    allowedActions: ['TALK', 'ASK', 'LEAVE'],
    canInitiateCombat: false,
    aggressionRate: 0.0,
    fictionalTitles: ['Kohalik elanik', 'Tänaval jalutaja', 'Naaber', 'Kohvikuhuviline'],
    firstNames: ['Priit', 'Laura', 'Toomas', 'Anneli', 'Rasmus', 'Kadri', 'Marten', 'Kristiina'],
    personalityPresets: { friendly: 0.8, sarcastic: 0.2, curious: 0.6, mysterious: 0.1 },
    sampleDialogue: [
      'Ilus päev tänavatel jalutamiseks!',
      'Kas tead, et siin nurgal avati hiljuti uus pagariäri?',
      'Linn muutub iga päevaga veidi.',
    ],
  },
  WORKER: {
    archetype: 'WORKER',
    label: 'Tööline (Worker)',
    isNightArchetype: false,
    faction: 'WORKERS',
    defaultAvatar: '👷',
    hpRange: [35, 45],
    attackRange: [6, 11],
    defenseRange: [4, 8],
    primaryBehaviors: ['walk', 'pause', 'work', 'talk'],
    allowedActions: ['TALK', 'TRADE', 'ASK', 'QUEST', 'LEAVE'],
    tradeInventoryIds: ['item-vintage-lighter', 'item-broken-radio'],
    canInitiateCombat: false,
    aggressionRate: 0.05,
    fictionalTitles: ['Kommunaaltöötaja', 'Kaablipaigaldaja', 'Kullersõitja', 'Meister'],
    firstNames: ['Valdur', 'Sergei', 'Jüri', 'Tanel', 'Arvo', 'Kaido', 'Peeter'],
    personalityPresets: { friendly: 0.6, sarcastic: 0.4, curious: 0.3, mysterious: 0.1 },
    sampleDialogue: [
      'Tööpäev on pikk, aga linn peab toimima.',
      'Kui sul on vaja asjalikku nõu, küsi julgelt.',
      'Otsid tööd? Alati leidub mõni lahendamist vajav asi.',
    ],
  },
  STREET_TOUGH: {
    archetype: 'STREET_TOUGH',
    label: 'Tänavahunt (Street Tough)',
    isNightArchetype: false,
    faction: 'STREET',
    defaultAvatar: '🧢',
    hpRange: [40, 55],
    attackRange: [8, 14],
    defenseRange: [5, 10],
    primaryBehaviors: ['patrol', 'observe', 'confront'],
    allowedActions: ['TALK', 'TRADE', 'FIGHT', 'LEAVE'],
    tradeInventoryIds: ['item-street-sticker', 'item-vintage-lighter'],
    canInitiateCombat: true,
    aggressionRate: 0.25,
    fictionalTitles: ['Kvartali valvaja', 'Rulaäss', 'Hoovikunn', 'Tänavajooksja'],
    firstNames: ['Ragnar', 'Kaur', 'Sten', 'Artur', 'Mikk', 'Vassili'],
    personalityPresets: { friendly: 0.2, sarcastic: 0.8, curious: 0.4, mysterious: 0.4 },
    sampleDialogue: [
      'See on meie kant. Mida sa siin luusid?',
      'Tänaval tuleb silmad lahti hoida, sõber.',
      'Kui sul on asja, räägi otse. Ära keeruta.',
    ],
  },
  VENDOR: {
    archetype: 'VENDOR',
    label: 'Kioskipidaja (Vendor)',
    isNightArchetype: false,
    faction: 'TRADERS',
    defaultAvatar: '🛒',
    hpRange: [25, 35],
    attackRange: [3, 7],
    defenseRange: [3, 6],
    primaryBehaviors: ['stay near location', 'trade', 'talk'],
    allowedActions: ['TALK', 'TRADE', 'ASK', 'LEAVE'],
    tradeInventoryIds: ['item-street-sticker', 'item-old-cassette', 'item-vintage-lighter'],
    canInitiateCombat: false,
    aggressionRate: 0.0,
    fictionalTitles: ['Kioskiomanik', 'Tänavamüüja', 'Antiigikoguja', 'Kohvikärimees'],
    firstNames: ['Elena', 'Mati', 'Rein', 'Irina', 'Silvi', 'Gunnar'],
    personalityPresets: { friendly: 0.85, sarcastic: 0.15, curious: 0.7, mysterious: 0.2 },
    sampleDialogue: [
      'Tere tulemast! Vaata ringi, mul on täna värske valik.',
      'Igal esemel siin letil on oma lugu.',
      'Sõpradele kehtib alati erihind!',
    ],
  },
  STUDENT: {
    archetype: 'STUDENT',
    label: 'Tudeng (Student)',
    isNightArchetype: false,
    faction: 'LOCALS',
    defaultAvatar: '🎒',
    hpRange: [20, 30],
    attackRange: [4, 7],
    defenseRange: [2, 4],
    primaryBehaviors: ['walk', 'observe', 'talk'],
    allowedActions: ['TALK', 'ASK', 'QUEST', 'LEAVE'],
    canInitiateCombat: false,
    aggressionRate: 0.0,
    fictionalTitles: ['Kunstitudeng', 'Arhitektuuritudeng', 'IT-üliõpilane', 'Urbanist'],
    firstNames: ['Kirke', 'Henri', 'Eliise', 'Markus', 'Grete', 'Oskar'],
    personalityPresets: { friendly: 0.75, sarcastic: 0.35, curious: 0.9, mysterious: 0.2 },
    sampleDialogue: [
      'Pildistan siinseid fassaade oma semestritöö jaoks.',
      'Tallinna nurgatagused on täis peidetud detaile!',
      'Kas tead midagi sellest sümbolist siin seinal?',
    ],
  },
  TOURIST: {
    archetype: 'TOURIST',
    label: 'Turist (Tourist)',
    isNightArchetype: false,
    faction: 'LOCALS',
    defaultAvatar: '📸',
    hpRange: [20, 30],
    attackRange: [3, 6],
    defenseRange: [2, 4],
    primaryBehaviors: ['walk', 'stop', 'observe', 'talk'],
    allowedActions: ['TALK', 'ASK', 'LEAVE'],
    canInitiateCombat: false,
    aggressionRate: 0.0,
    fictionalTitles: ['Rändur', 'Kultuurihuviline', 'Fotograaf', 'Põhjamaade avastaja'],
    firstNames: ['Oliver', 'Emma', 'Lukas', 'Sophie', 'Felix', 'Maya'],
    personalityPresets: { friendly: 0.9, sarcastic: 0.1, curious: 0.8, mysterious: 0.1 },
    sampleDialogue: [
      'Vabandust, kus asub parim vaateplatvorm?',
      'See linn on tõesti maagiline ja kompaktne!',
      'Kas saaksid soovitada mõnda ehedat kohalikku paika?',
    ],
  },
  RUNNER: {
    archetype: 'RUNNER',
    label: 'Jooksja (Runner)',
    isNightArchetype: false,
    faction: 'LOCALS',
    defaultAvatar: '🏃',
    hpRange: [30, 40],
    attackRange: [5, 9],
    defenseRange: [4, 7],
    primaryBehaviors: ['jog', 'pause', 'talk'],
    allowedActions: ['TALK', 'ASK', 'LEAVE'],
    canInitiateCombat: false,
    aggressionRate: 0.0,
    fictionalTitles: ['Hommikujooksja', 'Maratoonar', 'Pargi spordihunt', 'Kiirkõndija'],
    firstNames: ['Sander', 'Kertu', 'Rando', 'Liis', 'Taavi', 'Birgit'],
    personalityPresets: { friendly: 0.7, sarcastic: 0.2, curious: 0.5, mysterious: 0.1 },
    sampleDialogue: [
      'Väike jooksuring enne päeva algust teeb pea selgeks!',
      'Täna on suurepärane tempo ja jahe mereõhk.',
      'Jätka samas vaimus, liikumine on elu alus!',
    ],
  },

  // Night Archetypes
  RAVER: {
    archetype: 'RAVER',
    label: 'Reivar (Raver)',
    isNightArchetype: true,
    faction: 'NIGHTLIFE',
    defaultAvatar: '🪩',
    hpRange: [25, 38],
    attackRange: [5, 10],
    defenseRange: [3, 6],
    primaryBehaviors: ['wander', 'group', 'dance', 'talk'],
    allowedActions: ['TALK', 'TRADE', 'QUEST', 'LEAVE'],
    tradeInventoryIds: ['item-neon-powder', 'item-night-pass', 'item-street-sticker'],
    canInitiateCombat: false,
    aggressionRate: 0.05,
    fictionalTitles: ['Ööklubiline', 'Bassiotsija', 'Valgusmeister', 'Reivipioneeri'],
    firstNames: ['Janek', 'Ketter', 'Illimar', 'Sandra', 'Oliver-Neon', 'Helina'],
    personalityPresets: { friendly: 0.8, sarcastic: 0.3, curious: 0.7, mysterious: 0.5 },
    sampleDialogue: [
      'Kuula seda kaja tunnelis... rütm ei vaibu kunagi.',
      'Kas tead, kus toimub tänane salajane järelpidu?',
      'Öösel näevad need tänavad välja nagu neoonunenägu.',
    ],
  },
  DRIFTER: {
    archetype: 'DRIFTER',
    label: 'Öörändur (Drifter)',
    isNightArchetype: true,
    faction: 'STREET',
    defaultAvatar: '🧥',
    hpRange: [30, 42],
    attackRange: [6, 11],
    defenseRange: [4, 8],
    primaryBehaviors: ['walk', 'observe', 'talk'],
    allowedActions: ['TALK', 'ASK', 'TRADE', 'LEAVE'],
    tradeInventoryIds: ['item-old-cassette', 'item-vintage-lighter'],
    canInitiateCombat: false,
    aggressionRate: 0.1,
    fictionalTitles: ['Hilisõhtune uitaja', 'Varjude otsija', 'Hulkur', 'Tänavavaatleja'],
    firstNames: ['Erkki', 'Indrek', 'Risto', 'Pille', 'Marek'],
    personalityPresets: { friendly: 0.5, sarcastic: 0.4, curious: 0.6, mysterious: 0.7 },
    sampleDialogue: [
      'Kui linn uinub, ärkavad teised helid ja rajad.',
      'Igal öisel uksel on oma kood, kui oskad kuulata.',
      'Liigume vaikselt, öö kuulub tähelepanelikele.',
    ],
  },
  HOMELESS_WANDERER: {
    archetype: 'HOMELESS_WANDERER',
    label: 'Tänavatark (Homeless Wanderer)',
    isNightArchetype: true,
    faction: 'LOCALS',
    defaultAvatar: '🧣',
    hpRange: [30, 40],
    attackRange: [4, 8],
    defenseRange: [3, 7],
    primaryBehaviors: ['rest', 'observe', 'talk'],
    allowedActions: ['TALK', 'ASK', 'TRADE', 'LEAVE'],
    tradeInventoryIds: ['item-rare-coin', 'item-broken-radio'],
    canInitiateCombat: false,
    aggressionRate: 0.05,
    fictionalTitles: ['Pinkide valvur', 'Vanalinna kroonik', 'Tuulte tundja', 'Kasside sõber'],
    firstNames: ['Aadu', 'Lehte', 'Heino', 'Vello', 'Evi'],
    personalityPresets: { friendly: 0.7, sarcastic: 0.2, curious: 0.8, mysterious: 0.85 },
    sampleDialogue: [
      'Kassid teavad kõiki keldrikäike, mida ükski kaart ei näita.',
      'Külm tuul tuleb mere poolt, aga soe sõna soojendab rohkem.',
      'Kui otsid kadunud asju, vaata sinna, kuhu keegi ei vaata.',
    ],
  },
  BLACK_MARKET_TRADER: {
    archetype: 'BLACK_MARKET_TRADER',
    label: 'Salakaubitseja (Black Market Trader)',
    isNightArchetype: true,
    faction: 'TRADERS',
    defaultAvatar: '🕶️',
    hpRange: [35, 48],
    attackRange: [7, 13],
    defenseRange: [5, 9],
    primaryBehaviors: ['stay near location', 'trade', 'talk'],
    allowedActions: ['TALK', 'TRADE', 'ASK', 'LEAVE'],
    tradeInventoryIds: [
      'item-mystery-token',
      'item-night-pass',
      'item-rare-coin',
      'item-neon-powder',
    ],
    canInitiateCombat: false,
    aggressionRate: 0.15,
    fictionalTitles: ['Ööbörsi vahendaja', 'Salakaupmees', 'Harulduste vahendaja', 'Varjude diiler'],
    firstNames: ['Vektor', 'Sven-Hõbe', 'Kasper', 'Diana-Nox', 'Tõnis-Varjus'],
    personalityPresets: { friendly: 0.4, sarcastic: 0.7, curious: 0.6, mysterious: 0.9 },
    sampleDialogue: [
      'Mul on asju, mida päevavalgel ei müüda. Huvitab?',
      'Raha lauale või tee vabaks. Varjud ei oota.',
      'Haruldane kaup haruldastele ränduritele.',
    ],
  },
  NIGHT_WORKER: {
    archetype: 'NIGHT_WORKER',
    label: 'Öötööline (Night Worker)',
    isNightArchetype: true,
    faction: 'WORKERS',
    defaultAvatar: '🔦',
    hpRange: [35, 50],
    attackRange: [6, 12],
    defenseRange: [5, 9],
    primaryBehaviors: ['patrol', 'work', 'talk'],
    allowedActions: ['TALK', 'ASK', 'TRADE', 'LEAVE'],
    tradeInventoryIds: ['item-vintage-lighter', 'item-broken-radio'],
    canInitiateCombat: false,
    aggressionRate: 0.05,
    fictionalTitles: ['Teehooldaja', 'Öine elektrik', 'Trammide valvur', 'Laooperaator'],
    firstNames: ['Mihkel', 'Andres', 'Dmitri', 'Urmas', 'Sergo'],
    personalityPresets: { friendly: 0.6, sarcastic: 0.3, curious: 0.4, mysterious: 0.3 },
    sampleDialogue: [
      'Kuni linn magab, teeme meie teed korda.',
      'Valgusfooride rütm on öösel hoopis teistsugune.',
      'Hoia öösel silmad lahti ja ära astu ehituspiirete taha.',
    ],
  },
  SECURITY: {
    archetype: 'SECURITY',
    label: 'Öine turvamees (Security)',
    isNightArchetype: true,
    faction: 'SECURITY',
    defaultAvatar: '🛡️',
    hpRange: [45, 60],
    attackRange: [9, 15],
    defenseRange: [8, 14],
    primaryBehaviors: ['patrol', 'observe', 'confront'],
    allowedActions: ['TALK', 'ASK', 'FIGHT', 'LEAVE'],
    canInitiateCombat: true,
    aggressionRate: 0.2,
    fictionalTitles: ['Objektivalvur', 'Klubi ukselukk', 'Ööpatrull', 'Tsoonivalvur'],
    firstNames: ['Igor', 'Tarmo', 'Gleb', 'Madis', 'Roman'],
    personalityPresets: { friendly: 0.3, sarcastic: 0.5, curious: 0.3, mysterious: 0.4 },
    sampleDialogue: [
      'Dokumendid või põhjus siin viibimiseks? Tsoon on suletud.',
      'Öine rahu on minu vastutus. Ära tekita probleeme.',
      'Liigu edasi, siin pole midagi uudistada.',
    ],
  },
  MYSTERY_STRANGER: {
    archetype: 'MYSTERY_STRANGER',
    label: 'Salapärane võõras (Mystery Stranger)',
    isNightArchetype: true,
    faction: 'MYSTERIOUS',
    defaultAvatar: '🕵️',
    hpRange: [40, 55],
    attackRange: [8, 14],
    defenseRange: [6, 12],
    primaryBehaviors: ['observe', 'stay near location', 'talk'],
    allowedActions: ['TALK', 'ASK', 'TRADE', 'QUEST', 'LEAVE'],
    tradeInventoryIds: ['item-mystery-token', 'item-rare-coin', 'item-old-cassette'],
    canInitiateCombat: false,
    aggressionRate: 0.1,
    fictionalTitles: ['Mantlis rändur', 'Arhiivide otsija', 'Varjumängur', 'Koodide hoidja'],
    firstNames: ['Nimetu', 'Xander', 'Kora', 'Vesper', 'Astra'],
    personalityPresets: { friendly: 0.4, sarcastic: 0.4, curious: 0.9, mysterious: 1.0 },
    sampleDialogue: [
      'Sa otsid midagi, mida tavalised silmad ei märka...',
      'Mõned tänavad avanevad ainult siis, kui oled valmis eksima.',
      'Võta see vihje. Tulevikus võib see avada ukse.',
    ],
  },
};

export function getArchetypeDefinition(archetype: NPCArchetype): ArchetypeDefinition {
  return ARCHETYPE_DEFINITIONS[archetype] || ARCHETYPE_DEFINITIONS.CIVILIAN;
}
