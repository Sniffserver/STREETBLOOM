import { NPC, GeoLocation, DistrictName } from '../../types/game';
import {
  NPCArchetype,
  getArchetypeDefinition,
  FICTIONAL_TRADE_ITEMS,
} from './NPCArchetypes';
import { SimulatedNPCInstance, NPCSimulation, NPCState } from './NPCSimulation';
import {
  NPCMemoryContainer,
  NPCMemoryManager,
  InteractionTag,
} from './NPCMemory';
import { NPCRelationshipManager, RelationshipLevel } from './NPCRelationship';
import { NPCSchedules } from './NPCSchedules';
import { FACTIONS } from './NPCFaction';

export interface PromotedNPCResult {
  promoted: boolean;
  npc?: NPC;
  reason?: string;
}

export class NPCManager {
  private activeInstances: Map<string, SimulatedNPCInstance> = new Map();
  private memories: Map<string, NPCMemoryContainer> = new Map();
  private maxActiveCap = 5;

  constructor() {
    this.restoreMemoriesFromStorage();
  }

  public getActiveInstances(): SimulatedNPCInstance[] {
    return Array.from(this.activeInstances.values()).filter(
      (inst) => inst.state !== 'DESPAWNED'
    );
  }

  public getInstance(id: string): SimulatedNPCInstance | undefined {
    return this.activeInstances.get(id);
  }

  public getActiveCount(): number {
    return this.getActiveInstances().length;
  }

  public canSpawnMore(maxCap = 4): boolean {
    return this.getActiveCount() < Math.min(this.maxActiveCap, maxCap);
  }

