export type DistrictName = 
  | 'Kesklinn' 
  | 'Kalamaja' 
  | 'Kadriorg' 
  | 'Telliskivi' 
  | 'Old Town' 
  | 'Pirita' 
  | string;

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  isSimulated?: boolean;
  isTeleport?: boolean;
}

export interface StreetSubSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  startPoint: [number, number]; // [lon, lat]
  endPoint: [number, number];   // [lon, lat]
  lengthMeters: number;
  traversedDistanceMeters: number;
  explored: boolean;
  exploredAt?: string;
}

export interface StreetSegment {
  id: string;
  osmId?: number | string;
  name: string;
  district: DistrictName;
  coordinates: [number, number][]; // [longitude, latitude] array
  segments: StreetSubSegment[];
  discovered: boolean;
  discoveryPercent: number; // 0 - 100%
  exploredDistanceMeters: number;
  firstDiscoveredAt?: string;
  visitCount: number;
  explorationXP: number;
  lengthMeters: number;
  description?: string;
  historicalNote?: string;
}

export interface Place {
  id: string;
  name: string;
  category: 'landmark' | 'cafe' | 'park' | 'secret' | 'viewpoint' | 'cultural';
  district: DistrictName;
  latitude: number;
  longitude: number;
  discovered: boolean;
  discoveredAt?: string;
  description: string;
  secretClue?: string;
  npcId?: string;
  icon?: string;
}

export type CompanionEvolution = 
  | 'Seedling'
  | 'Scout'    // walker
  | 'Charmer'  // social
  | 'Hoarder'  // collector
  | 'Moon'     // night walker
  | 'Moss'     // nature
  | 'Neon';    // urban explorer

export interface PersonalityTraits {
  curiosity: number;    // 0 - 1
  friendliness: number; // 0 - 1
  bravery: number;      // 0 - 1
  silliness: number;    // 0 - 1
  independence: number; // 0 - 1
  greed: number;        // 0 - 1
}

export interface CompanionMemory {
  id: string;
  type: 'discovery' | 'npc' | 'quest' | 'conversation' | 'place' | 'player_behavior';
  summary: string;
  importance: number;
  createdAt: string;
}

export interface WalkSession {
  id: string;
  startTime: string;
  endTime?: string;
  distanceMeters: number;
  streetsProgressed: string[];
  placesVisited: string[];
  npcInteractions: number;
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
}

export interface BehavioralProfile {
  totalSessions: number;
  averageWalkLengthMeters: number;
  preferredTimeOfDay: 'morning' | 'day' | 'evening' | 'night';
  explorationStyle: 'completionist' | 'wanderer' | 'social' | 'collector' | 'speedwalker';
  favoriteDistricts: { district: string; visitCount: number }[];
  favoritePlaceTypes: string[];
  npcInteractionRate: number;
  discoveryRate: number;
  recentSessions: WalkSession[];
}

export interface Companion {
  id: string;
  name: string;
  species: string;
  evolutionStage: number;
  evolutionForm: CompanionEvolution;
  hunger: number;     // 0 - 100 (100 = full)
  happiness: number;  // 0 - 100
  energy: number;     // 0 - 100
  curiosity: number;  // 0 - 100
  affection: number;  // 0 - 100
  health: number;     // 0 - 100
  cleanliness: number;// 0 - 100
  personality: PersonalityTraits;
  behavioralProfile: BehavioralProfile;
  memories: CompanionMemory[];
  discoveredPlaces: string[];
  favoriteDistricts: string[];
  favoriteNPCs: string[];
  lastInteractionAt: string;
  lastFedAt?: string;
  currentThought?: string;
}

export interface NPCScheduleSlot {
  startHour: number; // 0-23
  endHour: number;   // 0-23
  locationName: string;
  placeType: string;
  latitude: number;
  longitude: number;
  activityDescription: string;
}

export interface KnowledgeFact {
  id: string;
  subject: string;
  relation: 'knows_about' | 'knows_person' | 'dislikes' | 'rumor_about' | 'secret_of';
  target: string;
  detail: string;
  unlocked: boolean;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  avatar: string;
  personalityDesc: string;
  personality: {
    friendly: number;
    sarcastic: number;
    curious: number;
    mysterious: number;
  };
  occupation: string;
  district: DistrictName;
  latitude: number;
  longitude: number;
  schedule: NPCScheduleSlot[];
  knowledge: KnowledgeFact[];
  relationshipLevel: number; // 0: stranger, 1: recognized, 2: acquaintance, 3: friendly, 4: trusted, 5: close friend, 6: special
  relationshipPoints: number; // XP to next relationship level
  memories: string[];
  knownSecrets: string[];
  greeting: string;
  offlineFallbackDialogue: string[];
  favoriteItems: string[];
}

export type QuestType = 
  | 'DISCOVERY'
  | 'DELIVERY'
  | 'SEARCH'
  | 'SOCIAL'
  | 'COLLECTION'
  | 'TIME'
  | 'EXPLORATION'
  | 'MYSTERY'
  | 'COMPANION';

export interface QuestReward {
  xp: number;
  relationshipNPCId?: string;
  relationshipPoints?: number;
  itemId?: string;
  itemCount?: number;
  companionHappiness?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  giverNPCId?: string;
  targetStreetId?: string;
  targetPlaceId?: string;
  targetDistanceMeters?: number;
  targetCount?: number;
  currentCount?: number;
  status: 'available' | 'active' | 'completed';
  rewards: QuestReward;
  district?: DistrictName;
  hint?: string;
  unlockedAt?: string;
  completedAt?: string;
}

export type ItemCategory = 
  | 'feather'
  | 'stone'
  | 'plant'
  | 'postcard'
  | 'coin'
  | 'artifact'
  | 'snack'
  | 'mystery';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  foundInDistrict?: DistrictName;
  feedNutrition?: number; // if snack
  isUsable: boolean;
}

