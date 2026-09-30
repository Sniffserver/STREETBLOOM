import { FictionalTradeItem } from './ShopInventory';

export type EconomySinkCategory =
  | 'COMPANION_ITEM'  // Snacks, charms, toys
  | 'COSMETIC'        // Badges, map visual themes
  | 'MAP_CLUE'        // Secret district coordinates
  | 'TRAVEL_UTILITY'  // Radar boosters, coffee speed
  | 'MYSTERY_ITEM';   // Narrative items with item stories

export interface EconomySinkOffer {
  id: string;
  name: string;
  category: EconomySinkCategory;
  priceKr: number;
  icon: string;
  description: string;
  originStory: string;
  memoryNote: string;
  isUnlocked: boolean;
  effectType: 'COMPANION_BOOST' | 'RADAR_BOOST' | 'SPEED_BOOST' | 'UNLOCK_SECRET' | 'COSMETIC_BADGE';
}

export const ECONOMY_SINK_CATALOG: EconomySinkOffer[] = [
  {
    id: 'sink-fish-snack',
    name: 'Gourmet Räimerull (Kala-suupiste)',
    category: 'COMPANION_ITEM',
    priceKr: 12,
    icon: '🐟',
    description: 'Värske Kalamaja räimerull, mis paneb Pipi silmad rõõmust särama.',
    originStory: 'Ostetud Kalamaja turu kalurite letilt.',
    memoryNote: 'Pip mäletab seda maitset oma esimeselt rännakult.',
    isUnlocked: true,
    effectType: 'COMPANION_BOOST',
  },
  {
    id: 'sink-curiosity-bell',
    name: 'Uudishimu Hõbekell',
    category: 'COMPANION_ITEM',
    priceKr: 45,
    icon: '🔔',
    description: 'Väike hõbedane helisev kelluke, mis heliseb, kui läheduses on salahoov.',
    originStory: 'Sepistatud vanalinna sepa poolt.',
    memoryNote: 'Helin kutsub esile Pipi terava kuulmise.',
    isUnlocked: true,
    effectType: 'COMPANION_BOOST',
  },
  {
    id: 'sink-radar-booster',
    name: 'GPS Radari Sagedusvõimendi',
    category: 'TRAVEL_UTILITY',
    priceKr: 25,
    icon: '📡',
    description: 'Laiendab tegelaste märkahaaret +20 meetrit 15 minutiks.',
    originStory: 'Ehitatud raadioamatööri varuosadest.',
    memoryNote: 'Tunnetad sageduste meeldivat sahinat.',
    isUnlocked: true,
    effectType: 'RADAR_BOOST',
  },
  {
    id: 'sink-streetbloom-patch',
    name: 'Streetbloom Ränduri Rinnamärk',
    category: 'COSMETIC',
    priceKr: 35,
    icon: '🏵️',
    description: 'Käsitsi tikitud rinnamärk ränduri mantlile.',
    originStory: 'Valmistatud Telliskivi käsitöökojas.',
    memoryNote: 'Märk sinu pühendumusest tänavate avastamisele.',
    isUnlocked: true,
    effectType: 'COSMETIC_BADGE',
  },
  {
    id: 'sink-kalamaja-blueprint',
    name: 'Kalamaja Varjualuste Kaardikoordinaat',
    category: 'MAP_CLUE',
    priceKr: 30,
    icon: '📜',
    description: 'Paberkandjal piirkonnakaart, mis paljastab kihi 4 salapaiga.',
    originStory: 'Saadud vanakraamikaupmehe arhiivist.',
    memoryNote: 'Kaardil on punase tindiga märgitud puidust värav.',
    isUnlocked: true,
    effectType: 'UNLOCK_SECRET',
  },
];
