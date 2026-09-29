import { test } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../game/engine/gameEngine';
import { generateInteractionChoices } from '../services/npc/spawnService';
import { InteractionChoice } from '../types/game';

test('Economy Model: E[Δraha] = p*R - C - (1-p)*L verification', () => {
  const choices = generateInteractionChoices('npc-marta', 'spn-marta-test');

  const smallJob = choices.find((c) => c.category === 'small_job')!;
  const trade = choices.find((c) => c.category === 'trade')!;
  const riskyGig = choices.find((c) => c.category === 'risk_gig')!;

  assert.ok(smallJob, 'Small job must be defined');
  assert.ok(trade, 'Trade must be defined');
  assert.ok(riskyGig, 'Risky gig must be defined');

  // 1. Small job: p=1.00, R=24, C=0, L=0 => E = 24
  const expectedSmallJob =
    (smallJob.successProbability ?? 1.0) * (smallJob.cashReward ?? 0) -
    (smallJob.cashCost ?? 0) -
    (1 - (smallJob.successProbability ?? 1.0)) * (smallJob.failureLoss ?? 0);
  assert.strictEqual(expectedSmallJob, 24, 'Small job expected return must be 24 kr');

  // 2. Trade: p=1.00, R=38, C=12, L=0 => E = 26
  const expectedTrade =
    (trade.successProbability ?? 1.0) * (trade.cashReward ?? 0) -
    (trade.cashCost ?? 0) -
    (1 - (trade.successProbability ?? 1.0)) * (trade.failureLoss ?? 0);
  assert.strictEqual(expectedTrade, 26, 'Trade expected return must be 26 kr');

  // 3. Risky gig: p=0.60, R=65, C=5, L=15 => E = 0.60*65 - 5 - 0.40*15 = 39 - 5 - 6 = 28
  const pGig = riskyGig.successProbability ?? 0.6;
  const RGig = riskyGig.cashReward ?? 65;
  const CGig = riskyGig.cashCost ?? 5;
  const LGig = riskyGig.failureLoss ?? 15;
  const expectedGig = Math.round(pGig * RGig - CGig - (1 - pGig) * LGig);
  assert.strictEqual(expectedGig, 28, 'Risky gig expected return must be 28 kr');
});

test('Economy Model: Idempotency prevents double reward on duplicate interactionId', async () => {
  const engine = new GameEngine();
  const profile = engine.getProfile();
  const initialCash = profile.cash;

  const interactionId = `idem-test-${Date.now()}`;
  const command = {
    interactionId,
    spawnId: 'spn-marta',
    actionId: 'spn-marta-job',
    clientTime: new Date().toISOString(),
  };

  // Mock active spawn
  const choices = generateInteractionChoices('npc-marta', 'spn-marta');
  (engine as any).activeSpawn = {
    spawnId: 'spn-marta',
    npcId: 'npc-marta',
    district: 'Kalamaja',
    latitude: 59.44,
    longitude: 24.74,
    timeSlot: '2026-09-29-18',
    expiresAt: Date.now() + 3600000,
    interactionRadius: 60,
    rewardCap: 5,
    timesInteracted: 0,
    storyState: 'initial',
    choices,
  };
  (engine as any).profile.actionTurns = 5;

  const res1 = await engine.executeInteraction(command);
  assert.strictEqual(res1.success, true, 'First interaction execution must succeed');
  assert.strictEqual(res1.cashDelta, 24, 'Small job awards +24 kr');
  assert.strictEqual(engine.getProfile().cash, initialCash + 24);

  // Duplicate submission with the same interactionId
  const res2 = await engine.executeInteraction(command);
  assert.strictEqual(res2.success, false, 'Duplicate execution must be rejected as idempotent replay');
  assert.strictEqual(res2.cashDelta, 0, 'Duplicate submission must award 0 kr');
  assert.strictEqual(engine.getProfile().cash, initialCash + 24, 'Balance must remain unchanged');
});

