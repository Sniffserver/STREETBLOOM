import { GeoLocation } from '../../types/game';

export class GPSSmoother {
  private alpha: number; // Smoothing factor (0.0 to 1.0), default 0.35
  private lastSmoothedLocation: GeoLocation | null = null;

  constructor(alpha = 0.35) {
    this.alpha = alpha;
  }

  /**
   * Applies Exponential Moving Average (EMA) smoothing to coordinates to reduce jitter
   */
  public smooth(raw: GeoLocation): GeoLocation {
    if (!this.lastSmoothedLocation || raw.isSimulated || raw.isTeleport) {
      this.lastSmoothedLocation = { ...raw };
      return this.lastSmoothedLocation;
    }

    // Exponential smoothing: S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
    const smoothedLat =
      this.alpha * raw.latitude + (1 - this.alpha) * this.lastSmoothedLocation.latitude;
    const smoothedLon =
      this.alpha * raw.longitude + (1 - this.alpha) * this.lastSmoothedLocation.longitude;

    const smoothed: GeoLocation = {
      ...raw,
      latitude: smoothedLat,
      longitude: smoothedLon,
    };

    this.lastSmoothedLocation = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.lastSmoothedLocation = null;
  }
}
