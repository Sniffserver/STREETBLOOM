import { NPCArchetype } from './NPCArchetypes';
import { DistrictName } from '../../types/game';
import { SimulatedNPCInstance } from './NPCSimulation';

export type RoutineActivityType =
  | 'WORK'
  | 'LUNCH'
  | 'LEAVE_WORK'
  | 'SHOP'
  | 'HOME'
  | 'OPEN_SHOP'
  | 'BUSY_TRADE'
  | 'SHIFT_LOCATION'
  | 'CLOSE_SHOP'
  | 'GATHER'
  | 'NIGHTLIFE_AREA'
  | 'LEAVE_CLUB'
  | 'PATROL'
  | 'PERIMETER_CHECK'
  | 'REST'
  | 'WANDER'
  | 'SPECIAL_EVENT'
  | 'QUEST_WAITING'
  | 'HELPED_RELOCATED';

export type InterruptionReason =
  | 'NONE'
  | 'ACTIVE_QUEST'
  | 'DISTRICT_EVENT'
  | 'PLAYER_HELPED'
  | 'HIGH_RELATIONSHIP';

export interface RoutineGoalSlot {
  startHour: number; // 0..23
  endHour: number;   // 0..23
  activity: RoutineActivityType;
  title: string;
  description: string;
  targetLocationType: 'street' | 'shop' | 'cafe' | 'square' | 'home' | 'club' | 'secret';
}

export interface ResolvedNPCActivity {
  activity: RoutineActivityType;
  title: string;
  description: string;
  targetLocationType: string;
  interruption: InterruptionReason;
  interruptionText?: string;
  isSimulatedGoalActive: boolean;
}

