# STREETBLOOM: Five-Minute Core Gameplay Loop

## Player Journey Overview

The core loop is designed to engage a new player in under 5 minutes whether they are walking outdoors with high-accuracy GPS or playing indoors / with location permissions denied.

```
+-------------------------------------------------------------+
| 1. DASHBOARD                                                |
| - Check resources: Raha (Cash), Maine (Reputation), Käigud  |
| - Inspect companion Pip's mood & thought                    |
| - View primary objective & active district encounter        |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
| 2A. MAP VIEW          |             | 2B. RADAR VIEW        |
| - Visual street glow  |             | - Accessible text list|
| - Geometric discovery |             | - Sorted by distance  |
| - Tap NPC marker      |             | - Works with poor GPS |
+-----------+-----------+             +-----------+-----------+
            |                                     |
            +------------------+------------------+
                               |
                               v
+-------------------------------------------------------------+
| 3. NPC ENCOUNTER & DIALOGUE                                 |
| - In-character dialogue (Marta, Otto, or Sirli)             |
| - Clear display of costs, success chances, and consequences |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 4. PLAYER DECISION: 3 ACTIONS (Crime.ee Inspired Balance)   |
| A) Safe Job:        Cost: 0 kr  | p=1.00 | Net: +24 kr      |
| B) Trade Exchange:  Cost: 12 kr | p=1.00 | Net: +26 kr      |
| C) Risky Gig:       Cost: 5 kr  | p=0.60 | Net E: +28 kr    |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 5. AUTHORITATIVE OUTCOME & IDEMPOTENCY                      |
| - Engine validates turns, skill level, daily limits (G=3)   |
| - Computes single deterministic / rolled outcome            |
| - Records transaction in Cash Ledger with unique ID         |
| - Re-trying same interaction ID cannot pay twice            |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 6. UPDATED DASHBOARD & PROGRESSION                          |
| - Cash and Reputation updated                               |
| - Economic sink options: contribute to District Project     |
|   or maintain walking gear for Pip & +1 turn recovery       |
| - Walking 200 estimated steps recovers +1 action turn       |
+-------------------------------------------------------------+
```

---

## Detailed Step-by-Step Breakdown

### Step 1: Dashboard Ingress (0:00 - 0:45)
- **Goal**: Player immediately understands status, location, and what to do next.
- **Visuals**: Clean dark graphite UI (`#12151a`), warm amber highlights.
- **Status Indicators**:
  - Current district (e.g. *Kesklinn* / *Kalamaja*).
  - GPS Quality Badge: *Täpne (≤35m)*, *Mõõdukas*, or *Ebakindel*.
  - 3 Core Resource Meters: **Raha** (kr), **Maine** (Reputation), **Käigud** (Action Turns, e.g. 5/10).
  - Primary goal widget: "Aktiivne eesmärk" + "Kõnni sihtkohta".

### Step 2: Discovery via Map or Radar (0:45 - 2:00)
- **High GPS Accuracy**: Player walks physically. Traversal along street polylines illuminates the dark street with a golden/cyan glow and triggers discovery XP.
- **GPS Denied / Low Accuracy**: Radar screen lists encounters sorted strictly by distance with clear "Suhtlusalas" (in interaction range) status. Player is never blocked from proceeding.

### Step 3: NPC Encounter (2:00 - 3:00)
- Player selects NPC (e.g., Marta from Kohvik August, Otto the clockmaker, or Sirli the courier).
- Dialogue introduces local street lore and current opportunities.
- Both Map and Radar reference identical spawn IDs derived deterministically from:
  $$\text{SpawnID} = \text{hash}(\text{WorldVersion}, \text{District}, \text{TimeSlot}, \text{NPCArchetype})$$

### Step 4: Action Selection (3:00 - 4:00)
Every action explicitly communicates:
- **Turn Cost**: Typically 1 to 2 turns.
- **Financial Cost ($C$)**: Upfront capital required.
- **Success Probability ($p$)** and **Reward ($R$)**.
- **Failure Penalty ($L$)** and **Narrative Risk**.

### Step 5: Resolution & Idempotency (4:00 - 4:30)
- When the player selects an action, an `InteractionCommand` is dispatched with an `interactionId`.
- **Success Case**: Reward is added to cash balance, logged in the Cash Ledger, companion happiness increases.
- **Failure Case**: Upfront cost lost, failure penalty deducted (balance bounded at $\ge 0$), narrative consequence displayed.
- **Replay Protection**: Duplicate commands with identical `interactionId` are safely rejected with zero state change.

### Step 6: Progression & Re-engagement (4:30 - 5:00)
- Player returns to Dashboard.
- Can invest newly earned Raha into the **Linnaosa ühisprojekt** (District Project) or **Hoolda varustust** (Gear Maintenance).
- Explains why the player will take another walk: walking 200 physical steps earns +1 action turn to take on more opportunities.
