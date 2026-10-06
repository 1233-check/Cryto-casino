/**
 * Lightweight, zero-dependency test assertion library with descriptive error reporting.
 */

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export const assert = {
  ok(value, message = 'Expected truthy value') {
    if (!value) {
      throw new AssertionError(`${message} (received: ${value})`, value, true);
    }
  },

  equal(actual, expected, message = 'Values should be equal') {
    if (actual != expected) {
      throw new AssertionError(`${message} -> Expected ${expected}, got ${actual}`, actual, expected);
    }
  },

  strictEqual(actual, expected, message = 'Values should be strictly equal') {
    if (actual !== expected) {
      throw new AssertionError(`${message} -> Expected ${expected} (${typeof expected}), got ${actual} (${typeof actual})`, actual, expected);
    }
  },

  notStrictEqual(actual, expected, message = 'Values should not be strictly equal') {
    if (actual === expected) {
      throw new AssertionError(`${message} -> Expected not ${expected}, got ${actual}`, actual, expected);
    }
  },

  deepEqual(actual, expected, message = 'Objects should be deeply equal') {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      throw new AssertionError(`${message} -> Expected ${expStr}, got ${actStr}`, actual, expected);
    }
  },

  approxEqual(actual, expected, epsilon = 0.0001, message = 'Values should be approximately equal') {
    const diff = Math.abs(Number(actual) - Number(expected));
    if (diff > epsilon) {
      throw new AssertionError(`${message} -> Expected ${expected} ± ${epsilon}, got ${actual} (diff: ${diff})`, actual, expected);
    }
  },

  between(value, min, max, message = 'Value should be within range') {
    if (value < min || value > max) {
      throw new AssertionError(`${message} -> Expected ${value} to be between [${min}, ${max}]`, value, `[${min}, ${max}]`);
    }
  },

  greaterThan(actual, expected, message = 'Value should be greater than expected') {
    if (actual <= expected) {
      throw new AssertionError(`${message} -> Expected ${actual} > ${expected}`, actual, expected);
    }
  },

  greaterThanOrEqual(actual, expected, message = 'Value should be greater than or equal to expected') {
    if (actual < expected) {
      throw new AssertionError(`${message} -> Expected ${actual} >= ${expected}`, actual, expected);
    }
  },

  lessThan(actual, expected, message = 'Value should be less than expected') {
    if (actual >= expected) {
      throw new AssertionError(`${message} -> Expected ${actual} < ${expected}`, actual, expected);
    }
  },

  lessThanOrEqual(actual, expected, message = 'Value should be less than or equal to expected') {
    if (actual > expected) {
      throw new AssertionError(`${message} -> Expected ${actual} <= ${expected}`, actual, expected);
    }
  },

  throws(fn, message = 'Expected function to throw') {
    let threw = false;
    let thrownError;
    try {
      fn();
    } catch (err) {
      threw = true;
      thrownError = err;
    }
    if (!threw) {
      throw new AssertionError(message, 'no exception', 'exception thrown');
    }
    return thrownError;
  },

  async rejects(asyncFn, message = 'Expected async function to reject') {
    let rejected = false;
    let rejectionError;
    try {
      await asyncFn();
    } catch (err) {
      rejected = true;
      rejectionError = err;
    }
    if (!rejected) {
      throw new AssertionError(message, 'no rejection', 'promise rejected');
    }
    return rejectionError;
  }
};
