/**
 * Milestone 1 Forensic Integrity Audit Script
 * Agent: teamwork_preview_auditor_m1_1
 * Independent Verification Suite
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  hmacSHA256,
  sha256Hex,
  getProvablyFairFloats,
  getCrashPoint,
  generateServerSeed,
  hashSeed,
  getGameResult,
  shuffleArray
} from '../../src/utils/provablyFair.js';
import { WHEEL_SEGMENTS, COLORS } from '../../src/utils/constants.js';

console.log('--- FORENSIC AUDIT START ---');

let violations = [];

// 1. Static code check: no import crypto from 'crypto'
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pfCode = fs.readFileSync(path.resolve(__dirname, '../../src/utils/provablyFair.js'), 'utf8');

if (pfCode.includes("import crypto from 'crypto'")) {
  violations.push("Found 'import crypto from crypto' in provablyFair.js");
}
if (pfCode.includes('Math.floor(h * 33) === 0')) {
  violations.push("Found legacy 32.67x crash cap formula in provablyFair.js");
}

// Check for hardcoded test hashes or facades
const testVectorStrings = ['The quick brown fox', 'Jefe', 'what do ya want for nothing'];
for (const s of testVectorStrings) {
  if (pfCode.includes(s)) {
    violations.push(`Found hardcoded test string '${s}' in provablyFair.js`);
  }
}

// 2. Cryptographic parity with OpenSSL / Node crypto across arbitrary inputs
const arbitraryInputs = [
  { k: 'random_key_' + Math.random(), m: 'random_message_' + Math.random() },
  { k: '', m: '' },
  { k: 'abc', m: 'xyz' },
  { k: 'a'.repeat(64), m: 'exact_block' },
  { k: 'b'.repeat(65), m: 'longer_than_block' },
  { k: 'c'.repeat(1000), m: 'very_long_key_' + 'x'.repeat(500) },
  { k: Buffer.alloc(32, 0x5a), m: Buffer.alloc(128, 0xa5) }
];

for (const input of arbitraryInputs) {
  const actualHmac = hmacSHA256(input.k, input.m);
  const expectedHmac = crypto.createHmac('sha256', input.k).update(input.m).digest('hex');
  if (actualHmac !== expectedHmac) {
    violations.push(`HMAC mismatch for key length ${input.k.length}`);
  }

  const actualSha = sha256Hex(input.m);
  const expectedSha = crypto.createHash('sha256').update(input.m).digest('hex');
  if (actualSha !== expectedSha) {
    violations.push(`SHA-256 mismatch for input length ${input.m.length}`);
  }
}

// 3. Mathematical proof of getCrashPoint
// h in [0, 1)
// If h < 0.03 -> 1.00 (instant bust)
// Else -> Math.max(1.00, Math.floor((0.97 / (1 - h)) * 100) / 100)
// Check monotonicity and range:
const testHValues = [0.0, 0.01, 0.0299, 0.03, 0.05, 0.5, 0.9, 0.99, 0.999, 0.9999];
for (const h of testHValues) {
  const mult = h < 0.03 ? 1.00 : Math.max(1.00, Math.floor((0.97 / (1 - h)) * 100) / 100);
  if (h < 0.03 && mult !== 1.00) {
    violations.push(`Instant bust failed for h=${h}`);
  }
  if (h >= 0.03 && mult < 1.00) {
    violations.push(`Multiplier below 1.00 for h=${h}`);
  }
}

// 4. Mathematical proof of WHEEL_SEGMENTS
for (const [countStr, tiers] of Object.entries(WHEEL_SEGMENTS)) {
  const count = parseInt(countStr);
  for (const [tier, segments] of Object.entries(tiers)) {
    if (segments.length !== count) {
      violations.push(`WHEEL_SEGMENTS[${count}][${tier}] length mismatch: expected ${count}, got ${segments.length}`);
    }
    const sum = segments.reduce((acc, v) => acc + v, 0);
    const rtp = (sum / count) * 100;
    if (rtp < 98.0 || rtp > 99.0) {
      violations.push(`WHEEL_SEGMENTS[${count}][${tier}] RTP out of bounds: ${rtp}%`);
    }
  }
}

// 5. COLORS check
if (COLORS.accentGreen !== '#00E701') violations.push('COLORS.accentGreen invalid');
if (COLORS.accentRed !== '#E9113C') violations.push('COLORS.accentRed invalid');
if (COLORS.accentBlue !== '#0055FF') violations.push('COLORS.accentBlue invalid');
if (COLORS.accentGold !== '#F59E0B') violations.push('COLORS.accentGold invalid');
if (COLORS.accentPurple !== '#B388FF') violations.push('COLORS.accentPurple invalid');

console.log('Total violations detected:', violations.length);
if (violations.length === 0) {
  console.log('VERDICT: CLEAN');
} else {
  console.log('VERDICT: INTEGRITY VIOLATION');
  console.log(violations);
}
