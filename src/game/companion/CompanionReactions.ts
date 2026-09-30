import { SimulatedNPCInstance } from '../npc/NPCSimulation';

export type CompanionPersonalityType = 'CURIOUS' | 'BRAVE' | 'SHY' | 'SOCIAL';

export interface CompanionReaction {
  personality: CompanionPersonalityType;
  quote: string;
  expression: 'surprised' | 'alert' | 'happy' | 'cautious';
}

export class CompanionReactions {
  private static REACTIONS: Record<CompanionPersonalityType, Record<string, string[]>> = {
    CURIOUS: {
      SPAWNED: [
        'Märkasin kedagi eespool tänaval!',
        'Vaata, keegi liigub seal nurgataguses!',
        'Uudishimu ajab mind ärevusse, vaatame lähemalt?',
      ],
      APPROACHING: [
        'Ta märkab meid tegelikult...',
        'Tegelane paistab põnev, hoia silm peal!',
      ],
      HOSTILE: [
        'Oot-oot, ta hoiab rusikaid rullis...',
        'See tegelane ei paista eriti sõbralik!',
      ],
    },
    BRAVE: {
      SPAWNED: [
        'Lõpuks ometi midagi põnevat!',
        'Keegi teel! Lähme ja vaatame, millest ta tehtud on.',
      ],
      APPROACHING: [
        'Astu julgelt edasi, ma julgustan sind!',
        'Oleme valmis igaks katsumuseks.',
      ],
      HOSTILE: [
        'Tule aga tule! Nii kergesti me tagasi ei tagane!',
      ],
    },
    SHY: {
      SPAWNED: [
        'Ehk läbime selle tänava teist kaudu?',
        'Oot-oot, eespool on keegi tundmatu...',
      ],
      APPROACHING: [
        'Palun ole ettevaatlik, me ei tea tema kavatsusi.',
      ],
      HOSTILE: [
        'Oi ei, parem pöörame ringi või hiilime mööda!',
      ],
    },
    SOCIAL: {
      SPAWNED: [
        'Lähme astume juurde ja räägime!',
        'Uus nägu linna peal! Ehk on tal meile lugusid pajatada?',
      ],
      APPROACHING: [
        'Tervita teda kindlasti käepigistusega!',
      ],
      HOSTILE: [
        'Äkki saame asjad ikka rahulikult selgeks rääkida?',
      ],
    },
  };

  public static getReactionForEncounter(
    npc: SimulatedNPCInstance,
    personality: CompanionPersonalityType = 'CURIOUS'
  ): CompanionReaction {
    const isHostile = npc.archetype === 'STREET_TOUGH' || npc.archetype === 'SECURITY';
    const category = isHostile ? 'HOSTILE' : npc.distanceToPlayerMeters <= 20 ? 'APPROACHING' : 'SPAWNED';

    const quotes = this.REACTIONS[personality][category] || this.REACTIONS.CURIOUS.SPAWNED;
    const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];

    return {
      personality,
      quote: selectedQuote,
      expression: isHostile ? 'alert' : 'surprised',
    };
  }
}
