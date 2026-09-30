export type WeatherCondition =
  | 'CLEAR'
  | 'CLOUDY'
  | 'RAIN'
  | 'FOG'
  | 'SNOW'
  | 'SUMMER_EVENING';

export interface WeatherModifiers {
  condition: WeatherCondition;
  label: string;
  icon: string;
  civilianSpawnMultiplier: number;
  shelterNpcMultiplier: number;
  socialDensityMultiplier: number;
  mysteryEncounterBonus: number;
  speedModifier: number;
}

export class WeatherContext {
  /**
   * Evaluates deterministic weather based on day of year, hour, and temperature
   */
  public static getWeatherForDate(date: Date = new Date()): WeatherModifiers {
    const month = date.getMonth(); // 0-11
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Sun, 5 = Fri
    const isFridayNight = dayOfWeek === 5 && (hour >= 19 || hour < 4);

    // Estonian seasonal profile
    if (month >= 11 || month <= 2) {
      // Winter
      return {
        condition: 'SNOW',
        label: 'Kerge lumesadu (Light snow)',
        icon: '❄️',
        civilianSpawnMultiplier: 0.6,
        shelterNpcMultiplier: 1.5,
        socialDensityMultiplier: 0.5,
        mysteryEncounterBonus: 0.2,
        speedModifier: 0.9,
      };
    } else if (month >= 5 && month <= 7 && hour >= 18 && hour <= 23) {
      // White nights / Summer evening
      return {
        condition: 'SUMMER_EVENING',
        label: 'Valge suveõhtu (Summer evening)',
        icon: '🌅',
        civilianSpawnMultiplier: 1.4,
        shelterNpcMultiplier: 0.8,
        socialDensityMultiplier: 1.8,
        mysteryEncounterBonus: 0.4,
        speedModifier: 1.05,
      };
    } else if (isFridayNight) {
      return {
        condition: 'CLEAR',
        label: 'Reede öö (Friday night vibes)',
        icon: '✨',
        civilianSpawnMultiplier: 0.9,
        shelterNpcMultiplier: 0.7,
        socialDensityMultiplier: 1.9,
        mysteryEncounterBonus: 0.5,
        speedModifier: 1.0,
      };
    }

    // Default Tallinn oceanic mild weather
    return {
      condition: 'CLEAR',
      label: 'Selge ilm (Clear)',
      icon: '🌤️',
      civilianSpawnMultiplier: 1.0,
      shelterNpcMultiplier: 1.0,
      socialDensityMultiplier: 1.0,
      mysteryEncounterBonus: 0.0,
      speedModifier: 1.0,
    };
  }
}