export const ARCHETYPE_DAILY_GOALS: Record<NPCArchetype, RoutineGoalSlot[]> = {
  WORKER: [
    { startHour: 8, endHour: 12, activity: 'WORK', title: 'Tööl', description: 'Töötab kohalikus töökojas või ehitustandril.', targetLocationType: 'shop' },
    { startHour: 12, endHour: 13, activity: 'LUNCH', title: 'Lõunapaus', description: 'Sööb lõunat kohalikus sööklas või pingil.', targetLocationType: 'cafe' },
    { startHour: 13, endHour: 17, activity: 'WORK', title: 'Tööl', description: 'Jätkab tööpäeva lõpetamist.', targetLocationType: 'shop' },
    { startHour: 17, endHour: 18, activity: 'LEAVE_WORK', title: 'Töölt lahkumine', description: 'Kogub tööriistad kokku ja suundub tänavale.', targetLocationType: 'street' },
    { startHour: 18, endHour: 19, activity: 'SHOP', title: 'Poeskäik', description: 'Ostab kodu jaoks toiduaineid ja varustust.', targetLocationType: 'shop' },
    { startHour: 19, endHour: 23, activity: 'HOME', title: 'Kodus', description: 'Puhkab elamukvartalis naabrite seltsis.', targetLocationType: 'home' },
    { startHour: 23, endHour: 8, activity: 'REST', title: 'Öörahu', description: 'Magab ja taastub järgmiseks tööpäevaks.', targetLocationType: 'home' },
  ],
  VENDOR: [
    { startHour: 9, endHour: 13, activity: 'OPEN_SHOP', title: 'Kioski avamine', description: 'Sätib müügileti valmis ja vaatab kaubad üle.', targetLocationType: 'shop' },
    { startHour: 13, endHour: 18, activity: 'BUSY_TRADE', title: 'Tihe kauplemine', description: 'Müüb linlastele ja ränduritele rariteete.', targetLocationType: 'square' },
    { startHour: 18, endHour: 23, activity: 'SHIFT_LOCATION', title: 'Asukoha vahetus', description: 'Kolib müügikäriga õhtusesse kohtumispaika.', targetLocationType: 'street' },
    { startHour: 23, endHour: 9, activity: 'CLOSE_SHOP', title: 'Suleb kioski', description: 'Pakib kaupa ja puhkab laohoones.', targetLocationType: 'home' },
  ],
  RAVER: [
    { startHour: 22, endHour: 0, activity: 'GATHER', title: 'Kogunemine', description: 'Koguneb sõpradega enne pidu klubi ees.', targetLocationType: 'street' },
    { startHour: 0, endHour: 3, activity: 'NIGHTLIFE_AREA', title: 'Ööelu keerises', description: 'Tantsib ja naudib klubihämardust.', targetLocationType: 'club' },
    { startHour: 3, endHour: 6, activity: 'LEAVE_CLUB', title: 'Klubist lahkumine', description: 'Järelpidu ja värske varahommikune õhk.', targetLocationType: 'cafe' },
    { startHour: 6, endHour: 22, activity: 'REST', title: 'Päevane puhkus', description: 'Magab ja kogub energiat järgmiseks ööks.', targetLocationType: 'home' },
  ],
  CIVILIAN: [
    { startHour: 7, endHour: 10, activity: 'WANDER', title: 'Hommikune kõnd', description: 'Jalutab kohvikusse ja ostab hommikukohvi.', targetLocationType: 'cafe' },
    { startHour: 10, endHour: 17, activity: 'WORK', title: 'Argitoimetused', description: 'Ajab linnaosas isiklikke ja töiseid asju.', targetLocationType: 'street' },
    { startHour: 17, endHour: 22, activity: 'HOME', title: 'Aeg iseendale', description: 'Kohtub tuttavatega pargis või väljakul.', targetLocationType: 'square' },
    { startHour: 22, endHour: 7, activity: 'REST', title: 'Öörahu', description: 'Koduvaikus.', targetLocationType: 'home' },
  ],
  STUDENT: [
    { startHour: 8, endHour: 14, activity: 'WORK', title: 'Loengutes', description: 'Õpib ülikoolilinnakus ja raamatukogus.', targetLocationType: 'shop' },
    { startHour: 14, endHour: 18, activity: 'LUNCH', title: 'Õpperühm', description: 'Arutab projekte kohvikus ja pargipingil.', targetLocationType: 'cafe' },
    { startHour: 18, endHour: 23, activity: 'GATHER', title: 'Tudengiõhtu', description: 'Suhtleb Telliskivi ja Kalamaja paikades.', targetLocationType: 'street' },
    { startHour: 23, endHour: 8, activity: 'REST', title: 'Magab', description: 'Puhkab ühiselamus.', targetLocationType: 'home' },
  ],
  TOURIST: [
    { startHour: 9, endHour: 13, activity: 'WANDER', title: 'Vaatamisväärsused', description: 'Pildistab vanalinna ja arhitektuuri.', targetLocationType: 'square' },
    { startHour: 13, endHour: 15, activity: 'LUNCH', title: 'Kohalik restoran', description: 'Proovib Eesti roogasid ja meeneid.', targetLocationType: 'cafe' },
    { startHour: 15, endHour: 20, activity: 'SHOP', title: 'Suveniirid', description: 'Ostab kingitusi ja käsitööd.', targetLocationType: 'shop' },
    { startHour: 20, endHour: 9, activity: 'REST', title: 'Hotellis', description: 'Puhkab hotellis.', targetLocationType: 'home' },
  ],
  RUNNER: [
    { startHour: 6, endHour: 9, activity: 'WORK', title: 'Hommikujooks', description: 'Treenib pargiteedel ja rannapromenaadil.', targetLocationType: 'street' },
    { startHour: 9, endHour: 18, activity: 'WORK', title: 'Tööpäev', description: 'Päevased tööasjad.', targetLocationType: 'shop' },
    { startHour: 18, endHour: 21, activity: 'WORK', title: 'Õhtune sörk', description: 'Teeb teise treeningringi.', targetLocationType: 'street' },
    { startHour: 21, endHour: 6, activity: 'REST', title: 'Taastumine', description: 'Puhkab ja magab.', targetLocationType: 'home' },
  ],
  SECURITY: [
    { startHour: 20, endHour: 2, activity: 'PATROL', title: 'Õhtune patrull', description: 'Kontrollib peatänava ja kvartali turvalisust.', targetLocationType: 'street' },
    { startHour: 2, endHour: 7, activity: 'PERIMETER_CHECK', title: 'Öine perimeeter', description: 'Valvab vahekäike ja hoove.', targetLocationType: 'street' },
    { startHour: 7, endHour: 20, activity: 'REST', title: 'Puhkevahetus', description: 'Puhkab tugipunktis.', targetLocationType: 'home' },
  ],
  NIGHT_WORKER: [
    { startHour: 21, endHour: 5, activity: 'PATROL', title: 'Öövahetus', description: 'Hooldab linna taristut ja transporte.', targetLocationType: 'street' },
    { startHour: 5, endHour: 13, activity: 'REST', title: 'Magab päeval', description: 'Puhkab päevaesimesel poolel.', targetLocationType: 'home' },
    { startHour: 13, endHour: 21, activity: 'HOME', title: 'Vaba aeg', description: 'Käib poes ja ajab asju.', targetLocationType: 'shop' },
  ],
  STREET_TOUGH: [
    { startHour: 14, endHour: 22, activity: 'WANDER', title: 'Kvartali kontroll', description: 'Jälgib liikumist tagahoovides ja kangialustes.', targetLocationType: 'street' },
    { startHour: 22, endHour: 4, activity: 'GATHER', title: 'Öine kogunemine', description: 'Kohtub teiste tänavatüüpidega.', targetLocationType: 'street' },
    { startHour: 4, endHour: 14, activity: 'REST', title: 'Puhkab', description: 'Puhkab peidupaigas.', targetLocationType: 'home' },
  ],
  DRIFTER: [
    { startHour: 8, endHour: 20, activity: 'WANDER', title: 'Sihitu rännak', description: 'Liigub piirkonnast piirkonda ja jälgib linna elurütmi.', targetLocationType: 'street' },
    { startHour: 20, endHour: 8, activity: 'REST', title: 'Varjuline öömaja', description: 'Puhkab varjatud varjualuses.', targetLocationType: 'secret' },
  ],
  HOMELESS_WANDERER: [
    { startHour: 7, endHour: 21, activity: 'WANDER', title: 'Taara ja asjade otsing', description: 'Liigub taarapunktide ja pinkide vahel.', targetLocationType: 'street' },
    { startHour: 21, endHour: 7, activity: 'REST', title: 'Ööbimine', description: 'Puhkab soojas soojussõlmes või varjulises nurgas.', targetLocationType: 'secret' },
  ],
  BLACK_MARKET_TRADER: [
    { startHour: 22, endHour: 4, activity: 'BUSY_TRADE', title: 'Varjatud müük', description: 'Müüb haruldasi esemeid salajases tagahoovis.', targetLocationType: 'secret' },
    { startHour: 4, endHour: 22, activity: 'REST', title: 'Peidupaigas', description: 'Hoiab madalat profiili.', targetLocationType: 'home' },
  ],
  MYSTERY_STRANGER: [
    { startHour: 0, endHour: 24, activity: 'WANDER', title: 'Müsteerium', description: 'Ilmub ettearvamatult uduselt tänavaäärelt.', targetLocationType: 'secret' },
  ],
};

