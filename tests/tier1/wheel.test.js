import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playWheel } from '../helpers/game-engines/wheel-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';
import { WHEEL_SEGMENTS } from '../../src/utils/constants.js';

describe('Tier 1: Wheel Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Wheel' };

  test('TC-WHEEL-01: 10 segments low risk landing on 1.5x segment pays 1.5x bet', () => {
    const initialBal = getBalance();
    // Segment 0 in 10-low is 1.5x
    const expectedMult = WHEEL_SEGMENTS[10].low[0];
    assert.strictEqual(expectedMult, 1.5, 'Segment 0 should be 1.5x');

    const result = playWheel({
      betAmount: 10,
      segments: 10,
      risk: 'low',
      segmentIndexOverride: 0
    });

    assert.strictEqual(result.won, true, 'Multiplier > 1.0 is a win');
    assert.strictEqual(result.multiplier, 1.5, 'Multiplier should match');
    assert.strictEqual(result.payout, 15.0, 'Payout should be 10 * 1.5 = 15.0');
    assert.approxEqual(result.balanceAfter, initialBal + 5.0, 0.0001, 'Balance should increase by 5.0');
  }, meta);

  test('TC-WHEEL-02: 10 segments medium risk landing on 0x segment yields 0 payout', () => {
    const initialBal = getBalance();
    // Segment 1 in 10-medium is 0x
    const expectedMult = WHEEL_SEGMENTS[10].medium[1];
    assert.strictEqual(expectedMult, 0, 'Segment 1 should be 0x');

    const result = playWheel({
      betAmount: 10,
      segments: 10,
      risk: 'medium',
      segmentIndexOverride: 1
    });

    assert.strictEqual(result.won, false, 'Multiplier 0 is a loss');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -10.0, 'Profit should be -10.0');
    assert.approxEqual(result.balanceAfter, initialBal - 10.0, 0.0001, 'Balance should decrease by 10.0');
  }, meta);

  test('TC-WHEEL-03: 20 segments high risk landing on top segment pays 19.8x jackpot', () => {
    // Segment 19 in 20-high is 19.8x
    const expectedMult = WHEEL_SEGMENTS[20].high[19];
    assert.strictEqual(expectedMult, 19.8, 'Top segment in 20-high should be 19.8x');

    const result = playWheel({
      betAmount: 5,
      segments: 20,
      risk: 'high',
      segmentIndexOverride: 19
    });

    assert.strictEqual(result.won, true, 'Jackpot hit should win');
    assert.strictEqual(result.multiplier, 19.8, 'Multiplier should be 19.8x');
    assert.strictEqual(result.payout, 99.0, 'Payout should be 5 * 19.8 = 99.0');
  }, meta);

  test('TC-WHEEL-04: 50 segments low risk config contains exactly 50 segments', () => {
    const segmentsList = WHEEL_SEGMENTS[50].low;
    assert.strictEqual(segmentsList.length, 50, '50-segment wheel should have 50 elements');

    const result = playWheel({
      betAmount: 10,
      segments: 50,
      risk: 'low',
      segmentIndexOverride: 49 // segment 49 is 0x
    });

    assert.strictEqual(result.multiplier, 0, 'Segment 49 should be 0x');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
  }, meta);

  test('TC-WHEEL-05: Transaction history logs wheel spin details', () => {
    playWheel({
      betAmount: 8,
      segments: 30,
      risk: 'medium',
      segmentIndexOverride: 0
    });

    const history = getHistory();
    const entry = history[0];
    assert.strictEqual(entry.game, 'wheel', 'History game should be wheel');
    assert.strictEqual(entry.bet, 8, 'Bet should be 8');
    assert.strictEqual(entry.details.segments, 30, 'Details segments should be 30');
    assert.strictEqual(entry.details.risk, 'medium', 'Details risk should be medium');
  }, meta);
});