test('Economy Model: Risky gig daily limit G=3 is enforced', async () => {
  const engine = new GameEngine();
  (engine as any).profile.actionTurns = 20;
  (engine as any).profile.cash = 200;
  (engine as any).profile.dailyRiskGigsPerformedToday = 0;

  const choices = generateInteractionChoices('npc-marta', 'spn-marta-gig');
  (engine as any).activeSpawn = {
    spawnId: 'spn-marta-gig',
    npcId: 'npc-marta',
    district: 'Kalamaja',
    latitude: 59.44,
    longitude: 24.74,
    timeSlot: '2026-09-29-18',
    expiresAt: Date.now() + 3600000,
    interactionRadius: 60,
    rewardCap: 10,
    timesInteracted: 0,
    storyState: 'initial',
    choices,
  };

  // Execute 3 gigs
  for (let i = 1; i <= 3; i++) {
    const cmd = {
      interactionId: `gig-cmd-${i}-${Date.now()}`,
      spawnId: 'spn-marta-gig',
      actionId: 'spn-marta-gig-gig',
      clientTime: new Date().toISOString(),
    };
    const res = await engine.executeInteraction(cmd);
    assert.strictEqual(typeof res.success, 'boolean');
  }

  assert.strictEqual((engine as any).profile.dailyRiskGigsPerformedToday, 3);

  // 4th gig attempt must be rejected due to daily limit G=3
  const cmd4 = {
    interactionId: `gig-cmd-4-${Date.now()}`,
    spawnId: 'spn-marta-gig',
    actionId: 'spn-marta-gig-gig',
    clientTime: new Date().toISOString(),
  };
  const res4 = await engine.executeInteraction(cmd4);
  assert.strictEqual(res4.success, false, '4th gig must be rejected');
  assert.ok(res4.message.includes('limiit'), 'Message must explain daily limit');
});

test('Economy Model: Cash balance never drops below zero on failure penalty', async () => {
  const engine = new GameEngine();
  // Player has exactly 5 kr (enough for upfront fee C=5, but not enough for penalty L=15)
  (engine as any).profile.actionTurns = 5;
  (engine as any).profile.cash = 5;
  (engine as any).profile.dailyRiskGigsPerformedToday = 0;

  const choices: InteractionChoice[] = [
    {
      id: 'act-guaranteed-fail',
      title: 'Catastrophic test gig',
      description: 'Test failure loss with small bankroll',
      category: 'risk_gig',
      turnCost: 1,
      cashCost: 5,
      cashReward: 65,
      failureLoss: 15,
      successProbability: 0.0, // forced failure
      reputationChange: 3,
      outcomeText: 'Success',
      riskDescription: 'Failed',
    },
  ];

  (engine as any).activeSpawn = {
    spawnId: 'spn-fail-test',
    npcId: 'npc-marta',
    district: 'Kalamaja',
    latitude: 59.44,
    longitude: 24.74,
    timeSlot: '2026-09-29-18',
    expiresAt: Date.now() + 3600000,
    interactionRadius: 60,
    rewardCap: 5,
    timesInteracted: 0,
    storyState: 'initial',
    choices,
  };

  const res = await engine.executeInteraction({
    interactionId: `fail-test-${Date.now()}`,
    spawnId: 'spn-fail-test',
    actionId: 'act-guaranteed-fail',
    clientTime: new Date().toISOString(),
  });

  assert.strictEqual(res.success, false, 'Execution must fail');
  assert.ok(engine.getProfile().cash >= 0, 'Balance must remain non-negative (>= 0)');
  assert.strictEqual(engine.getProfile().cash, 0, 'Balance should clamp cleanly to 0');
});

test('Economy Sinks: District project contribution & gear maintenance', () => {
  const engine = new GameEngine();
  (engine as any).profile.cash = 100;

  const initialProjects = engine.getDistrictProjects();
  const proj = initialProjects[0];
  const initialCash = proj.currentCash;

  // 1. Contribute 15 kr to district project
  const res = engine.contributeToProject(proj.id, 15, 1);
  assert.strictEqual(res.success, true);
  assert.strictEqual(proj.currentCash, initialCash + 15);
  assert.strictEqual(engine.getProfile().cash, 85);

  // Check ledger entry
  const metrics = engine.getEconomyHealthMetrics();
  assert.ok(metrics.totalOutflow >= 15, 'Outflow must record 15 kr sink');

  // 2. Abuse protection: single donation capped at 50 kr
  const resOver = engine.contributeToProject(proj.id, 100, 1);
  assert.strictEqual(resOver.success, false, 'Single donation over 50 kr must be blocked');

  // 3. Gear maintenance sink (15 kr)
  const resMaint = engine.maintainGear();
  assert.strictEqual(resMaint.success, true);
  assert.strictEqual(engine.getProfile().cash, 70);
});