export interface InventoryItem {
  itemId: string;
  count: number;
  firstAcquiredAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'exploration' | 'companion' | 'social' | 'collection';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface PlayerSkills {
  streetSmart: number; // Tänavavaist: 1 - 10
  persuasion: number;  // Veenvus: 1 - 10
  tech: number;        // Tehnika: 1 - 10
  stealth: number;     // Varitsemine: 1 - 10
}

export type AccuracyTier = 'HIGH' | 'MEDIUM' | 'POOR';

export type ActionCategory = 'small_job' | 'trade' | 'risk_gig' | 'story' | 'network_project';

export interface InteractionChoice {
  id: string;
  title: string;
  description: string;
  category?: ActionCategory;
  turnCost: number;
  cashCost?: number; // C in E[Δraha] = p*R - C - (1-p)*L
  cashReward?: number; // R in formula
  failureLoss?: number; // L in formula (additional cash penalty on failure)
  successProbability?: number; // p in formula (0.0 - 1.0)
  reputationChange?: number;
  dailyLimit?: number; // G in formula
  timeMinutes?: number; // T in formula
  requiredSkill?: {
    skill: keyof PlayerSkills;
    level: number;
  };
  riskPercent?: number; // 0-100% chance of complication (alias for (1-p)*100)
  riskDescription?: string;
  outcomeText: string;
}

export interface InteractionCommand {
  interactionId: string;   // korduskatsete idempotentsus
  spawnId: string;
  actionId: string;
  clientTime: string;
  locationEvidence?: {
    areaId: string;
    accuracyMeters: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface NPCSpawnEvent {
  spawnId: string;
  npcId: string;
  district: DistrictName;
  latitude: number;
  longitude: number;
  timeSlot: string;
  expiresAt: number;
  interactionRadius: number;
  rewardCap: number;
  timesInteracted: number;
  storyState: string;
  choices?: InteractionChoice[];
}

export interface InteractionExecutionResult {
  success: boolean;
  message: string;
  cashDelta: number;
  reputationDelta: number;
  turnCost: number;
  skillXpGained?: { skill: keyof PlayerSkills; xp: number };
  rewardItem?: string;
  questProgressed?: string;
  consequence?: string;
}

export type CashLedgerCategory = 
  | 'job_income' 
  | 'trade_income' 
  | 'trade_cost' 
  | 'gig_income' 
  | 'gig_cost' 
  | 'gig_loss' 
  | 'story_reward' 
  | 'sink_maintenance' 
  | 'sink_project' 
  | 'sink_intel'
  | 'initial_grant';

export interface CashLedgerEntry {
  id: string;
  timestamp: string;
  amount: number; // positive = inflow, negative = outflow/sink
  balanceAfter: number;
  category: CashLedgerCategory;
  description: string;
  interactionId?: string;
}

export type NetworkRole = 'owner' | 'manager' | 'member';

export interface NetworkMember {
  id: string;
  name: string;
  role: NetworkRole;
  joinedAt: string;
  contributedCash: number;
  contributedMaterials: number;
  completedQuests: number;
  lastActiveAt: string;
}

export interface DistrictProject {
  id: string;
  district: DistrictName;
  title: string;
  description: string;
  targetCash: number;
  currentCash: number;
  targetMaterials: number;
  currentMaterials: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  perkDescription: string;
  contributorCount: number;
}

export interface PlayerNetwork {
  id: string;
  name: string;
  district: DistrictName;
  createdAt: string;
  members: NetworkMember[];
  projects: DistrictProject[];
  activityLog: {
    id: string;
    timestamp: string;
    memberId: string;
    memberName: string;
    action: string;
    amount?: number;
  }[];
  treasury: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  explorationXP: number;
  xpToNextLevel: number;
  // Core Varjulinn Resources
  cash: number;
  reputation: number;
  actionTurns: number;
  maxActionTurns: number;
  skills: PlayerSkills;
  estimatedSteps: number;
  todayStepsTurnsGranted: number;
  dailyRiskGigsPerformedToday?: number;
  lastDailyResetDate?: string;
  cashLedger?: CashLedgerEntry[];
  activeMainQuestId?: string;
  // Physical Exploration Stats
  totalDistanceMeters: number;
  streetsDiscovered: number;
  districtsDiscovered: number;
  landmarksDiscovered: number;
  explorationStreak: number;
  lastWalkDate: string;
  companionId: string;
  discoveredStreetIds: string[];
  discoveredPlaceIds: string[];
  knownNPCIds: string[];
  createdAt: string;
  lastActiveAt: string;
  demoCash?: number;
  demoReputation?: number;
}

export interface GameEvent {
  id: string; // UUID v4
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
  synced: boolean;
}

export interface NPCResponse {
  dialogue: string;
  moodChange: number;
  relationshipChange: number;
  memoryToStore?: string;
  extractedFacts?: string[];
  action?: 'none' | 'startQuest' | 'completeQuest' | 'giveItem' | 'revealLocation' | 'triggerEvent';
  actionPayload?: Record<string, unknown>;
}

export interface ProceduralEncounter {
  id: string;
  title: string;
  description: string;
  type: 'cat' | 'cyclist' | 'musician' | 'botanist' | 'mystery' | 'sparkle';
  latitude: number;
  longitude: number;
  expiresAt: number;
  rewardXP: number;
  rewardItem?: string;
  interacted: boolean;
}

export interface ValidatedDiscoveryResult {
  valid: boolean;
  streetId: string;
  subsegmentIndex?: number;
  newDiscoveryPercent: number;
  isFullyDiscovered: boolean;
  xpAwarded: number;
  message: string;
}
