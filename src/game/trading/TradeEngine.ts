import { SimulatedNPCInstance } from '../npc/NPCSimulation';
import { PriceEngine, ShopOffer } from './PriceEngine';
import { FICTIONAL_CONTRABAND_CATALOG, FictionalTradeItem } from './ShopInventory';
import { WorldTimeInfo } from '../world/WorldClock';

export interface TradeExecutionResult {
  success: boolean;
  message: string;
  itemBought?: FictionalTradeItem;
  cashSpent: number;
  remainingCash: number;
  relationshipDelta: number;
}

export class TradeEngine {
  /**
   * Returns list of currently available shop offers for an NPC instance
   */
  public static getNPCOffers(
    npc: SimulatedNPCInstance,
    playerCash: number,
    relationshipPoints: number,
    factionRep: number,
    worldTime?: WorldTimeInfo
  ): ShopOffer[] {
    const offers: ShopOffer[] = [];
    const stockMap = npc.tradeStock || { street_snacks: 3, lucky_coin: 1 };

    for (const [itemId, count] of Object.entries(stockMap)) {
      if (count <= 0) continue;
      const offer = PriceEngine.calculateOffer(
        itemId,
        relationshipPoints,
        factionRep,
        worldTime,
        count
      );
      if (offer) {
        offers.push(offer);
      }
    }

    return offers;
  }

  /**
   * Executes a purchase transaction
   */
  public static buyItem(
    npc: SimulatedNPCInstance,
    itemId: string,
    playerCash: number,
    relationshipPoints: number,
    factionRep: number,
    worldTime?: WorldTimeInfo
  ): TradeExecutionResult {
    const item = FICTIONAL_CONTRABAND_CATALOG[itemId];
    if (!item) {
      return {
        success: false,
        message: 'Tundmatu ese nimekirjas.',
        cashSpent: 0,
        remainingCash: playerCash,
        relationshipDelta: 0,
      };
    }

    const availableStock = npc.tradeStock?.[itemId] ?? 0;
    if (availableStock <= 0) {
      return {
        success: false,
        message: `${item.name} on otsas!`,
        cashSpent: 0,
        remainingCash: playerCash,
        relationshipDelta: 0,
      };
    }

    const offer = PriceEngine.calculateOffer(
      itemId,
      relationshipPoints,
      factionRep,
      worldTime,
      availableStock
    );

    if (!offer) {
      return {
        success: false,
        message: 'Hinda ei õnnestunud arvutada.',
        cashSpent: 0,
        remainingCash: playerCash,
        relationshipDelta: 0,
      };
    }

    if (playerCash < offer.currentPrice) {
      return {
        success: false,
        message: `Sul pole piisavalt raha! Vajad ${offer.currentPrice} kr, sul on ${playerCash} kr.`,
        cashSpent: 0,
        remainingCash: playerCash,
        relationshipDelta: 0,
      };
    }

    // Deduct stock
    if (npc.tradeStock) {
      npc.tradeStock[itemId] -= 1;
    }

    return {
      success: true,
      message: `Ostsid eseme "${item.name}" hinnaga ${offer.currentPrice} kr!`,
      itemBought: item,
      cashSpent: offer.currentPrice,
      remainingCash: playerCash - offer.currentPrice,
      relationshipDelta: 2,
    };
  }
}
