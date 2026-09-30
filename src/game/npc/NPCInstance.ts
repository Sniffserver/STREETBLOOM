import { NPCArchetype } from './NPCArchetypes';
import { NPCState, SimulatedNPCInstance } from './NPCSimulation';
import { DistrictName } from '../../types/game';

export class NPCInstanceHelper {
  public static isInteractable(instance: SimulatedNPCInstance): boolean {
    return (
      instance.state === 'INTERACTABLE' ||
      instance.state === 'OBSERVING' ||
      instance.distanceToPlayerMeters <= 12
    );
  }

  public static canTrade(instance: SimulatedNPCInstance): boolean {
    return (
      instance.archetype === 'VENDOR' ||
      instance.archetype === 'BLACK_MARKET_TRADER' ||
      instance.archetype === 'CIVILIAN' ||
      instance.archetype === 'STUDENT'
    );
  }

  public static canFight(instance: SimulatedNPCInstance): boolean {
    return (
      instance.archetype === 'STREET_TOUGH' ||
      instance.archetype === 'SECURITY' ||
      instance.archetype === 'RAVER'
    );
  }

  public static createInstanceSummary(instance: SimulatedNPCInstance): string {
    return `[${instance.archetype}] ${instance.name} (${instance.district}) - Kaugus: ${instance.distanceToPlayerMeters}m, Olek: ${instance.state}`;
  }
}
