import { GeoLocation } from '../../types/game';
import { GPSValidation } from './GPSValidation';
import { GPSSmoother } from './GPSSmoother';
import { MovementAnalyzer, MeaningfulMovementEvent } from './MovementAnalyzer';

export type MovementSubscriber = (event: MeaningfulMovementEvent) => void;

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private smoother = new GPSSmoother();
  private analyzer = new MovementAnalyzer();
  private subscribers: Set<MovementSubscriber> = new Set();
  private lastRawLocation: GeoLocation | null = null;
  private isWatching = false;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public subscribe(subscriber: MovementSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public startWatching(
    onSuccess?: (event: MeaningfulMovementEvent) => void,
    onError?: (error: GeolocationPositionError) => void
  ): void {
    if (this.isWatching || typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    this.isWatching = true;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const raw: GeoLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        };

        this.processRawLocation(raw, onSuccess);
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
        if (onError) onError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );
  }

  public stopWatching(): void {
    if (this.watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isWatching = false;
  }

  /**
   * Manually push a raw or simulated position (for debug walking, teleports, mock simulation)
   */
  public pushLocation(
    location: GeoLocation,
    onSuccess?: (event: MeaningfulMovementEvent) => void
  ): void {
    this.processRawLocation(location, onSuccess);
  }

  private processRawLocation(
    raw: GeoLocation,
    onSuccess?: (event: MeaningfulMovementEvent) => void
  ): void {
    this.lastRawLocation = raw;

    // Validate GPS reading
    const validation = GPSValidation.validate(raw);
    if (!validation.isValid) {
      return;
    }

    // Apply smoothing
    const smoothed = this.smoother.smooth(raw);

    // Analyze movement for meaningful displacement
    const movementEvent = this.analyzer.analyze(smoothed);

    if (movementEvent.isMeaningful) {
      if (onSuccess) onSuccess(movementEvent);
      this.subscribers.forEach((sub) => sub(movementEvent));
    }
  }

  public getLastRawLocation(): GeoLocation | null {
    return this.lastRawLocation;
  }
}
