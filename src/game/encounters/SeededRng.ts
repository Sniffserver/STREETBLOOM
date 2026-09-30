/**
 * Fast, seedable pseudo-random number generator (Mulberry32) for deterministic evaluations and testing
 */
export class SeededRNG {
  private state: number;

  constructor(seed = 123456789) {
    this.state = seed;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public setSeed(seed: number): void {
    this.state = seed;
  }
}
