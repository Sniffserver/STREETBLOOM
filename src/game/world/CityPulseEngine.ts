export type CityPulseMood =
  | 'QUIET_NIGHT'
  | 'BUSY_EVENING'
  | 'FESTIVAL_MOOD'
  | 'RAINY_CITY'
  | 'MYSTERY_NIGHT';

export interface CityPulseState {
  mood: CityPulseMood;
  titleLabel: string;
  dayActivity: number;     // 0.0 to 1.0
  socialDensity: number;   // 0.0 to 1.0
  nightlifeLevel: number;  // 0.0 to 1.0
  mysteryLevel: number;    // 0.0 to 1.0
  pulsePercent: number;    // 0 to 100 overall city vitality score
}

export class CityPulseEngine {
  public static calculateCityPulse(
    hour: number,
    isNight: boolean,
    districtReputationSum: number
  ): CityPulseState {
    let mood: CityPulseMood = 'BUSY_EVENING';
    let titleLabel = 'Tavapärane Linnarütm';
    let dayActivity = 0.65;
    let socialDensity = 0.70;
    let nightlifeLevel = 0.40;
    let mysteryLevel = 0.25;

    if (hour >= 23 || hour <= 4) {
      mood = Math.random() < 0.4 ? 'MYSTERY_NIGHT' : 'QUIET_NIGHT';
      titleLabel = mood === 'MYSTERY_NIGHT' ? 'Müstiline Öölinn' : 'Vaikne Ööhämarus';
      dayActivity = 0.15;
      socialDensity = 0.30;
      nightlifeLevel = 0.85;
      mysteryLevel = 0.75;
    } else if (hour >= 18 && hour < 23) {
      mood = 'BUSY_EVENING';
      titleLabel = 'Õhtune Melu & Sagimine';
      dayActivity = 0.70;
      socialDensity = 0.85;
      nightlifeLevel = 0.60;
      mysteryLevel = 0.30;
    } else if (districtReputationSum > 100) {
      mood = 'FESTIVAL_MOOD';
      titleLabel = 'Kogukonna Festivali Rütm';
      dayActivity = 0.90;
      socialDensity = 0.95;
      nightlifeLevel = 0.50;
      mysteryLevel = 0.40;
    }

    const pulsePercent = Math.round(
      (dayActivity * 0.25 + socialDensity * 0.35 + nightlifeLevel * 0.25 + mysteryLevel * 0.15) * 100
    );

    return {
      mood,
      titleLabel,
      dayActivity,
      socialDensity,
      nightlifeLevel,
      mysteryLevel,
      pulsePercent,
    };
  }
}
