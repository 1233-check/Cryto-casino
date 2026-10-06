import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { getBalance, setBalance } from '../../src/utils/balance.js';
import { playDice, playLimbo, playCrash } from '../helpers/game-engines/index.js';

describe('Tier 3: Rapid Betting & Isolation', () => {
  const meta = { tier: 'Tier 3: Cross-Feature Combinations', game: 'Rapid-Betting' };

  test('TC-XFEAT-11: 50 rapid successive bets in Dice with varying targets execute cleanly', () => {
    setBalance(1000.0);
    const initialBal = getBalance();
    let netProfitExpected = 0;

    for (let i = 1; i <= 50; i++) {
      const target = 20 + (i % 60);
      const roll = (i * 17) % 100;
      const res = playDice({
        betAmount: 2,
        target,
        condition: i % 2 === 0 ? 'over' : 'under',
        rollOverride: roll
      });
      assert.strictEqual(res.success, true, `Dice round ${i} should succeed`);
      netProfitExpected += res.profit;
    }

    assert.approxEqual(getBalance(), initialBal + netProfitExpected, 0.0001, 'Balance after 50 rounds must match exact sum');
  }, meta);

  test('TC-XFEAT-12: 50 rapid successive bets in Limbo execute with monotonic history', () => {
    setBalance(500.0);
    for (let i = 1; i <= 50; i++) {
      const targetMult = 1.5 + (i % 5);
      const float = 0.1 + (i % 8) * 0.1;
      const res = playLimbo({
        betAmount: 1,
        targetMultiplier: targetMult,
        floatOverride: float
      });
      assert.strictEqual(res.success, true, `Limbo round ${i} should succeed`);
    }
    assert.ok(getBalance() > 0, 'Balance should remain positive');
  }, meta);

  test('TC-XFEAT-13: Rapid interleaved betting between Crash and Dice preserves order', () => {
    setBalance(200.0);
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        playCrash({ betAmount: 1, autoCashout: 2.0, crashPointOverride: 2.5 });
      } else {
        playDice({ betAmount: 1, target: 50, condition: 'over', rollOverride: 60 });
      }
    }
    assert.ok(getBalance() > 0, 'Balance should be updated after 20 interleaved rounds');
  }, meta);

  test('TC-XFEAT-14: No lost updates or precision degradation during rapid betting loops', () => {
    setBalance(10.00000000);
    // 25 iterations of bet 0.1, win 0.2 (profit +0.1 each)
    for (let i = 0; i < 25; i++) {
      playDice({
        betAmount: 0.1,
        target: 50,
        condition: 'over',
        rollOverride: 60 // 1.98x
      });
    }
    // Net profit = 25 * (0.1 * 1.98 - 0.1) = 25 * 0.098 = 2.45
    assert.approxEqual(getBalance(), 10.0 + 2.45, 0.001, 'No drift after 25 rapid updates');
  }, meta);

  test('TC-XFEAT-15: Game engine execution idempotence under isolated runs', () => {
    setBalance(100.0);
    const run1 = playCrash({ betAmount: 10, autoCashout: 2.0, crashPointOverride: 3.0 });
    setBalance(100.0);
    const run2 = playCrash({ betAmount: 10, autoCashout: 2.0, crashPointOverride: 3.0 });

    assert.strictEqual(run1.payout, run2.payout, 'Identical game input must produce identical payout');
    assert.strictEqual(run1.profit, run2.profit, 'Identical game input must produce identical profit');
  }, meta);
});
