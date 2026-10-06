import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playColorTrading } from '../helpers/game-engines/colortrading-engine.js';
import { COLOR_MAP } from '../../src/utils/constants.js';

describe('Tier 2: Color Trading Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Color Trading' };

  test('TC-COLOR-B01: Number 0 matches both red and violet simultaneously', () => {
    const data0 = COLOR_MAP[0];
    assert.ok(data0.colors.includes('red'), 'Number 0 should include red');
    assert.ok(data0.colors.includes('violet'), 'Number 0 should include violet');

    const redBet = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'color', value: 'red' },
      resultNumberOverride: 0
    });
    assert.strictEqual(redBet.won, true, 'Red bet on 0 should win');

    const violetBet = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'color', value: 'violet' },
      resultNumberOverride: 0
    });
    assert.strictEqual(violetBet.won, true, 'Violet bet on 0 should win');
  }, meta);

  test('TC-COLOR-B02: Number 5 matches both green and violet simultaneously', () => {
    const data5 = COLOR_MAP[5];
    assert.ok(data5.colors.includes('green'), 'Number 5 should include green');
    assert.ok(data5.colors.includes('violet'), 'Number 5 should include violet');

    const greenBet = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'color', value: 'green' },
      resultNumberOverride: 5
    });
    assert.strictEqual(greenBet.won, true, 'Green bet on 5 should win');

    const violetBet = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'color', value: 'violet' },
      resultNumberOverride: 5
    });
    assert.strictEqual(violetBet.won, true, 'Violet bet on 5 should win');
  }, meta);

  test('TC-COLOR-B03: Boundary numbers 0 (minimum) and 9 (maximum) correctly mapped', () => {
    assert.strictEqual(COLOR_MAP[0].size, 'small', '0 should be small');
    assert.strictEqual(COLOR_MAP[9].size, 'big', '9 should be big');
    assert.ok(COLOR_MAP[9].colors.includes('green'), '9 should be green');
  }, meta);

  test('TC-COLOR-B04: Bet exceeding wallet balance returns insufficient balance error', () => {
    const result = playColorTrading({
      betAmount: 9999999
    });
    assert.strictEqual(result.success, false, 'Should fail gracefully');
    assert.strictEqual(result.error, 'Insufficient balance', 'Error message should match');
  }, meta);

  test('TC-COLOR-B05: Zero or negative bet amount throws validation error', () => {
    assert.throws(() => {
      playColorTrading({ betAmount: 0 });
    }, 'Zero bet must throw');

    assert.throws(() => {
      playColorTrading({ betAmount: -1 });
    }, 'Negative bet must throw');
  }, meta);
});
