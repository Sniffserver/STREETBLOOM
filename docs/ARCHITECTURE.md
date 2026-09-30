# Streetbloom Modular Architecture (Living City v0.5)

## System Architecture Diagram

```
+-----------------------------------------------------------------+
|                       Browser GPS Hardware                      |
+-----------------------------------------------------------------+
                                | (watchPosition / raw coordinates)
                                v
+-----------------------------------------------------------------+
|                       src/services/gps/                         |
|  LocationService -> GPSSmoother -> MovementAnalyzer             |
+-----------------------------------------------------------------+
                                | (MeaningfulMovementEvent)
                                v
+-----------------------------------------------------------------+
|                       src/game/world/                           |
|  WorldContext (WorldClock, DistrictResolver, PlaceResolver,     |
|                WeatherContext, EncounterDensity)                |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                    src/game/encounters/                         |
|  EncounterDirector (Seeded RNG, Cooldowns, Weights)             |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                       src/game/npc/                             |
|  NPCManager & NPCSimulation (Local State Machine & Movement)    |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                       src/store/useGameStore                    |
|  Central Game State, React Components & UI Modals               |
+-----------------------------------------------------------------+
```

## Modular Layer Rules
1. **Separation of Physics and Presentation**: MapLibre rendering (`ExplorationMap.tsx`) only reads position and NPC coordinates to draw markers. It does NOT contain spawn probability calculations, combat resolution, or trade pricing math.
2. **Deterministic Game Mechanics**: Combat math, item prices, spawn conditions, and reputation point calculations execute deterministically in pure TypeScript modules (`PriceEngine`, `CombatResolver`, `EncounterDirector`).
3. **AI Boundary**: Optional Gemini AI service handles natural language phrasing and personality flourishes. Game mechanics, inventory state, HP, cash, and trade transactions are fully controlled by deterministic game code.
