export class EncounterCooldown {
  private lastSpawnTimeMs = 0;
  private accumulatedMovementMeters = 0;
  private minMovementThreshold = 35; // 30-60 meters
  private minCooldownSeconds = 50;   // 45-120 seconds

  constructor(minMovement = 35, cooldownSec = 50) {
    this.minMovementThreshold = minMovement;
    this.minCooldownSeconds = cooldownSec;
  }

  /**
   * Accumulates validated physical movement distance
   */
  public addMovement(meters: number): void {
    if (meters > 0) {
      this.accumulatedMovementMeters += meters;
    }
  }

  public getAccumulatedMovement(): number {
    return this.accumulatedMovementMeters;
  }

  public getSecondsSinceLastSpawn(nowMs: number = Date.now()): number {
    if (this.lastSpawnTimeMs === 0) return 999999;
    return (nowMs - this.lastSpawnTimeMs) / 1000;
  }

  /**
   * Evaluates if movement and cooldown gates allow evaluating an encounter
   */
  public isReadyForEncounter(nowMs: number = Date.now()): {
    ready: boolean;
    reason?: 'cooldown_active' | 'insufficient_movement';
    remainingSeconds: number;
    remainingMeters: number;
  } {
    const elapsedSec = this.getSecondsSinceLastSpawn(nowMs);
    const remainingSec = Math.max(0, this.minCooldownSeconds - elapsedSec);
    const remainingMeters = Math.max(0, this.minMovementThreshold - this.accumulatedMovementMeters);

    if (remainingSec > 0) {
      return {
        ready: false,
        reason: 'cooldown_active',
        remainingSeconds: Math.ceil(remainingSec),
        remainingMeters: Math.ceil(remainingMeters),
      };
    }

    if (this.accumulatedMovementMeters < this.minMovementThreshold) {
      return {
        ready: false,
        reason: 'insufficient_movement',
        remainingSeconds: 0,
        remainingMeters: Math.ceil(remainingMeters),
      };
    }

    return {
      ready: true,
      remainingSeconds: 0,
      remainingMeters: 0,
    };
  }

  /**
   * Resets cooldown timer and movement accumulator upon successful spawn
   */
  public recordSpawn(nowMs: number = Date.now(), customCooldownSec?: number): void {
    this.lastSpawnTimeMs = nowMs;
    this.accumulatedMovementMeters = 0;
    if (customCooldownSec) {
      this.minCooldownSeconds = customCooldownSec;
    }
  }

  public reset(): void {
    this.lastSpawnTimeMs = 0;
    this.accumulatedMovementMeters = 0;
  }
}
