import { DistrictName } from '../../types/game';

export type DiscoveryLayerType =
  | 'STREET'          // Layer 1: Street discovered by physical traversal
  | 'AREA'            // Layer 2: Area understood (sub-neighborhood cluster)
  | 'LANDMARK'        // Layer 3: Architectural/historic point of interest
  | 'SECRET'          // Layer 4: Hidden courtyard, subterranean room, secret vendor spot
  | 'STORY_LOCATION'; // Layer 5: Key narrative node for persistent quests

export interface DiscoveryLayerNode {
  id: string;
  district: DistrictName;
  layer: DiscoveryLayerType;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  unlockConditionHint: string;
  coordinates?: { latitude: number; longitude: number };
  associatedStreetId?: string;
  storyDetails?: string;
}

export interface DistrictDiscoveryProgress {
  district: DistrictName;
  layer1StreetCount: number;
  layer2AreaUnderstood: boolean;
  layer3LandmarkCount: number;
  layer4SecretsUnlocked: number;
  layer5StoryNodesUnlocked: number;
  maxDiscoveryScore: number;
  currentDiscoveryScore: number;
}

export const SEED_DISCOVERY_NODES: DiscoveryLayerNode[] = [
  // Layer 2 Area Nodes
  {
    id: 'layer2-kalamaja-soobe',
    district: 'Kalamaja',
    layer: 'AREA',
    title: 'Sõõrumäe ja Telliskivi ristmikuala',
    description: 'Kalamaja südameks olev boheemlaslik tsoon, kus vanad tehasehooned kohtuvad teatri ja loomeparkidega.',
    unlocked: true,
    unlockedAt: '2026-09-15T12:00:00.000Z',
    unlockConditionHint: 'Kaardista Kalamajas 2 tänavat.',
  },
  {
    id: 'layer2-kesklinn-viru',
    district: 'Kesklinn',
    layer: 'AREA',
    title: 'Viru ja Tammsaare Kvartal',
    description: 'Tallinna äri- ja ostuelu süda, kus tungleb tuhandeid linlasi ja rändureid.',
    unlocked: true,
    unlockedAt: '2026-09-10T10:00:00.000Z',
    unlockConditionHint: 'Kaardista Kesklinnas 2 tänavat.',
  },
  // Layer 4 Secret Nodes
  {
    id: 'layer4-kalamaja-secret-courtyard',
    district: 'Kalamaja',
    layer: 'SECRET',
    title: 'Kalamaja Varjatud Tagahoov',
    description: 'Salajane puidust hoov, kuhu pääseb vaid vana sepistatud värava vahelt. Siin tegutseb illegaalne raamatukogu.',
    unlocked: false,
    unlockConditionHint: 'Saavuta Kalamaja maine "Austatud Elanik" (30+ points) või saa vihje Marta käest.',
    coordinates: { latitude: 59.4445, longitude: 24.7312 },
  },
  {
    id: 'layer4-kopli-bunker',
    district: 'Kopli',
    layer: 'SECRET',
    title: 'Sadamakaide Maa-alune Punker',
    description: 'Nõukoguaegne varjend, mis on ümber ehitatud salajaseks musta turu kauplemispaigaks.',
    unlocked: false,
    unlockConditionHint: 'Saavuta Kopli maine "Respected Resident" või täida Sergei ülesanne.',
    coordinates: { latitude: 59.456, longitude: 24.708 },
  },
  // Layer 5 Story Location Nodes
  {
    id: 'layer5-oldtown-archive-nexus',
    district: 'Kesklinn',
    layer: 'STORY_LOCATION',
    title: 'Vanalinna Varjuarhiivi Keldrivõlvid',
    description: 'Siin ristuvad kõigi Tallinna varjurändurite lood. Siit sai alguse Pip-i esivanemate legend.',
    unlocked: false,
    unlockConditionHint: 'Täida peapeatükk "Streetbloom Algus" ja saavuta Kesklinna maine Legend.',
    storyDetails: 'Arhiivihoidja Jaan ootab siin viimast varjurändurit.',
    coordinates: { latitude: 59.4372, longitude: 24.7453 },
  },
];

export class DiscoveryLayerEngine {
  private nodes: DiscoveryLayerNode[];

  constructor(initialNodes?: DiscoveryLayerNode[]) {
    this.nodes = initialNodes || SEED_DISCOVERY_NODES.map((n) => ({ ...n }));
  }

  public getNodes(): DiscoveryLayerNode[] {
    return this.nodes;
  }

  public getNodesByDistrict(district: DistrictName): DiscoveryLayerNode[] {
    return this.nodes.filter((n) => n.district === district);
  }

  public unlockNode(nodeId: string): boolean {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node || node.unlocked) return false;

    node.unlocked = true;
    node.unlockedAt = new Date().toISOString();
    return true;
  }

  public evaluateProgress(district: DistrictName, districtReputation: number): DistrictDiscoveryProgress {
    const districtNodes = this.getNodesByDistrict(district);

    const layer2 = districtNodes.some((n) => n.layer === 'AREA' && n.unlocked);
    const layer3Count = districtNodes.filter((n) => n.layer === 'LANDMARK' && n.unlocked).length;
    const layer4Count = districtNodes.filter((n) => n.layer === 'SECRET' && n.unlocked).length;
    const layer5Count = districtNodes.filter((n) => n.layer === 'STORY_LOCATION' && n.unlocked).length;

    // Evaluate auto-unlocks for high reputation
    districtNodes.forEach((node) => {
      if (!node.unlocked) {
        if (node.layer === 'SECRET' && districtReputation >= 30) {
          node.unlocked = true;
          node.unlockedAt = new Date().toISOString();
        } else if (node.layer === 'STORY_LOCATION' && districtReputation >= 50) {
          node.unlocked = true;
          node.unlockedAt = new Date().toISOString();
        }
      }
    });

    return {
      district,
      layer1StreetCount: 1, // Minimum 1 for active walking
      layer2AreaUnderstood: layer2 || districtReputation >= 15,
      layer3LandmarkCount: layer3Count,
      layer4SecretsUnlocked: layer4Count,
      layer5StoryNodesUnlocked: layer5Count,
      maxDiscoveryScore: 100,
      currentDiscoveryScore: Math.min(100, districtReputation * 2 + (layer2 ? 20 : 0) + layer4Count * 15 + layer5Count * 25),
    };
  }
}