export class NPCRoutineEngine {
  /**
   * Resolves an NPC's current daily goal activity, evaluating active quest interruptions,
   * district special events, or player relationships.
   */
  public static resolveActivity(
    instance: SimulatedNPCInstance,
    currentHour: number,
    context?: {
      hasActiveQuestWithNPC?: boolean;
      activeDistrictEvent?: string;
      playerRelationshipLevel?: number;
    }
  ): ResolvedNPCActivity {
    const goals = ARCHETYPE_DAILY_GOALS[instance.archetype] || ARCHETYPE_DAILY_GOALS.CIVILIAN;

    // Find schedule slot matching hour
    const slot =
      goals.find((g) => {
        if (g.startHour <= g.endHour) {
          return currentHour >= g.startHour && currentHour < g.endHour;
        } else {
          // Crosses midnight (e.g. 23 to 8)
          return currentHour >= g.startHour || currentHour < g.endHour;
        }
      }) || goals[0];

    // Check Interruption 1: Active Quest
    if (context?.hasActiveQuestWithNPC) {
      return {
        activity: 'QUEST_WAITING',
        title: 'Ootab rändurit',
        description: `${instance.name} ootab teid seoses aktiivse ülesandega.`,
        targetLocationType: 'street',
        interruption: 'ACTIVE_QUEST',
        interruptionText: 'Aktiivne ülesanne hoiab tegelast kohtumispaigas.',
        isSimulatedGoalActive: true,
      };
    }

    // Check Interruption 2: District Special Event
    if (context?.activeDistrictEvent) {
      return {
        activity: 'SPECIAL_EVENT',
        title: `Suundus üritusele: ${context.activeDistrictEvent}`,
        description: `${instance.name} katkestas tava-rutiini ja osaleb piirkonna sündmusel.`,
        targetLocationType: 'square',
        interruption: 'DISTRICT_EVENT',
        interruptionText: `Linnaosa erisündmus "${context.activeDistrictEvent}" muutis marsruuti.`,
        isSimulatedGoalActive: true,
      };
    }

    // Check Interruption 3: Helped / High Relationship
    if (context?.playerRelationshipLevel && context.playerRelationshipLevel >= 3) {
      return {
        activity: 'HELPED_RELOCATED',
        title: 'Kohtumispaigas sõpradega',
        description: `${instance.name} külastab teie avatud usaldusväärset kohtumispaika.`,
        targetLocationType: 'cafe',
        interruption: 'PLAYER_HELPED',
        interruptionText: 'Sinu kõrge maine tõttu külastab tegelane uut paremat asukohta.',
        isSimulatedGoalActive: true,
      };
    }

    // Default: Follow standard daily schedule goal
    return {
      activity: slot.activity,
      title: slot.title,
      description: slot.description,
      targetLocationType: slot.targetLocationType,
      interruption: 'NONE',
      isSimulatedGoalActive: true,
    };
  }
}
