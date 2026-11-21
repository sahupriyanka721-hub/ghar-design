import { describe, it, expect } from 'vitest';
import {
  calculateProjectWeightedProgress,
  createDefaultExecutionStages,
  createDefaultPaymentMilestones,
} from '../data/projectExecutionStore.js';

describe('Project Execution & Weighted Math Engine', () => {
  it('should initialize 10 standard IS 456 stages summing to 100% weight', () => {
    const stages = createDefaultExecutionStages();
    expect(stages.length).toBe(10);
    const totalWeight = stages.reduce((acc, s) => acc + s.weightPercent, 0);
    expect(totalWeight).toBe(100);
  });

  it('should calculate weighted progress correctly based on verified stage completion fraction', () => {
    const stages = createDefaultExecutionStages();
    // Stage 1: weight 8%, 100% verified -> contribution 8%
    stages[0].verifiedProgress = 100;
    // Stage 2: weight 7%, 100% verified -> contribution 7%
    stages[1].verifiedProgress = 100;
    // Stage 3: weight 12%, 50% verified -> contribution 6%
    stages[2].verifiedProgress = 50;
    // Others 0%

    const result = calculateProjectWeightedProgress(stages);
    // 8 + 7 + 6 = 21%
    expect(result.verifiedProgress).toBe(21);
    expect(result.explanation.breakdown.length).toBe(10);
  });

  it('should generate payment milestones matching the total contract amount exactly', () => {
    const totalPaise = 250000000; // 25 Lakhs
    const milestones = createDefaultPaymentMilestones(totalPaise);
    expect(milestones.length).toBe(6);

    const totalMilestonePaise = milestones.reduce((acc, m) => acc + m.amountPaise, 0);
    expect(totalMilestonePaise).toBe(totalPaise);
  });
});
