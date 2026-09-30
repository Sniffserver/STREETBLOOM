# Streetbloom GPS & Spatial Invariants

## Core Spatial Invariants

### 1. High-Frequency Separation & Event Smoothing
- Raw browser `navigator.geolocation.watchPosition` updates can occur at high frequencies (1–10 Hz) with GPS noise and jitter.
- High-frequency raw location updates MUST NOT directly trigger full Zustand store re-renders or database writes.
- Raw updates pass through `GPSSmoother` and `MovementAnalyzer` to produce a `MeaningfulMovementEvent`.

### 2. Meaningful Movement Criteria
An incoming raw GPS position is converted into a `MeaningfulMovementEvent` if and only if:
- **Accuracy Threshold**: `accuracy <= 40 meters` (discards inaccurate cell tower triangulations).
- **Displacement Threshold**: `distance >= 5 meters` from last accepted position (suppresses stationary GPS drift/jitter).
- **Max Speed / Teleport Guard**: Speed calculated must be `<= 12 m/s` (~43 km/h). Teleport jumps or high-speed vehicular transit pause street traversal recording unless marked debug teleport.

### 3. Street Corridor Traversal
- Subsegments are projected onto OpenStreetMap geometry polylines.
- Player is considered "inside corridor" if perpendicular distance to line segment is `< 25 meters`.
- Subsegment traversal percentage updates incrementally; street completion triggers XP awards and district progress.

### 4. Encounter Cooldown & Spawning Rules
- **Distance Gate**: Player must walk at least `35 meters` since last encounter evaluation.
- **Time Gate**: At least `50 seconds` must elapse between encounters.
- **Spawn Radius Arc**: NPCs spawn ahead of player movement heading at `25–70 meters` distance, constrained to walkable land areas.
- **Active Cap**: Maximum `4–5` active procedural NPCs on map at any time.
- **Despawn Radius**: NPCs auto-despawn when player distance exceeds `110 meters` or lifespan (15 minutes) expires.
