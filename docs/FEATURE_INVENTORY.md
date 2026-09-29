# STREETBLOOM Feature Inventory & Audit

**Audit Date**: 2026-09-29  
**Baseline Commit**: `9453d4d`  
**Environment**: Node.js v22.14.0, Vite 8.3.0, Express 4.21.2, TypeScript 7.0.2  

---

## Screen & Feature Matrix

| Screen / Feature | User Input & Triggers | State Source | Working Status | Known Defects & Architectural Observations |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (`DashboardScreen.tsx`) | - Quick CTA: "Ava Kaart" (`explore`)<br>- Quick CTA: "Ava Radar" (`radar`)<br>- Quest CTA: "Kõnni sihtkohta"<br>- Companion card: tap opens `companion`<br>- Economic sinks: "Anneta 15 kr" (district project), "Hoolda varustust" (15 kr)<br>- Nearest NPC: "Räägi" opens `NPCChatModal` | `useGameStore`<br>- `profile` (cash, reputation, actionTurns)<br>- `companion`<br>- `quests`<br>- `npcs`<br>- `districtProjects`<br>- `playerNetwork`<br>- `activeSpawn` | **Working** | Previously `activeSpawn` was retrieved but not prominently shown as the primary next encounter. The economic sinks and turn meters are functional and backed by local storage and game engine. |
| **Radar** (`RadarListScreen.tsx`) | - Tabs filter: All, NPCs, Places, Quests<br>- Item tap: opens NPC chat or navigates<br>- Safety issue reporting button | `useGameStore`<br>- `currentLocation`<br>- `npcs`<br>- `places`<br>- `quests`<br>- `accuracyTier` | **Working** | Accessible fallback for map. Accurately calculates Haversine distance from current position. Shows accuracy status and degrades gracefully when GPS is poor or denied. |
| **Map & Compass** (`ExplorationMap.tsx`, `CompassHeader.tsx`) | - MapLibre GL canvas (pan, pinch, zoom)<br>- Street tap: opens `StreetDetailsModal`<br>- NPC marker tap: opens `NPCChatModal`<br>- Place marker tap: inspect place<br>- Follow player toggle<br>- Simulated walk toggle | `useGameStore`<br>- `streets`<br>- `places`<br>- `npcs`<br>- `currentLocation`<br>- `settings.demoModeActive` | **Working** | Uses MapLibre GL with Carto Dark tiles and offline fallback. Dynamic multi-layer GeoJSON tracks geometric traversal. Uses `GPSSmoother` to filter noise. |
| **NPC Conversation & Encounters** (`NPCChatModal.tsx`, `NPCListScreen.tsx`) | - Action Choices: Small Job (reliable), Trade (capital), Risky Gig (high variance), Story Quest<br>- Freeform text input via Gemini proxy (`/api/npc/chat`)<br>- Fallback offline canned dialogue | `useGameStore`<br>- `activeSpawn`<br>- `gameEngine.executeInteraction`<br>- `server.ts` (`/api/npc/chat`)<br>- `localStorage` (`sb_npcs_v1`) | **Working** | Encounters run through `executeInteraction` with idempotency key (`interactionId`). Offline fallback handles quota/network failures without UI freeze. |
| **Tamagotchi Companion** (`CompanionScreen.tsx`) | - Pip actions: Feed (uses inventory snack or breadcrumbs), Pet, Talk, Play, Rest<br>- Evolution preview | `useGameStore`<br>- `companion`<br>- `inventory`<br>- `gameEngine` | **Working** | Full emotional stats (hunger, happiness, energy, affection, curiosity). Behavioral profile grounds Pip's speech in player's actual walking habits. |
| **Quests** (`QuestsScreen.tsx`) | - View active and available quests<br>- Claim rewards upon objective completion | `useGameStore`<br>- `quests`<br>- `gameEngine.completeQuest` | **Working** | Backed by `SEED_QUESTS` and local store. Objective tracking ties into street traversal, NPC interactions, and place visits. |
| **Collection & Inventory** (`CollectionScreen.tsx`) | - Category filters (Stones, Plants, Feathers, Postcards, Artifacts, Snacks)<br>- Inspect item details and lore | `useGameStore`<br>- `inventory`<br>- `SEED_ITEMS` | **Working** | Usable snacks can be fed to Pip. Discovery drops trigger during street exploration. |
| **Profile & Skills** (`ProfileScreen.tsx`) | - View player level, XP, cash, reputation, action turns<br>- 4 Skills: Street Smart, Persuasion, Tech, Stealth<br>- Exploration streak and step tally<br>- Cash transaction ledger view | `useGameStore`<br>- `profile`<br>- `achievements`<br>- `cashLedger` | **Working** | Audit trail of all economic inflows, costs, penalties, and sink contributions. |
| **Settings & Safety** (`SettingsScreen.tsx`, `DebugPanel.tsx`) | - Demo mode toggle (simulated walk)<br>- Language selection (ET/EN)<br>- GPS accuracy sensitivity<br>- Privacy location masking toggle<br>- Export/Import save state<br>- Reset data | `useGameStore`<br>- `settings`<br>- `localStore` | **Working** | Includes developer console (`?debug=1`), location masking for privacy, and emergency safety reporting. |
| **Server & Sync** (`server.ts`) | - `/api/session`<br>- `/api/discovery/validate`<br>- `/api/quest/validate-complete`<br>- `/api/npc/chat`<br>- `/api/sync` | `server.ts` Express endpoints, Vite middleware | **Working** | Implements anti-teleport speed limits (<15 m/s), server-side memory extraction, and bounded event deduplication (`processedEventIds`). |

---

## State Source Summary
1. **Authoritative Engine (`gameEngine.ts`)**: Single source of truth for location updates, traversal measurement, turn deduction, economic formula evaluation ($E[\Delta \text{raha}] = p \cdot R - C - (1-p) \cdot L$), idempotency tracking, and level ups.
2. **Persistent Store (`services/storage/db.ts`)**: Structured namespaced LocalStorage (`sb_profile_v1`, `sb_companion_v1`, `sb_streets_progress_v1`, etc.).
3. **Backend Proxy (`server.ts`)**: Server-authoritative validation for movement speeds, discovery verification, and Gemini-assisted NPC dialogue with graceful deterministic fallbacks.
