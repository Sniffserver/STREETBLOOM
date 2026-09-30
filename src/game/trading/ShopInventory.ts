import { NPCArchetype } from '../npc/NPCArchetypes';

export type ItemRarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'ILLEGAL' | 'MYSTERIOUS';

export interface FictionalTradeItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rarity: ItemRarityTier;
  icon: string;
  
  // Item Story fields
  originStory?: string;
  memoryNote?: string;
  knownByNPCs?: string[];
  narrativeClue?: string;
  requiredForQuest?: string;
}

export const FICTIONAL_CONTRABAND_CATALOG: Record<string, FictionalTradeItem> = {
  street_snacks: {
    id: 'street_snacks',
    name: 'Tänavanäks (Street Snacks)',
    description: 'Kohalik krõbe amps, mis taastab ränduri energiat ja rõõmustab Pipi.',
    basePrice: 6,
    rarity: 'COMMON',
    icon: '🥨',
    originStory: 'Küpsetatud Kesklinna kohalikus pagaritöökojas.',
    memoryNote: 'Lõhnab magusalt kardemoni ja kaneeli järele.',
  },
  vintage_lighter: {
    id: 'vintage_lighter',
    name: 'Vanaaegne tulemasin (Vintage Lighter)',
    description: 'Messingist sädelev tulemasin, mille küljel on graveering "Kopli 1984".',
    basePrice: 22,
    rarity: 'UNCOMMON',
    icon: '🔥',
    originStory: 'Leitud Kopli vana mehaanikatöökoja keldrist.',
    memoryNote: 'Selle säde meenutab tehaste õhtuseid tulesid.',
    knownByNPCs: ['Jaanus', 'Sergei'],
    narrativeClue: 'Vana töömees otsis seda meeleheitlikult.',
  },
  old_cassette: {
    id: 'old_cassette',
    name: 'Vana helikassett (Old Cassette)',
    description: 'Käsitsi kirjutatud sildiga helikassett 90ndate reiviträkkidega.',
    basePrice: 35,
    rarity: 'RARE',
    icon: '📼',
    originStory: 'Pärit Telliskivi põrandaaluse helistuudio arhiivist.',
    memoryNote: 'Kassetilindile on pliiatsiga kirjutatud tänavanimi "Soo 12".',
    knownByNPCs: ['Marta', 'Katrin'],
    narrativeClue: 'Telliskivi reiver tunneb selle biiti kaugelt ära.',
  },
  mystery_pills: {
    id: 'mystery_pills',
    name: 'Müstilised vitamiinid (Mystery Pills)',
    description: 'Fooliumis sädelevad kapslid, mis kiirendavad taju ja reaktsiooni.',
    basePrice: 48,
    rarity: 'ILLEGAL',
    icon: '💊',
    originStory: 'Pärit öise varjukaupmehe mustast seljakotist.',
  },
  neon_powder: {
    id: 'neon_powder',
    name: 'Neoonpulber (Neon Powder)',
    description: 'Ööpimeduses helendav sünteetiline pigment, mida kasutavad põrandaalused kunstnikud.',
    basePrice: 40,
    rarity: 'UNCOMMON',
    icon: '✨',
    originStory: 'Segatud Kalamaja pööninguateljees.',
  },
  broken_phone: {
    id: 'broken_phone',
    name: 'Katkine nuputelefon (Broken Phone)',
    description: 'Vana Nokia ekraaniga, mille mällu on salvestatud üks krüpteeritud aadress.',
    basePrice: 55,
    rarity: 'RARE',
    icon: '📱',
    originStory: 'Leitud Vanalinna kangi alt sadamapoolsest hoovist.',
    narrativeClue: 'Häkker otsib selle SIM-kaarti.',
  },
  lucky_coin: {
    id: 'lucky_coin',
    name: 'Õnnemünt (Lucky Coin)',
    description: 'Tundmatu sümboliga hõbemünt Vanalinna sillutiselt.',
    basePrice: 18,
    rarity: 'COMMON',
    icon: '🪙',
  },
  graffiti_sticker: {
    id: 'graffiti_sticker',
    name: 'Grafitikleebis (Graffiti Sticker)',
    description: 'Salajase Kalamaja kunstirühmituse autogramm.',
    basePrice: 12,
    rarity: 'COMMON',
    icon: '🏷️',
  },
  rare_token: {
    id: 'rare_token',
    name: 'Varjulinna žetoon (Rare Token)',
    description: 'Metallist pääse, mida aktsepteerivad vaid kogenud tänavakaupmehed.',
    basePrice: 85,
    rarity: 'MYSTERIOUS',
    icon: '🗝️',
    originStory: 'Valatud salajases sepikojas Kopli liinidel.',
  },
  night_pass: {
    id: 'night_pass',
    name: 'Ööpääse (Night Pass)',
    description: 'Salajane kutse Noblessneri ja Telliskivi suletud sisehoovidesse.',
    basePrice: 65,
    rarity: 'ILLEGAL',
    icon: '🎟️',
  },
};

export class InventoryPersonalityMapper {
  /**
   * Generates archetype-specific thematic inventory reflecting character backstory
   */
  public static getInventoryForArchetype(archetype: NPCArchetype): FictionalTradeItem[] {
    const catalog = FICTIONAL_CONTRABAND_CATALOG;

    switch (archetype) {
      case 'RAVER':
      case 'STUDENT':
        return [catalog.old_cassette, catalog.neon_powder, catalog.graffiti_sticker, catalog.street_snacks];
      case 'WORKER':
      case 'NIGHT_WORKER':
        return [catalog.vintage_lighter, catalog.broken_phone, catalog.street_snacks, catalog.lucky_coin];
      case 'BLACK_MARKET_TRADER':
      case 'MYSTERY_STRANGER':
        return [catalog.rare_token, catalog.night_pass, catalog.mystery_pills, catalog.old_cassette];
      default:
        return [catalog.street_snacks, catalog.lucky_coin, catalog.graffiti_sticker];
    }
  }
}