test('Economy Simulation: 3 Player Profiles (Beginner, Regular, Intensive)', async () => {
  // Helper to simulate action choice execution with mathematical probability
  const simulateChoice = (
    choice: InteractionChoice,
    player: { cash: number; turns: number; reputation: number; dailyGigs: number }
  ) => {
    if (player.turns < choice.turnCost) return { executed: false, reason: 'turns' };
    if (choice.category === 'risk_gig' && player.dailyGigs >= (choice.dailyLimit || 3)) {
      return { executed: false, reason: 'daily_limit' };
    }
    const cost = choice.cashCost || 0;
    if (player.cash < cost) return { executed: false, reason: 'cash' };

    player.turns -= choice.turnCost;
    player.cash -= cost;

    const p = choice.successProbability ?? 1.0;
    const isSuccess = Math.random() < p;

    if (isSuccess) {
      const reward = choice.cashReward || 0;
      player.cash += reward;
      player.reputation += choice.reputationChange || 0;
      if (choice.category === 'risk_gig') player.dailyGigs += 1;
      return { executed: true, net: reward - cost, success: true };
    } else {
      const loss = Math.min(player.cash, choice.failureLoss || 0);
      player.cash -= loss;
      player.reputation = Math.max(0, player.reputation - 2);
      if (choice.category === 'risk_gig') player.dailyGigs += 1;
      return { executed: true, net: -cost - loss, success: false };
    }
  };

  const choices = generateInteractionChoices('npc-marta', 'spn-sim');
  const smallJob = choices.find((c) => c.category === 'small_job')!;
  const trade = choices.find((c) => c.category === 'trade')!;
  const riskyGig = choices.find((c) => c.category === 'risk_gig')!;

  // 1. Beginner profile: 10 min/day, 2 turns, safe small jobs only
  let totalBeginnerNet = 0;
  for (let day = 0; day < 100; day++) {
    const beginner = { cash: 15, turns: 2, reputation: 5, dailyGigs: 0 };
    simulateChoice(smallJob, beginner);
    simulateChoice(smallJob, beginner);
    totalBeginnerNet += beginner.cash - 15;
    assert.ok(beginner.cash >= 15, 'Beginner must never lose money on small jobs');
  }
  const avgBeginnerDailyProfit = totalBeginnerNet / 100;
  assert.strictEqual(
    avgBeginnerDailyProfit,
    48,
    'Beginner doing 2 small jobs earns exactly 2 * 24 = 48 kr'
  );

  // 2. Regular user profile: 45 min/day, 6 turns from walking, does 2 small jobs, 2 trades, 1 risky gig, pays 15 kr sink
  let totalRegularNet = 0;
  for (let day = 0; day < 100; day++) {
    const regular = { cash: 60, turns: 6, reputation: 15, dailyGigs: 0 };
    simulateChoice(smallJob, regular); // 1 turn
    simulateChoice(smallJob, regular); // 1 turn
    simulateChoice(trade, regular);    // 1 turn
    simulateChoice(trade, regular);    // 1 turn
    simulateChoice(riskyGig, regular); // 2 turns
    // Sinks: 15 kr project donation
    regular.cash -= 15;
    totalRegularNet += regular.cash - 60;
  }
  const avgRegularDailyProfit = totalRegularNet / 100;
  // Expected: 2*24 + 2*26 + 1*28 - 15 = 48 + 52 + 28 - 15 = 113 kr
  assert.ok(
    avgRegularDailyProfit >= 95 && avgRegularDailyProfit <= 130,
    `Regular user profit (${avgRegularDailyProfit}) must oscillate around theoretical 113 kr`
  );

  // 3. Intensive user profile: hits step turn cap (6 turns) + passive turns (4 turns) = 10 turns
  // Maxes out 3 risky gigs (6 turns), 4 trades (4 turns), contributes 50 kr to project & 15 kr gear sink
  let totalIntensiveNet = 0;
  for (let day = 0; day < 100; day++) {
    const intensive = { cash: 150, turns: 10, reputation: 35, dailyGigs: 0 };
    simulateChoice(riskyGig, intensive); // 2 turns
    simulateChoice(riskyGig, intensive); // 2 turns
    simulateChoice(riskyGig, intensive); // 2 turns
    simulateChoice(trade, intensive);    // 1 turn
    simulateChoice(trade, intensive);    // 1 turn
    simulateChoice(trade, intensive);    // 1 turn
    simulateChoice(trade, intensive);    // 1 turn
    // Sinks: 50 kr donation + 15 kr gear maintenance = 65 kr
    intensive.cash -= 65;
    totalIntensiveNet += intensive.cash - 150;
    assert.ok(intensive.cash >= 0, 'Intensive player balance must never be negative');
  }
  const avgIntensiveDailyProfit = totalIntensiveNet / 100;
  // Expected: 3*28 + 4*26 - 65 = 84 + 104 - 65 = 123 kr
  assert.ok(
    avgIntensiveDailyProfit >= 100 && avgIntensiveDailyProfit <= 145,
    `Intensive player profit (${avgIntensiveDailyProfit}) must remain bounded and controlled by sinks`
  );
});
