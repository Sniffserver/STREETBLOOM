import { DistrictName, NPCSpawnEvent, InteractionChoice, NPC } from '../../types/game';
import { SEED_NPCS } from '../../data/npcsSeed';

export const WORLD_VERSION = 'v1.0';

/**
 * Deterministic fast string hash function
 */
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Get the current time slot string (1-hour discrete slot, e.g. "2026-09-29-18")
 */
export function getCurrentTimeSlot(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}`;
}

/**
 * Standard choices tailored per NPC archetype and relationship
 */
/**
 * Standard choices rigorously designed according to the Varjulinn economic model:
 * E[Δraha] = p*R - C - (1-p)*L
 *
 * 1. Väike töö (Small job): p=1.00, R=24, C=0, L=0 => E = 24 kr (Starter, guaranteed, 0 risk)
 * 2. Kauplemine (Trade): p=1.00, R=38, C=12, L=0 => E = 26 kr (Requires input/capital)
 * 3. Riskantne ots (Risky gig): p=0.60, R=65, C=5, L=15 => E = 28 kr (High variance, G=3/day)
 * 4. Looülesanne (Story quest): Measured by contacts, access, project materials, reputation
 */
export function generateInteractionChoices(npcId: string, spawnId: string, npc?: NPC): InteractionChoice[] {
  switch (npcId) {
    case 'npc-marta': {
      const choices: InteractionChoice[] = [
        {
          id: `${spawnId}-job`,
          title: 'Väike töö: Aita kohviku hommikuses ettevalmistuses',
          description: 'Pese kohvikannud ja pane lauad valmis. Kindel ja riskivaba teenistus algajale.',
          category: 'small_job',
          turnCost: 1,
          cashCost: 0,
          cashReward: 24,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 2,
          timeMinutes: 5,
          outcomeText: 'Marta ulatab sulle 24 kr ja tänab sooja naeratusega: "Puhtad lauad toovad alati häid uudiseid."',
        },
        {
          id: `${spawnId}-trade`,
          title: 'Kauplemine: Vahenda röstitud kardemonipartiid',
          description: 'Nõuab 12 kr käibekapitali tooraine ostuks. Tulu müügist 38 kr (netotulu 26 kr).',
          category: 'trade',
          turnCost: 1,
          cashCost: 12,
          cashReward: 38,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 3,
          timeMinutes: 8,
          outcomeText: 'Kaup sooritatud! Ostsid tooraine 12 kr eest ja müüsid 38 kr eest, teenides 26 kr kasumit.',
        },
        {
          id: `${spawnId}-gig`,
          title: 'Riskantne ots: Varjatud saadetis Kalaranna sadamasse',
          description: 'Vii pitseeritud kiri Kalaranda. Tagatis 5 kr. 60% õnnestumine (+65 kr), 40% ebaõnnestumisel kaotus 15 kr trahvi.',
          category: 'risk_gig',
          turnCost: 2,
          cashCost: 5,
          cashReward: 65,
          failureLoss: 15,
          successProbability: 0.60,
          riskPercent: 40,
          reputationChange: 3,
          dailyLimit: 3,
          timeMinutes: 12,
          requiredSkill: { skill: 'streetSmart', level: 1 },
          riskDescription: 'Sadamavalve patrull pidas su kinni! Kaotasid 5 kr tagatise ja maksid 15 kr leppetrahvi.',
          outcomeText: 'Saadetis toimetatud märkamatult kohale! Said kokkulepitud 65 kr ja tänavate usaldus kasvas.',
        },
        {
          id: `${spawnId}-story`,
          title: 'Looülesanne: Uuri Vabriku tänava saladust',
          description: 'Aruta Martaga Kalamaja varjatud hoovide üle. Peamine tasu on kontaktid ja lugu.',
          category: 'story',
          turnCost: 1,
          cashCost: 0,
          cashReward: 10,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 8,
          timeMinutes: 10,
          outcomeText: 'Marta usaldab sulle vana joonise Kalamaja võrgustiku kohta ning märgib kaardile uue kontakti.',
        },
      ];

      // Branching: unlocked action if player has proven themselves on prior courier run
      if (npc?.knownSecrets?.includes('PROVEN_COURIER')) {
        choices.push({
          id: `${spawnId}-master-courier`,
          title: 'Usaldusisiku ülesanne: Varjulille konfidentsiaalne saadetis',
          description: 'Tänu su eelmisele edukale Kalaranna otsale usaldab Marta sulle otsetee Vanalinna arhiivi.',
          category: 'story',
          turnCost: 1,
          cashCost: 0,
          cashReward: 45,
          failureLoss: 0,
          successProbability: 1.0,
          reputationChange: 6,
          timeMinutes: 8,
          outcomeText: 'Marta noogutab tunnustavalt: "Kalarannas räägiti sinu kiirusest tõtt. Siin on lubatud eritasu 45 kr."',
        });
      }

      return choices;
    }

    case 'npc-otto':
      return [
        {
          id: `${spawnId}-job`,
          title: 'Väike töö: Puhasta ja õlita kellamehhanisme',
          description: 'Hoolas ja kindel käsitöö vana kellassepa töökojas. Garanteeritud tasu.',
          category: 'small_job',
          turnCost: 1,
          cashCost: 0,
          cashReward: 24,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 2,
          timeMinutes: 5,
          outcomeText: 'Otto vaatab tööd luubiga ja noogutab rahulolevalt: "Korralik töö. Siin on sinu 24 kr."',
        },
        {
          id: `${spawnId}-trade`,
          title: 'Kauplemine: Tarni messingist hammasrattaid',
          description: 'Investeeri 12 kr metalltoorikutesse. Otto maksab valmisdetailide eest 38 kr.',
          category: 'trade',
          turnCost: 1,
          cashCost: 12,
          cashReward: 38,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 3,
          timeMinutes: 8,
          outcomeText: 'Hammasrattad sobivad tornikella täpselt! Saad 38 kr (netokasum 26 kr).',
        },
        {
          id: `${spawnId}-gig`,
          title: 'Riskantne ots: Peenhäälesta tundmatu mehaaniline seade',
          description: 'Ettemaks 5 kr varuosadeks. 60% õnnestub (+65 kr), 40% puruneb vedru (-15 kr trahv).',
          category: 'risk_gig',
          turnCost: 2,
          cashCost: 5,
          cashReward: 65,
          failureLoss: 15,
          successProbability: 0.60,
          riskPercent: 40,
          reputationChange: 3,
          dailyLimit: 3,
          timeMinutes: 12,
          requiredSkill: { skill: 'tech', level: 1 },
          riskDescription: 'Vedru hüppas pesast lahti ja kriimustas sihverplaati! Kaotasid ettemaksu ja 15 kr kahjutasu.',
          outcomeText: 'Mehhanism hakkas veatult tiksuma! Otto maksab preemiat 65 kr.',
        },
        {
          id: `${spawnId}-story`,
          title: 'Looülesanne: Vanalinna arhiiviülesanne',
          description: 'Kuula Otto mälestusi Katariina käigu maa-alustest käikudest.',
          category: 'story',
          turnCost: 1,
          cashCost: 0,
          cashReward: 10,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 8,
          timeMinutes: 10,
          outcomeText: 'Otto avab vana nahkköites raamatu ja jagab Kesklinna infovõrgustiku võtmeid.',
        },
      ];

    case 'npc-sirli':
      return [
        {
          id: `${spawnId}-job`,
          title: 'Väike töö: Tee kiire teavitustiir turu ümbruses',
          description: 'Vii teade Balti Jaama jalgrattahoidlasse. Lihtne ja ohutu.',
          category: 'small_job',
          turnCost: 1,
          cashCost: 0,
          cashReward: 24,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 2,
          timeMinutes: 5,
          outcomeText: 'Teade kohale toimetatud! Sirli viskab sulle 24 kr: "Tänud, jalad liiguvad hästi!"',
        },
        {
          id: `${spawnId}-trade`,
          title: 'Kauplemine: Vahenda Telliskivi disainiplakatite partiid',
          description: 'Osta 12 kr eest kunstnike töid ja müü galeriile 38 kr eest.',
          category: 'trade',
          turnCost: 1,
          cashCost: 12,
          cashReward: 38,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 3,
          timeMinutes: 8,
          outcomeText: 'Plakatid müüdud! Taskus on 38 kr (netokasum 26 kr).',
        },
        {
          id: `${spawnId}-gig`,
          title: 'Riskantne ots: Ekspresskuller läbi Telliskivi siseõuede',
          description: 'Kiire saadetis läbi suletud tööstusalade. 5 kr tagatis. 60% õnnestub (+65 kr), 40% vahele jäämine (-15 kr).',
          category: 'risk_gig',
          turnCost: 2,
          cashCost: 5,
          cashReward: 65,
          failureLoss: 15,
          successProbability: 0.60,
          riskPercent: 40,
          reputationChange: 3,
          dailyLimit: 3,
          timeMinutes: 12,
          requiredSkill: { skill: 'stealth', level: 1 },
          riskDescription: 'Turvamees märkas sind sisehoovis ja konfiskeeris paki! Kaotasid tagatise ja maksid 15 kr trahvi.',
          outcomeText: 'Libisesid märkamatult läbi tõkkepuu! Kulleritasu 65 kr on sinu.',
        },
        {
          id: `${spawnId}-story`,
          title: 'Looülesanne: Telliskivi loomevõrgustiku laiendamine',
          description: 'Kaardista kohalike tänavakunstnike kohtumispaigad.',
          category: 'story',
          turnCost: 1,
          cashCost: 0,
          cashReward: 10,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 8,
          timeMinutes: 10,
          outcomeText: 'Sirli tutvustab sind kohaliku loomevõrgustiku liikmetele ja avab Telliskivi projekti!',
        },
      ];

    default:
      return [
        {
          id: `${spawnId}-job`,
          title: 'Väike töö: Lihtne abikäsi linnaosas',
          description: 'Aita kohalikul elanikul toimetada igapäevaseid asju. Garanteeritud sissetulek.',
          category: 'small_job',
          turnCost: 1,
          cashCost: 0,
          cashReward: 24,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 2,
          timeMinutes: 5,
          outcomeText: 'Teene tehtud korralikult! Said tänutäheks 24 kr.',
        },
        {
          id: `${spawnId}-trade`,
          title: 'Kauplemine: Vahenda kohalikke tarvikuid',
          description: 'Investeeri 12 kr ja müü edasi 38 kr eest (netotulu 26 kr).',
          category: 'trade',
          turnCost: 1,
          cashCost: 12,
          cashReward: 38,
          failureLoss: 0,
          successProbability: 1.0,
          riskPercent: 0,
          reputationChange: 3,
          timeMinutes: 8,
          outcomeText: 'Kauplemine õnnestus! Said 38 kr (netokasum 26 kr).',
        },
        {
          id: `${spawnId}-gig`,
          title: 'Riskantne ots: Fiktiivne tellimus linnaosa äärealal',
          description: 'Vajab 5 kr ettemaksu. 60% õnnestub (+65 kr), 40% ebaõnnestub (-15 kr trahv).',
          category: 'risk_gig',
          turnCost: 2,
          cashCost: 5,
          cashReward: 65,
          failureLoss: 15,
          successProbability: 0.60,
          riskPercent: 40,
          reputationChange: 3,
          dailyLimit: 3,
          timeMinutes: 12,
          riskDescription: 'Tellimus osutus lõksuks! Kaotasid 5 kr tagatise ja maksid 15 kr lisakahju.',
          outcomeText: 'Tellimus täidetud kiirelt! Teenisid 65 kr.',
        },
      ];
  }
}

/**
 * Generate a deterministic NPC spawn event for a district and timeSlot
 * spawnId = hash(worldVersion, districtId, timeSlot, npcArchetype)
 */
export function getDeterministicSpawnForDistrict(
  district: DistrictName,
  timeSlot = getCurrentTimeSlot(),
  availableNpcs: NPC[] = SEED_NPCS
): NPCSpawnEvent | null {
  // Find NPCs belonging to or scheduled in this district
  const districtNpcs = availableNpcs.filter((n) => n.district === district);
  if (districtNpcs.length === 0) return null;

  // Stable index selection using hash
  const hashVal = parseInt(hashString(`${WORLD_VERSION}-${district}-${timeSlot}`), 16);
  const selectedNpc = districtNpcs[hashVal % districtNpcs.length];

  const spawnHash = hashString(`${WORLD_VERSION}-${district}-${timeSlot}-${selectedNpc.id}`);
  const spawnId = `spn-${spawnHash.slice(0, 10)}`;

  // Slot duration: end of the current hour
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  const expiresAt = nextHour.getTime();

  return {
    spawnId,
    npcId: selectedNpc.id,
    district,
    latitude: selectedNpc.latitude,
    longitude: selectedNpc.longitude,
    timeSlot,
    expiresAt,
    interactionRadius: 65, // meters
    rewardCap: 3,          // max 3 rewarded interactions per spawn
    timesInteracted: 0,
    storyState: 'available',
    choices: generateInteractionChoices(selectedNpc.id, spawnId, selectedNpc),
  };
}
