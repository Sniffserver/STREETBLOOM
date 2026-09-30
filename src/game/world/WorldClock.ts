import * as SunCalcLib from 'suncalc';

const SunCalc = (SunCalcLib as any).default || SunCalcLib;

export type WorldTimePhase = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT' | 'DEEP_NIGHT';

export interface WorldTimeInfo {
  phase: WorldTimePhase;
  phaseLabel: string;
  phaseIcon: string;
  sunAltitudeDegrees: number;
  illumination: number; // 0.0 (pitch black) to 1.0 (bright sun)
  isDaytime: boolean;
  sunrise: Date;
  sunset: Date;
  dusk: Date;
  dawn: Date;
  nadir: Date;
  currentTime: Date;
}

export class WorldClock {
  /**
   * Computes exact astronomical time phase using SunCalc based on user coordinates and timestamp
   */
  public static getTimeInfo(
    lat: number,
    lon: number,
    date: Date = new Date()
  ): WorldTimeInfo {
    // Calculate solar times for current day
    const times = SunCalc.getTimes(date, lat, lon);
    const sunPos = SunCalc.getPosition(date, lat, lon);
    const altitudeDeg = (sunPos.altitude * 180) / Math.PI;

    const currentMs = date.getTime();
    const sunriseMs = times.sunrise.getTime();
    const sunsetMs = times.sunset.getTime();
    const dawnMs = times.dawn.getTime(); // Morning nautical/civil twilight start
    const duskMs = times.dusk.getTime(); // Evening nautical/civil twilight end
    const nightMs = times.night ? times.night.getTime() : duskMs + 45 * 60000;
    const nightEndMs = times.nightEnd ? times.nightEnd.getTime() : dawnMs - 45 * 60000;
    const nadirMs = times.nadir ? times.nadir.getTime() : (nightMs + nightEndMs) / 2;

    let phase: WorldTimePhase;
    let illumination = 0.5;

    // Astronomical Phase Logic based on actual SunCalc milestones and altitude
    if (altitudeDeg > 0) {
      // Sun is above the horizon
      if (currentMs < sunriseMs + 60 * 60000) {
        phase = 'DAWN';
        illumination = 0.5 + Math.min(0.5, (currentMs - dawnMs) / Math.max(1, (sunriseMs + 3600000 - dawnMs)));
      } else if (currentMs > sunsetMs - 60 * 60000) {
        phase = 'DUSK';
        illumination = 0.6 - Math.min(0.3, (currentMs - (sunsetMs - 3600000)) / Math.max(1, (sunsetMs - (sunsetMs - 3600000))));
      } else {
        phase = 'DAY';
        illumination = Math.min(1.0, 0.7 + Math.sin(Math.max(0, sunPos.altitude)) * 0.3);
      }
    } else if (altitudeDeg > -6) {
      // Civil Twilight
      if (currentMs < (sunriseMs + sunsetMs) / 2) {
        phase = 'DAWN';
        illumination = 0.45;
      } else {
        phase = 'DUSK';
        illumination = 0.40;
      }
    } else if (altitudeDeg > -12) {
      // Nautical Twilight / Early Night
      if (currentMs < (sunriseMs + sunsetMs) / 2) {
        phase = 'DAWN';
        illumination = 0.25;
      } else {
        phase = 'DUSK';
        illumination = 0.20;
      }
    } else {
      // Deep Night / Night (Sun is more than 12 degrees below horizon)
      // Check if within 2.5 hours of solar nadir (solar midnight)
      const distToNadir = Math.abs(currentMs - nadirMs);
      if (distToNadir < 2.5 * 3600 * 1000) {
        phase = 'DEEP_NIGHT';
        illumination = 0.05;
      } else {
        phase = 'NIGHT';
        illumination = 0.12;
      }
    }

    const isDaytime = phase === 'DAY' || phase === 'DAWN';

    const labels: Record<WorldTimePhase, { label: string; icon: string }> = {
      DAWN: { label: 'Koidik (Dawn)', icon: '🌅' },
      DAY: { label: 'Päev (Day)', icon: '☀️' },
      DUSK: { label: 'Videvik (Dusk)', icon: '🌇' },
      NIGHT: { label: 'Öö (Night)', icon: '🌙' },
      DEEP_NIGHT: { label: 'Sügavöö (Deep Night)', icon: '🌑' },
    };

    return {
      phase,
      phaseLabel: labels[phase].label,
      phaseIcon: labels[phase].icon,
      sunAltitudeDegrees: Math.round(altitudeDeg * 10) / 10,
      illumination: Math.max(0.05, Math.min(1.0, Math.round(illumination * 100) / 100)),
      isDaytime,
      sunrise: times.sunrise,
      sunset: times.sunset,
      dusk: times.dusk,
      dawn: times.dawn,
      nadir: times.nadir || new Date(nadirMs),
      currentTime: date,
    };
  }
}
