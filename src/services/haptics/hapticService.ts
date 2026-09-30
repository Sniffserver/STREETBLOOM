export class HapticService {
  private static trigger(pattern: number | number[]): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback if blocked or unsupported
      }
    }
  }

  public static lightTap(): void {
    this.trigger(15);
  }

  public static streetDiscovered(): void {
    this.trigger(30);
  }

  public static npcEncounter(): void {
    this.trigger([40, 50, 40]);
  }

  public static rareDiscovery(): void {
    this.trigger([50, 30, 80, 30, 50]);
  }

  public static companionEvolution(): void {
    this.trigger([100, 50, 100, 50, 200]);
  }
}
