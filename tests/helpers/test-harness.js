/**
 * Test Harness for organizing and running test suites across Tiers 1-4.
 */
import { resetTestEnvironment } from './env.js';

class TestRegistry {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  describe(title, fn, meta = {}) {
    const parentSuite = this.currentSuite;
    const suite = {
      title,
      meta,
      tests: [],
      beforeEach: [],
      afterEach: [],
      parent: parentSuite
    };

    if (parentSuite) {
      parentSuite.tests.push(suite);
    } else {
      this.suites.push(suite);
    }

    this.currentSuite = suite;
    fn();
    this.currentSuite = parentSuite;
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEach.push(fn);
    }
  }

  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEach.push(fn);
    }
  }

  test(name, fn, meta = {}) {
    if (!this.currentSuite) {
      throw new Error(`test("${name}") must be declared inside a describe block`);
    }
    this.currentSuite.tests.push({
      type: 'test',
      name,
      fn,
      meta: { ...this.currentSuite.meta, ...meta }
    });
  }
}

export const registry = new TestRegistry();
export const describe = registry.describe.bind(registry);
export const test = registry.test.bind(registry);
export const it = test;
export const beforeEach = registry.beforeEach.bind(registry);
export const afterEach = registry.afterEach.bind(registry);

export async function runAllTests({ verbose = true } = {}) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    durationMs: 0,
    tierBreakdown: {
      'Tier 1: Feature Coverage': { passed: 0, failed: 0, total: 0 },
      'Tier 2: Boundary & Corner Cases': { passed: 0, failed: 0, total: 0 },
      'Tier 3: Cross-Feature Combinations': { passed: 0, failed: 0, total: 0 },
      'Tier 4: Real-World Scenarios': { passed: 0, failed: 0, total: 0 }
    },
    gameChecklist: {},
    failures: []
  };

  const startTime = Date.now();

  async function executeSuite(suite, activeBeforeEach = [], activeAfterEach = []) {
    const currentBeforeEach = [...activeBeforeEach, ...suite.beforeEach];
    const currentAfterEach = [...suite.afterEach, ...activeAfterEach];

    for (const item of suite.tests) {
      if (item.type === 'test') {
        results.total++;
        const tier = item.meta.tier || suite.meta.tier || 'Tier 1: Feature Coverage';
        const game = item.meta.game || suite.meta.game || 'Common';

        if (!results.tierBreakdown[tier]) {
          results.tierBreakdown[tier] = { passed: 0, failed: 0, total: 0 };
        }
        results.tierBreakdown[tier].total++;

        if (!results.gameChecklist[game]) {
          results.gameChecklist[game] = { passed: 0, failed: 0, total: 0 };
        }
        results.gameChecklist[game].total++;

        // Reset storage before each test
        resetTestEnvironment();

        const testStart = performance.now();
        let passed = false;
        let testError = null;

        try {
          for (const hook of currentBeforeEach) {
            await hook();
          }

          await item.fn();

          for (const hook of currentAfterEach) {
            await hook();
          }

          passed = true;
          results.passed++;
          results.tierBreakdown[tier].passed++;
          results.gameChecklist[game].passed++;
        } catch (err) {
          passed = false;
          results.failed++;
          results.tierBreakdown[tier].failed++;
          results.gameChecklist[game].failed++;
          testError = err;
          results.failures.push({
            suiteTitle: suite.title,
            testName: item.name,
            tier,
            game,
            error: err
          });
        }
        const testEnd = performance.now();
        const duration = (testEnd - testStart).toFixed(2);

        if (verbose) {
          const statusMark = passed ? ' \x1b[32m✔\x1b[0m' : ' \x1b[31m✖\x1b[0m';
          const line = `  ${statusMark} [${game}] ${item.name} (${duration}ms)`;
          console.log(line);
          if (!passed && testError) {
            console.error(`      \x1b[31mError: ${testError.message}\x1b[0m`);
            if (testError.actual !== undefined && testError.expected !== undefined) {
              console.error(`      Expected: ${JSON.stringify(testError.expected)}`);
              console.error(`      Actual:   ${JSON.stringify(testError.actual)}`);
            }
          }
        }
      } else {
        // Nested suite
        if (verbose) {
          console.log(`\n\x1b[36m${item.title}\x1b[0m`);
        }
        await executeSuite(item, currentBeforeEach, currentAfterEach);
      }
    }
  }

  for (const suite of registry.suites) {
    if (verbose) {
      console.log(`\n\x1b[1m\x1b[34m=== ${suite.title} ===\x1b[0m`);
    }
    await executeSuite(suite);
  }

  results.durationMs = Date.now() - startTime;
  return results;
}
