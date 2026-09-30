import { NPCArchetype } from '../../game/npc/NPCArchetypes';

export interface NPCFallbackResponse {
  greeting: string;
  response: string;
  goodbye: string;
  tradeText: string;
  questText: string;
}

export const ARCHETYPE_FALLBACKS: Record<NPCArchetype, NPCFallbackResponse> = {
  CIVILIAN: {
    greeting: 'Tere! Mõnus ilm tänaval kõndimiseks.',
    response: 'Linnas toimub iga päev midagi uut. Vaata kindlasti ka kõrvaltänavatele!',
    goodbye: 'Ilusat päeva jätku sulle!',
    tradeText: 'Mul on taskus mõned kohalikud näksid ja mündid.',
    questText: 'Kas saaksid uurida, mis seal kangialuses toimub?',
  },
  WORKER: {
    greeting: 'Tere jõudu! Tööpäev on poole peal.',
    response: 'Me parandame siin tänavakatteid. Hoidu tõstukite teelt!',
    goodbye: 'Ole ettevaatlik ehitusalas.',
    tradeText: 'Mul on müüa mõned tööriistad ja soe kohv.',
    questText: 'Mul jäi vanaaegne tulemasin keldrisse, kas aitaksid otsida?',
  },
  NIGHT_WORKER: {
    greeting: 'Öö on pikk, aga töö vajab tegemist.',
    response: 'Kalamaja öine vaikusehämarus on ainulaadne.',
    goodbye: 'Rahulikku ööd.',
    tradeText: 'Siin on mõned öised varuosad.',
    questText: 'Kontrolli, kas tänava laternad põlevad korralikult.',
  },
  RAVER: {
    greeting: 'Tsau! Kas kuulsid seda bassi?',
    response: 'Telliskivi saalis toimub täna midagi suurt. Tule kindlasti läbi!',
    goodbye: 'Näeme tantsupõrandal!',
    tradeText: 'Mul on mõned vana helikassett ja neoonpulber.',
    questText: 'Leia kadunud kassetilint, millele on kirjutatud träki nimi!',
  },
  STUDENT: {
    greeting: 'Hey! Tulin just loengust.',
    response: 'Selles linnaosas on parimad kohvikud õppimiseks.',
    goodbye: 'Toredat avastamist!',
    tradeText: 'Võin vahetada mõned vanad kleepsud ja märkmed.',
    questText: 'Kas tead, kust leiaks vana raadiosignaali koordinaadid?',
  },
  VENDOR: {
    greeting: 'Tere tulemast minu leti juurde!',
    response: 'Minu kaup on alati värske ja pärit kohalikelt meistritelt.',
    goodbye: 'Tule ikka jälle läbi!',
    tradeText: 'Heida pilk peale – siin on parimad pakkumised!',
    questText: 'Aita mul tuua värske saadetis sadamast.',
  },
  BLACK_MARKET_TRADER: {
    greeting: 'Ssst... Hoia madalat profiili.',
    response: 'Selles linnas on asju, mida poes ei müüda.',
    goodbye: 'Me ei kohtunud kunagi.',
    tradeText: 'Mul on mõned haruldased žetoonid ja ööpääsmed.',
    questText: 'Toimetaksid selle salajase paketi Telliskivi hoovi?',
  },
  STREET_TOUGH: {
    greeting: 'Mida sa siin kondad?',
    response: 'See tänav on meie kontrolli all. Ole parem viisakas.',
    goodbye: 'Kõnni otse edasi.',
    tradeText: 'Mul on pakkuda mõned tänavanäksid.',
    questText: 'Näita, et saad tänaval hakkama.',
  },
  SECURITY: {
    greeting: 'Distsipliin ja kord.',
    response: 'Jälgime piirkonna turvalisust.',
    goodbye: 'Hoia korda.',
    tradeText: 'Ametlikud lubakirjad ja pääsmed.',
    questText: 'Aita kontrollida suletud hoovi väravaid.',
  },
  MYSTERY_STRANGER: {
    greeting: 'Varjud kõnelevad sinu teekonnast...',
    response: 'Igal tänaval on oma mälestus, mis ootab äratamist.',
    goodbye: 'Rändame edasi.',
    tradeText: 'Siin on varjulinna müstilised esemed.',
    questText: 'Haruta lahti raadiosignaali müsteerium.',
  },
  TOURIST: {
    greeting: 'Tere! Eksisin vist veidi ära.',
    response: 'Tallinna vanalinn ja puitmajad on tõesti kaunid!',
    goodbye: 'Aitäh abi eest!',
    tradeText: 'Mul on vahetada mõned suveniirid ja kaardid.',
    questText: 'Näita mulle parimat kohvikut Kalamajas.',
  },
  HOMELESS_WANDERER: {
    greeting: 'Päev korraga, rändur.',
    response: 'Ma tean selle linna igat kangi ja soojakut.',
    goodbye: 'Hoia sooja.',
    tradeText: 'Leidsin sillutiselt mõned vaskmündid.',
    questText: 'Aita leida soe tass teed.',
  },
  DRIFTER: {
    greeting: 'Hämarus varjab teid ja lugusid.',
    response: 'Liigun vaikselt tänavalt tänavale.',
    goodbye: 'Rahulikku rännakut.',
    tradeText: 'Leidsin kangi alt midagi huvitavat.',
    questText: 'Otsi üles kadunud hoovivärava kood.',
  },
  RUNNER: {
    greeting: 'Jooksurütm hoiab meele erksana!',
    response: 'Tallinna pargid ja kergliiklusteed on parimad treeninguks.',
    goodbye: 'Jätka samas vaimus!',
    tradeText: 'Mul on pakkuda energiabatoon ja spordijook.',
    questText: 'Aita mõõta pargi uut jooksurada.',
  },
};

export class AIFallbackEngine {
  public static getFallbackResponse(archetype: NPCArchetype): NPCFallbackResponse {
    return ARCHETYPE_FALLBACKS[archetype] || ARCHETYPE_FALLBACKS.CIVILIAN;
  }
}
