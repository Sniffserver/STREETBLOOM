import { GeoLocation, DistrictName } from '../../types/game';
import { NPCArchetype } from '../npc/NPCArchetypes';
import { WorldTimePhase } from '../world/WorldClock';

export interface EncounterReplaySnapshot {
  encounterId: string;
  seed: number;
  location: GeoLocation;
  district: DistrictName;
  worldTimePhase: WorldTimePhase;
  archetype: NPCArchetype;
  confidence: number;
  recordedAt: string;
}

export class EncounterReplayEngine {
  private static snapshots: EncounterReplaySnapshot[] = [];

  public static recordEncounter(snapshot: EncounterReplaySnapshot): void {
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 50) {
      this.snapshots.shift();
    }
  }

  public static getSnapshot(encounterId: string): EncounterReplaySnapshot | undefined {
    return this.snapshots.find((s) => s.encounterId === encounterId);
  }

  public static getAllSnapshots(): EncounterReplaySnapshot[] {
    return [...this.snapshots];
  }
}
