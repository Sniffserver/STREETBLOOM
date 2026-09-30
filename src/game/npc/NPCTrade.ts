import {
  FICTIONAL_TRADE_ITEMS,
  FictionalTradeItem,
} from './NPCArchetypes';
import { SimulatedNPCInstance } from './NPCSimulation';
import { NPCRelationshipManager } from './NPCRelationship';
import { getStandingLabel } from './NPCFaction';

export interface TradeCalculationResult {
  itemId: string;
  item: FictionalTradeItem;
  basePrice: number;
  finalPrice: number;
  discountPercent: number;
  inStock: boolean;
  stockCount: number;
}

export class NPCTrade {
  /**
   * Calculates final trade price considering relationship level and faction standing
   */
  public static calculatePrice(
    itemId: string,
    npc: SimulatedNPCInstance,
    relationshipLevel = 0,
    factionReputation = 0
  ): TradeCalculationResult | null {
    const item = FICTIONAL_TRADE_ITEMS[itemId];
    if (!item) return null;

    const relDetails = NPCRelationshipManager.getDetails(relationshipLevel);
    const factionDetails = getStandingLabel(factionReputation);

    // Apply relationship discount and faction price modifier
    const relDiscount = relDetails.tradeDiscountPercent / 100;
    const base = item.basePrice;
    const adjusted = Math.max(1, Math.round(base * (1 - relDiscount) * factionDetails.priceModifier));

    const stock = npc.tradeStock[itemId] !== undefined ? npc.tradeStock[itemId] : 1;

    return {
      itemId,
      item,
      basePrice: base,
      finalPrice: adjusted,
      discountPercent: Math.round((1 - adjusted / base) * 100),
      inStock: stock > 0,
      stockCount: stock,
    };
  }

  /**
   * Completes a purchase transaction
   */
  public static buyItem(
    itemId: string,
    npc: SimulatedNPCInstance,
    playerCash: number,
    relationshipLevel = 0,
    factionReputation = 0
  ): {
    success: boolean;
    message: string;
    finalPrice: number;
    item?: FictionalTradeItem;
  } {
    const calc = this.calculatePrice(itemId, npc, relationshipLevel, factionReputation);
    if (!calc) {
      return { success: false, message: 'Eset ei leitud valikust.', finalPrice: 0 };
    }

    if (!calc.inStock || calc.stockCount <= 0) {
      return { success: false, message: 'Ese on laost otsas.', finalPrice: calc.finalPrice };
    }

    if (playerCash < calc.finalPrice) {
      return {
        success: false,
        message: `Sul pole piisavalt raha (${calc.finalPrice} kr, sul on ${playerCash} kr).`,
        finalPrice: calc.finalPrice,
      };
    }

    // Deduct stock from NPC
    npc.tradeStock[itemId] = Math.max(0, calc.stockCount - 1);

    return {
      success: true,
      message: `Ostsid edukalt: ${calc.item.name} (${calc.finalPrice} kr)!`,
      finalPrice: calc.finalPrice,
      item: calc.item,
    };
  }
}
