import { DistrictName } from '../../types/game';

export type MicroEventType =
  | 'STREET_CAT'
  | 'COMPANION_MUSIC'
  | 'STRANGE_STICKER'
  | 'NPC_DROPPED_ITEM'
  | 'ATMOSPHERIC_WHISPER'
  | 'RARE_LIGHT_GLOW';

export interface MicroEvent {
  id: string;
  type: MicroEventType;
  title: string;
  description: string;
  durationSeconds: number; // 5 to 30s
  icon: string;
  rewardText?: string;
  companionComment?: string;
}

export const MICRO_EVENT_CATALOG: Omit<MicroEvent, 'id'>[] = [
  {
    type: 'STREET_CAT',
    title: 'Must tänavakass puitraamil',
    description: 'Vana puumaja aknalaual pürrib must kass, kes jälgib Pipi uudishimuliku pilguga.',
    durationSeconds: 10,
    icon: '🐈',
    companionComment: 'Pip tõmbub korraks kangi ja teeb pehme "mjäu" hääle.',
  },
  {
    type: 'COMPANION_MUSIC',
    title: 'Kaugelt kostuv saksofon',
    description: 'Kõrvaltänava kangialusest kostab mahedat saksofoniviisi. Õhk on täis hilisõhtust meloodiat.',
    durationSeconds: 15,
    icon: '🎷',
    companionComment: 'Pip nökutab pead rütmis kaasa.',
  },
  {
    type: 'STRANGE_STICKER',
    title: 'Müstiline kleeps postil',
    description: 'Tänavalaternale on kleebitud helendav sümbol: "Streetbloom varjud on ärkvel".',
    durationSeconds: 8,
    icon: '🏷️',
    companionComment: 'Pip pildistab oma mällu kleepsu asukoha.',
  },
  {
    type: 'NPC_DROPPED_ITEM',
    title: 'Maha kukkunud pilet',
    description: 'Mööduv rändur pillas sillutisele vanalinna kontserdipileti või vana vaskmündi.',
    durationSeconds: 12,
    icon: '🪙',
    rewardText: '+15 XP ja vaskmünt taskus!',
    companionComment: 'Pip korjab vaskmündi kiiresti üles.',
  },
  {
    type: 'ATMOSPHERIC_WHISPER',
    title: 'Udune valguskiir',
    description: 'Kõrgete majade vahelt langeb tänavale salapärane kuldne päikesekiir.',
    durationSeconds: 10,
    icon: '✨',
    companionComment: 'Pip soojendab käppasid päikesekiire laigus.',
  },
];

export class MicroEventEngine {
  /**
   * Roll a chance for a micro-event during walking (e.g. 15% probability per 30m)
   */
  public static rollMicroEvent(district: DistrictName, isNight: boolean): MicroEvent | null {
    const roll = Math.random();
    if (roll > 0.30) return null; // 30% chance when called

    const idx = Math.floor(Math.random() * MICRO_EVENT_CATALOG.length);
    const template = MICRO_EVENT_CATALOG[idx];

    return {
      ...template,
      id: `mevent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
  }
}
