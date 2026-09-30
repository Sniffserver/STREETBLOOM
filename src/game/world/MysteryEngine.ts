import { DistrictName } from '../../types/game';

export interface MysteryStep {
  stepNumber: number;
  type: 'CLUE' | 'TALK_NPC' | 'VISIT_LOCATION' | 'FIND_OBJECT' | 'RESOLVE';
  title: string;
  description: string;
  targetDistrict: DistrictName;
  targetNPCName?: string;
  targetStreetName?: string;
  requiredItemName?: string;
  completed: boolean;
}

export interface MysteryChain {
  id: string;
  title: string;
  summary: string;
  steps: MysteryStep[];
  currentStepIndex: number;
  isSolved: boolean;
  rewardXP: number;
  rewardTitle: string;
}

export const SEED_MYSTERIES: MysteryChain[] = [
  {
    id: 'myst-radio-signal',
    title: 'Kadunud Raadiosignaali Müsteerium',
    summary: 'Kalamaja tagahoovidest kostub vana raadiosignaal, mis edastab varjatud koordinaate.',
    currentStepIndex: 0,
    isSolved: false,
    rewardXP: 100,
    rewardTitle: 'Kalamaja Raadioarheoloog',
    steps: [
      {
        stepNumber: 1,
        type: 'CLUE',
        title: 'Vana kassetilint',
        description: 'Leidsid kassetilindi, millele on kirjutatud koordinaadid ja tänava nimi.',
        targetDistrict: 'Kalamaja',
        completed: true,
      },
      {
        stepNumber: 2,
        type: 'TALK_NPC',
        title: 'Vestle töömees Jaanusega',
        description: 'Otsi üles Jaanus ja küsi vana raadiosageduse 104.2 MHz kohta.',
        targetDistrict: 'Kalamaja',
        targetNPCName: 'Jaanus',
        completed: false,
      },
      {
        stepNumber: 3,
        type: 'VISIT_LOCATION',
        title: 'Uuri Telliskivi ristmikku',
        description: 'Kõnni Telliskivi tänava lõigu kohale, kus antenn edastab signaali.',
        targetDistrict: 'Kalamaja',
        targetStreetName: 'Telliskivi tänav',
        completed: false,
      },
      {
        stepNumber: 4,
        type: 'FIND_OBJECT',
        title: 'Leia vaskne võti',
        description: 'Otsi Telliskivi kangialuse nurgast vana vaskne võti.',
        targetDistrict: 'Kalamaja',
        requiredItemName: 'Vaskne võti',
        completed: false,
      },
      {
        stepNumber: 5,
        type: 'RESOLVE',
        title: 'Ava salajane punker',
        description: 'Pääse ligi Kalamaja varjatud tagahoovi keldrivõlvile.',
        targetDistrict: 'Kalamaja',
        completed: false,
      },
    ],
  },
];

export class MysteryEngine {
  private mysteries: MysteryChain[];

  constructor(initialMysteries?: MysteryChain[]) {
    this.mysteries = initialMysteries || SEED_MYSTERIES.map((m) => ({ ...m }));
  }

  public getMysteries(): MysteryChain[] {
    return this.mysteries;
  }

  public getActiveMystery(): MysteryChain | undefined {
    return this.mysteries.find((m) => !m.isSolved);
  }

  public advanceMysteryStep(mysteryId: string): boolean {
    const myst = this.mysteries.find((m) => m.id === mysteryId);
    if (!myst || myst.isSolved) return false;

    const currentStep = myst.steps[myst.currentStepIndex];
    if (currentStep) {
      currentStep.completed = true;
    }

    myst.currentStepIndex += 1;

    if (myst.currentStepIndex >= myst.steps.length) {
      myst.isSolved = true;
    }

    return true;
  }
}
