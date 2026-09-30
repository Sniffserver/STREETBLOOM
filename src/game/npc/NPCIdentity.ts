import { NPCArchetype } from './NPCArchetypes';
import { DistrictName } from '../../types/game';

export interface CharacterIdentity {
  id: string; // Permanent ID e.g. "char-jaan-123"
  archetypeId: NPCArchetype;
  name: string;
  title: string;
  avatar: string;
  homeDistrict: DistrictName;
  personalityTraits: string[];
  backstorySummary: string;
  isPromotedFromEncounter: boolean;
  promotedAtTimestamp?: string;
}

export class NPCIdentity {
  /**
   * Constructs a permanent character identity from a procedural encounter
   */
  public static createPermanentIdentity(
    encounterId: string,
    archetype: NPCArchetype,
    name: string,
    title: string,
    avatar: string,
    district: DistrictName,
    traits: string[] = ['Usaldusväärne', 'Tähelepanelik']
  ): CharacterIdentity {
    return {
      id: `char-${archetype.toLowerCase()}-${Date.now().toString(36)}`,
      archetypeId: archetype,
      name,
      title,
      avatar,
      homeDistrict: district,
      personalityTraits: traits,
      backstorySummary: `Endine juhuslik kohtumine (${encounterId}), kellest sai püsiv linnakontakt piirkonnas ${district}.`,
      isPromotedFromEncounter: true,
      promotedAtTimestamp: new Date().toISOString(),
    };
  }
}
