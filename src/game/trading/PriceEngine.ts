import { FictionalTradeItem, FICTIONAL_CONTRABAND_CATALOG } from './ShopInventory';
import { WorldTimeInfo } from '../world/WorldClock';

export interface ShopOffer {
  itemId: string;
  item: FictionalTradeItem;
  basePrice: number;
  currentPrice: number;
  stock: number;
  priceModifiers: {
    rarity: number;       // Rarity multiplier (1.0 to 1.5)
    stock: number;        // Stock scarcity/surplus factor (0.9 to 1.25)
    reputation: number;   // Faction rep factor (0.8 to 1.5)
    relationship: number; // Individual NPC relationship factor (0.75 to 1.1)
    timeOfDay: number;    // Solar time modifier (1.0 to 1.2)
  };
}

export class PriceEngine {
  /**
   * Calculates dynamic item prices based on:
   * Price = base_price × rarity × stock × reputation × relationship × time_modifier
   */
  public static calculateOffer(
    itemId: string,
    relationshipPoints: number, // -100 to +100 or 0 to 100
    factionReputation: number,  // -100 to +100
    worldTime?: WorldTimeInfo,
    stock: number = 1
  ): ShopOffer | null {
    const item = FICTIONAL_CONTRABAND_CATALOG[itemId];
    if (!item) return null;

    // 1. Base price
    const basePrice = item.basePrice;

    // 2. Rarity factor
    const rarityMultipliers: Record<string, number> = {
      COMMON: 1.0,
      UNCOMMON: 1.1,
      RARE: 1.25,
      ILLEGAL: 1.35,
      MYSTERIOUS: 1.5,
    };
    const rarityFactor = rarityMultipliers[item.rarity] || 1.0;

    // 3. Stock factor (Scarcity increases price, surplus lowers price)
    let stockFactor = 1.0;
    if (stock <= 1) stockFactor = 1.2;      // Low stock surge (+20%)
    else if (stock === 2) stockFactor = 1.1; // Slight scarcity (+10%)
    else if (stock >= 5) stockFactor = 0.9;  // Surplus discount (-10%)

    // 4. Reputation factor (-100 to +100 standing)
    // Good reputation -> discount (e.g. +50 rep -> 0.85); Bad reputation -> mark-up (e.g. -50 rep -> 1.3)
    let reputationFactor = 1.0;
    if (factionReputation > 0) {
      reputationFactor = Math.max(0.75, 1 - (factionReputation / 100) * 0.3);
    } else if (factionReputation < 0) {
      reputationFactor = Math.min(1.5, 1 + (Math.abs(factionReputation) / 100) * 0.5);
    }

    // 5. Relationship factor (Individual relationship)
    // Good relationship -> 0.8; Bad relationship -> 1.25
    let relationshipFactor = 1.0;
    if (relationshipPoints > 0) {
      relationshipFactor = Math.max(0.75, 1 - (relationshipPoints / 100) * 0.25);
    } else if (relationshipPoints < 0) {
      relationshipFactor = Math.min(1.3, 1 + (Math.abs(relationshipPoints) / 100) * 0.3);
    }

    // 6. Time modifier (Night / Deep night contraband surge)
    let timeModifier = 1.0;
    if (worldTime?.phase === 'NIGHT' || worldTime?.phase === 'DEEP_NIGHT') {
      timeModifier = 1.15; // +15% night market surge
    } else if (worldTime?.phase === 'DAWN') {
      timeModifier = 0.95; // Early morning discount
    }

    // Multiplicative calculation
    const rawPrice = basePrice * rarityFactor * stockFactor * reputationFactor * relationshipFactor * timeModifier;
    const currentPrice = Math.max(2, Math.round(rawPrice));

    return {
      itemId,
      item,
      basePrice,
      currentPrice,
      stock,
      priceModifiers: {
        rarity: rarityFactor,
        stock: stockFactor,
        reputation: reputationFactor,
        relationship: relationshipFactor,
        timeOfDay: timeModifier,
      },
    };
  }
}
