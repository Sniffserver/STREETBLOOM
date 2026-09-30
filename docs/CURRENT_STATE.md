# Streetbloom Living City v0.5 - Current State Baseline

## Overview
Streetbloom is a real-world GPS urban exploration game set in Tallinn, Estonia. Players explore physical streets, uncover local neighborhood secrets, interact with fictional living street NPCs, build faction reputation, trade contraband items, manage a Tamagotchi-style companion, and take on street quests.

## Component Health & Verification Status
- **TypeScript Compilation**: Clean (`tsc --noEmit` passes with 0 errors).
- **Vite Build**: Clean (`npm run build` succeeds).
- **HMR & Frame Compatibility**: Enhanced WebSocket error suppression shim in `index.html` prevents dev console spam in iframe preview environments.
- **State Management**: Zustand centralized store (`useGameStore`) with persistent local storage and IndexedDB support.

## Core Features Live in v0.5
1. **GPS & Corridor Exploration**: Real-time GPS location tracking with haversine distance filtering, street subsegment snapping, corridor width checks, and exploration XP tracking.
2. **Procedural World Context**:
   - `WorldClock`: SunCalc astronomical solar phase calculation (`DAWN`, `DAY`, `DUSK`, `NIGHT`, `DEEP_NIGHT`) based on Tallinn coordinates (59.4370, 24.7535).
   - `WeatherContext`: Dynamic conditions (`CLEAR`, `CLOUDY`, `RAIN`, `FOG`, `SNOW`, `SUMMER_EVENING`) modifying NPC archetype spawn weights and visibility.
   - `DistrictIdentity`: Neighborhood affinity weighting across Kesklinn, Kalamaja, Kadriorg, Telliskivi, Old Town, and Pirita.
3. **Living Encounter Subsystem**:
   - `EncounterDirector`: Deterministic seeded RNG encounter evaluator enforcing distance (≥35m) and time (≥50s) cooldowns.
   - `NPCSimulation`: Local state machine (`SPAWNED`, `WANDERING`, `PATROLLING`, `RESTING`, `PERFORMING`, `ENGAGED`, `DESPAWNED`) with archetype-specific walking and pause behavior.
   - `NPCTrade` & `PriceEngine`: Fictional contraband catalog across 5 rarity tiers (`COMMON`, `UNCOMMON`, `RARE`, `ILLEGAL`, `MYSTERIOUS`) with dynamic price multipliers based on relationship, faction rep, time of day, and rarity.
   - `CombatEngine`: Reaction timing zone mini-game (normal hit zone + critical sweet spot) with attack, defend, item, and run options.
   - `NPCMemory`: Long-term persistent interaction records unlocking exclusive dialogue when specific collectibles are held in inventory.
4. **Tamagotchi Companion (Pip)**: Interactive stats (hunger, happiness, energy, bonding), evolution forms, Web Audio synthesized sound cues, and proximity alerts.