  /**
   * Spawns a procedural NPC instance
   */
  public spawnProceduralNPC(
    archetype: NPCArchetype,
    lat: number,
    lon: number,
    district: DistrictName,
    headingDeg = 0,
    groupCount = 1,
    groupLeaderId?: string
  ): SimulatedNPCInstance {
    const def = getArchetypeDefinition(archetype);
    const id = `enc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const firstName = def.firstNames[Math.floor(Math.random() * def.firstNames.length)];
    const title = def.fictionalTitles[Math.floor(Math.random() * def.fictionalTitles.length)];

    const minHp = def.hpRange[0];
    const maxHp = def.hpRange[1];
    const hp = Math.floor(minHp + Math.random() * (maxHp - minHp + 1));

    const minAtk = def.attackRange[0];
    const maxAtk = def.attackRange[1];
    const atk = Math.floor(minAtk + Math.random() * (maxAtk - minAtk + 1));

    const minDef = def.defenseRange[0];
    const maxDef = def.defenseRange[1];
    const defPower = Math.floor(minDef + Math.random() * (maxDef - minDef + 1));

    // Trade stock
    const stock: Record<string, number> = {};
    if (def.tradeInventoryIds) {
      def.tradeInventoryIds.forEach((itemId) => {
        const itemDef = FICTIONAL_TRADE_ITEMS[itemId];
        if (itemDef) {
          stock[itemId] = itemDef.stock;
        }
      });
    }

    const instance: SimulatedNPCInstance = {
      id,
      archetype,
      name: firstName,
      title: `${title} (${district})`,
      avatar: def.defaultAvatar,
      district,
      state: 'SPAWNED',
      anchorLat: lat,
      anchorLon: lon,
      currentLat: lat,
      currentLon: lon,
      headingDegrees: headingDeg,
      speedMs: archetype === 'RUNNER' ? 2.5 : archetype === 'VENDOR' ? 0.0 : 0.8,
      spawnTimeMs: Date.now(),
      expiresAtMs: Date.now() + 15 * 60 * 1000, // 15 minute lifespan
      isPersistent: false,
      currentHp: hp,
      maxHp: hp,
      attackPower: atk,
      defensePower: defPower,
      tradeStock: stock,
      groupLeaderId,
      groupMemberCount: groupCount,
      distanceToPlayerMeters: 50,
      visibilityTier: 'RADAR_FAINT',
    };

    this.activeInstances.set(id, instance);

    // Initialize memory container
    if (!this.memories.has(id)) {
      this.memories.set(id, {
        npcId: id,
        isPersistent: false,
        totalInteractions: 0,
        accumulatedRelationshipPoints: 0,
        firstMetAt: new Date().toISOString(),
        lastMetAt: new Date().toISOString(),
        records: [],
        discoveredSecrets: [],
        loyaltyScore: 0,
      });
    }

    return instance;
  }

  /**
   * Update active instances simulation on player movement or tick
   */
  public updateAll(playerLoc: GeoLocation): {
    active: SimulatedNPCInstance[];
    despawnedIds: string[];
  } {
    const despawnedIds: string[] = [];
    const now = Date.now();

    for (const [id, inst] of this.activeInstances.entries()) {
      NPCSimulation.updateInstance(inst, playerLoc, now);

      // Despawn checks
      const isFar = inst.distanceToPlayerMeters > 110;
      const isExpired = now > inst.expiresAtMs + 60000;
      const isExplicitlyDespawned = inst.state === 'DESPAWNED';

      if (isFar || isExpired || isExplicitlyDespawned) {
        inst.state = 'DESPAWNED';
        despawnedIds.push(id);
        this.activeInstances.delete(id);
      }
    }

    return {
      active: this.getActiveInstances(),
      despawnedIds,
    };
  }

  /**
   * Set NPC state
   */
  public setNPCState(instanceId: string, state: NPCState): void {
    const inst = this.activeInstances.get(instanceId);
    if (inst) {
      inst.state = state;
    }
  }

  /**
   * Record interaction and evaluate promotion to permanent NPC
   */
  public recordInteraction(
    instanceId: string,
    tag: InteractionTag,
    summary: string,
    importance = 3,
    sentiment: 'positive' | 'neutral' | 'negative' = 'neutral',
    extra?: {
      cashDelta?: number;
      itemExchanged?: string;
      questId?: string;
      relPoints?: number;
    }
  ): PromotedNPCResult {
    const inst = this.activeInstances.get(instanceId);
    let mem = this.memories.get(instanceId);

    if (!mem) {
      mem = {
        npcId: instanceId,
        isPersistent: false,
        totalInteractions: 0,
        accumulatedRelationshipPoints: 0,
        firstMetAt: new Date().toISOString(),
        lastMetAt: new Date().toISOString(),
        records: [],
        discoveredSecrets: [],
        loyaltyScore: 0,
      };
      this.memories.set(instanceId, mem);
    }

    NPCMemoryManager.addInteraction(mem, tag, summary, importance, sentiment, extra);

    const relPoints = extra?.relPoints || (sentiment === 'positive' ? 3 : 1);
    mem.accumulatedRelationshipPoints = (mem.accumulatedRelationshipPoints || 0) + relPoints;

    const promotionCheck = NPCMemoryManager.evaluatePromotion(
      mem,
      relPoints,
      tag,
      sentiment === 'positive'
    );

    if (promotionCheck.shouldPromote && inst) {
      // Create permanent NPC record
      mem.isPersistent = true;
      inst.isPersistent = true;

      const def = getArchetypeDefinition(inst.archetype);
      const schedule = NPCSchedules.generateScheduleForArchetype(
        inst.archetype,
        inst.district,
        inst.currentLat,
        inst.currentLon
      );

      const promotedNPC: NPC = {
        id: `npc-p-${inst.id}`,
        name: inst.name,
        title: inst.title,
        avatar: inst.avatar,
        personalityDesc: `Promoteeritud püsikontakt. ${def.label} piirkonnast ${inst.district}.`,
        personality: def.personalityPresets,
        occupation: def.label,
        district: inst.district,
        latitude: inst.currentLat,
        longitude: inst.currentLon,
        schedule,
        knowledge: [],
        relationshipLevel: 2, // starts as acquaintance
        relationshipPoints: 5,
        memories: mem.records.map((r) => r.summary),
        knownSecrets: [inst.archetype],
        greeting: def.sampleDialogue[0] || 'Tere jälle, rändur!',
        offlineFallbackDialogue: def.sampleDialogue,
        favoriteItems: def.tradeInventoryIds || [],
      };

      inst.persistentNpcId = promotedNPC.id;
      this.saveMemoriesToStorage();

      return {
        promoted: true,
        npc: promotedNPC,
        reason: promotionCheck.reason,
      };
    }

    this.saveMemoriesToStorage();
    return { promoted: false };
  }

  private saveMemoriesToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = Array.from(this.memories.entries());
      localStorage.setItem('streetbloom_npc_memories', JSON.stringify(data));
    } catch {
      // storage quota or fallback
    }
  }

  private restoreMemoriesFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('streetbloom_npc_memories');
      if (raw) {
        const arr = JSON.parse(raw) as [string, NPCMemoryContainer][];
        arr.forEach(([id, cont]) => this.memories.set(id, cont));
      }
    } catch {
      // fallback
    }
  }
}

export const npcManager = new NPCManager();
