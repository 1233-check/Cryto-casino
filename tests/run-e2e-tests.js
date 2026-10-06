#!/usr/bin/env node
/**
 * Crypto Casino Comprehensive 4-Tier E2E Test Suite Runner
 * 
 * Executes all opaque-box tests across:
 * - Tier 1: Feature Coverage (>=5 tests per game across 15 games)
 * - Tier 2: Boundary & Corner Cases (>=5 tests per game across 15 games)
 * - Tier 3: Cross-Feature Combinations (pairwise, balance, history)
 * - Tier 4: Real-World Scenarios (betting workflows, provably fair seed audit)
 */

import './helpers/env.js';
import { runAllTests } from './helpers/test-harness.js';

// Tier 1 Suites
import './tier1/crash.test.js';
import './tier1/dice.test.js';
import './tier1/mines.test.js';
import './tier1/limbo.test.js';
import './tier1/plinko.test.js';
import './tier1/colortrading.test.js';
import './tier1/tower.test.js';
import './tier1/hilo.test.js';
import './tier1/wheel.test.js';
import './tier1/roulette.test.js';
import './tier1/slots.test.js';
import './tier1/blackjack.test.js';
import './tier1/baccarat.test.js';
import './tier1/videopoker.test.js';
import './tier1/keno.test.js';

// Tier 2 Suites
import './tier2/crash-boundaries.test.js';
import './tier2/dice-boundaries.test.js';
import './tier2/mines-boundaries.test.js';
import './tier2/limbo-boundaries.test.js';
import './tier2/plinko-boundaries.test.js';
import './tier2/colortrading-boundaries.test.js';
import './tier2/tower-boundaries.test.js';
import './tier2/hilo-boundaries.test.js';
import './tier2/wheel-boundaries.test.js';
import './tier2/roulette-boundaries.test.js';
import './tier2/slots-boundaries.test.js';
import './tier2/blackjack-boundaries.test.js';
import './tier2/baccarat-boundaries.test.js';
import './tier2/videopoker-boundaries.test.js';
import './tier2/keno-boundaries.test.js';

// Tier 3 Suites
import './tier3/balance-history-coupling.test.js';
import './tier3/multi-game-sessions.test.js';
import './tier3/rapid-betting-concurrency.test.js';

// Tier 4 Suites
import './tier4/provably-fair-verification.test.js';
import './tier4/crypto-stress.test.js';
import './tier4/betting-systems-martingale.test.js';
import './tier4/end-to-end-player-journeys.test.js';

async function main() {
  console.log('\n======================================================================');
  console.log('   🎰 CRYPTO CASINO - 4-TIER OPAQUE-BOX E2E TEST RUNNER 🎰');
  console.log('======================================================================');

  const results = await runAllTests({ verbose: true });

  console.log('\n======================================================================');
  console.log('                       E2E TEST SUITE SUMMARY                         ');
  console.log('======================================================================');

  console.log('\n📊 TIER BREAKDOWN:');
  for (const [tier, stat] of Object.entries(results.tierBreakdown)) {
    const rate = stat.total > 0 ? ((stat.passed / stat.total) * 100).toFixed(1) : '0.0';
    const statusIcon = stat.failed === 0 ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✖ FAIL\x1b[0m';
    console.log(`  ${statusIcon} ${tier.padEnd(36)}: ${stat.passed}/${stat.total} (${rate}%)`);
  }

  console.log('\n🎮 GAME CHECKLIST (15 GAMES COVERED):');
  const allGames = [
    'Crash', 'Dice', 'Mines', 'Limbo', 'Plinko',
    'Color Trading', 'Tower', 'Hi-Lo', 'Wheel', 'Roulette',
    'Slots', 'Blackjack', 'Baccarat', 'Video Poker', 'Keno'
  ];

  for (const game of allGames) {
    const stat = results.gameChecklist[game] || { passed: 0, failed: 0, total: 0 };
    const statusIcon = (stat.total >= 10 && stat.failed === 0) ? '\x1b[32m✔ COVERED\x1b[0m' : '\x1b[33m⚠ PARTIAL\x1b[0m';
    console.log(`  ${statusIcon} ${game.padEnd(16)}: ${stat.passed}/${stat.total} tests passed`);
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`  Total Tests Executed : ${results.total}`);
  console.log(`  Total Passed         : \x1b[32m${results.passed}\x1b[0m`);
  console.log(`  Total Failed         : ${results.failed > 0 ? `\x1b[31m${results.failed}\x1b[0m` : '0'}`);
  console.log(`  Execution Duration   : ${(results.durationMs / 1000).toFixed(2)}s`);
  console.log('======================================================================\n');

  if (results.failed > 0) {
    console.error(`\x1b[31mFAILED: ${results.failed} test(s) failed.\x1b[0m\n`);
    for (const fail of results.failures) {
      console.error(`- [${fail.tier}] [${fail.game}] ${fail.testName}:`);
      console.error(`  ${fail.error.message}\n`);
    }
    process.exit(1);
  } else {
    console.log('\x1b[32mSUCCESS: All tests passed with 100% success rate!\x1b[0m\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\x1b[31mFATAL TEST RUNNER ERROR:\x1b[0m', err);
  process.exit(1);
});
