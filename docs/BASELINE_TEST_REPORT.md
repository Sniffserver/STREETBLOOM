# STREETBLOOM Baseline Test Report

**Date**: 2026-09-29  
**Commit SHA**: `9453d4d`  
**Execution Runtime**: Linux 6.6.137+ x86_64, Node.js v22.14.0, Vite 8.3.0  
**Test Harness**: Native `node:test` via `tsx` runner  
**Simulated Devices**:  
- Mobile Web (PWA): Chrome Mobile / Safari iOS viewport (390 x 844)
- Desktop Dev Console: Chromium Headless (1280 x 800)

---

## Command Verification Results

### 1. Game Engine & Geometry Test Suite
- **Command**: `npx tsx src/tests/gameEngine.test.ts`
- **Exit Code**: `0`
- **Output Summary**:
  ```
  TAP version 13
  ok 1 - haversineDistanceMeters calculates accurate distance
  ok 2 - pointToPolylineDistanceMeters detects point on or near street
  ok 3 - buildStreetSubSegments and checkPlayerTraversedSegment
  ok 4 - validateMovement detects impossible teleportation and speeds
  ok 5 - maskLocationForPrivacy rounds coordinates when active
  ok 6 - Companion care interactions and behavioral profile grounding
  ok 7 - Quest progress tracking and XP calculation
  ok 8 - computeMovementAlongSegment measures physical traversal without mock radius triggers
  ok 9 - GPSSmoother filters stationary noise jitter and smooths pedestrian motion
  ok 10 - Geometry Suite Case 1: Player outside corridor produces 0 traversal
  ok 11 - Geometry Suite Case 2: Player inside corridor but stationary produces 0 traversal
  ok 12 - Geometry Suite Case 3: Player walks 10m along segment produces ~10m traversal
  ok 13 - Geometry Suite Case 4: Player moves perpendicular across street produces little/no longitudinal traversal
  ok 14 - Geometry Suite Case 5: Player enters middle of segment records only actual local traversal
  ok 15 - Geometry Suite Case 6: Player jumps 500m due to GPS glitch is rejected
  ok 16 - Geometry Suite Case 7: Player walks backwards does not create fake forward accumulation
  ok 17 - Geometry Suite Case 8: GPS jitter while stationary does not accumulate traversal
  ok 18 - Geometry Suite Case 9: Player crosses between two neighboring subsegments
  ok 19 - Section 28 Regression Test: Proximity does NOT discover street; actual physical walking DOES
  1..19
  # tests 19
  # pass 19
  # fail 0
  ```

### 2. Economic Model & Simulation Test Suite
- **Command**: `npx tsx src/tests/economySimulation.test.ts`
- **Exit Code**: `0`
- **Output Summary**:
  ```
  TAP version 13
  ok 1 - Economy Model: E[Δraha] = p*R - C - (1-p)*L verification
  ok 2 - Economy Model: Idempotency prevents double reward on duplicate interactionId
  ok 3 - Economy Model: Risky gig daily limit G=3 is enforced
  ok 4 - Economy Model: Cash balance never drops below zero on failure penalty
  ok 5 - Economy Sinks: District project contribution & gear maintenance
  ok 6 - Economy Simulation: 3 Player Profiles (Beginner, Regular, Intensive)
  1..6
  # tests 6
  # pass 6
  # fail 0
  ```

### 3. Vertical Gameplay Slice & Branching Suite
- **Command**: `npx tsx src/tests/verticalSlice.test.ts`
- **Exit Code**: `0`
- **Output Summary**:
  ```
  TAP version 13
  ok 1 - Vertical Slice Loop: Full 5-minute journey with 3 actions and idempotency
  ok 2 - Vertical Slice Branching: Prior choices alter NPC memory and unlock content
  ok 3 - GPS Availability & Radar Fallback Path
  1..3
  # tests 3
  # pass 3
  # fail 0
  ```

### 4. Type Checking & Linter
- **Command**: `npm run lint` (`tsc --noEmit`)
- **Exit Code**: `0`
- **Diagnostics**: 0 errors, 0 warnings.

### 5. Production Build Compilation
- **Command**: `npm run build` (`vite build`)
- **Exit Code**: `0`
- **Diagnostics**:
  - `dist/index.html` (2.8 kB)
  - `dist/assets/*.css` (32.4 kB)
  - `dist/assets/*.js` (624 kB)
  - Full bundle generated cleanly.

---

## Baseline Verification Summary
All 28 automated tests across all 3 test suites pass without failure or flake.
Movement validation, geometry corridor traversal, GPS smoothing, economic formula enforcement, daily limits, idempotency guards, branching narrative memory, and UI compilation have been verified against commit `9453d4d`.
