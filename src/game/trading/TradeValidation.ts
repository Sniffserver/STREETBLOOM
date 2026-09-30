import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { FICTIONAL_CONTRABAND_CATALOG, FictionalTradeItem } from './ShopInventory';

export interface TradeValidationResult {
  valid: boolean;
  reason?: string;
  item?: FictionalTradeItem;
}

export class TradeValidation {
  /**
   * Validates if a player can buy a specific item from an NPC
   */
  public static validateBuy(
    playerCash: number,
    npc: SimulatedNPCInstance,
    itemId: string,
    maxDistanceMeters = 15
  ): TradeValidationResult {
    // 1. Distance check
    if (npc.distanceToPlayerMeters > maxDistanceMeters) {
      return {
        valid: false,
        reason: `Kaupmees on liiga kaugel (${npc.distanceToPlayerMeters}m). Astu lähemale (max ${maxDistanceMeters}m).`,
      };
    }

    // 2. State check
    if (npc.state === 'DESPAWNED' || npc.state === 'LEAVING' || npc.state === 'FLEEING') {
      return {
        valid: false,
        reason: 'Tegelane on lahkumas ja ei soovi tehinguid teha.',
      };
    }

    // 3. Catalog existence
    const item = FICTIONAL_CONTRABAND_CATALOG[itemId];
    if (!item) {
      return {
        valid: false,
        reason: 'Sellist kaupa pole kataloogis olemas.',
      };
    }

    // 4. Stock check
    const stock = npc.tradeStock?.[itemId] ?? 0;
    if (stock <= 0) {
      return {
        valid: false,
        reason: `Ese "${item.name}" on kaupmehel otsas!`,
        item,
      };
    }

    return {
      valid: true,
      item,
    };
  }

  /**
   * Validates if a player can sell an item to an NPC
   */
  public static validateSell(
    playerInventoryItemCount: number,
    npc: SimulatedNPCInstance,
    itemId: string
  ): TradeValidationResult {
    if (playerInventoryItemCount <= 0) {
      return {
        valid: false,
        reason: 'Sul pole seda eset seljakotis.',
      };
    }

    const item = FICTIONAL_CONTRABAND_CATALOG[itemId];
    if (!item) {
      return {
        valid: false,
        reason: 'Tundmatu ese.',
      };
    }

    return {
      valid: true,
      item,
    };
  }
}
