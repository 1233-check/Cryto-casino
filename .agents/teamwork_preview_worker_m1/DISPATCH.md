# Task Assignment: Milestone 1 Worker (Math & Cryptography Remediation)

## Mission
Implement the core mathematical and cryptographic remediation in `src/utils/provablyFair.js` and `src/utils/constants.js`.

## Context & Inputs
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Original User Request: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md
- Project Scope: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\PROJECT.md
- Survey Analysis Reports:
  - `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_2\analysis.md`
  - `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_spec_miner_survey_3\analysis.md`
- Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_m1\

## Write Ownership
You EXCLUSIVELY own:
- `src/utils/provablyFair.js`
- `src/utils/constants.js`
Do NOT touch other files in this milestone.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Requirements
1. Remove redundant `import crypto from 'crypto';` from `src/utils/provablyFair.js` to eliminate browser bundling warnings.
2. Replace the pseudo-hash LCG in `src/utils/provablyFair.js` (`hmacSHA256`) with a cryptographically sound implementation of SHA-256 HMAC (pure JavaScript or WebCrypto compliant for Node and browser) that produces genuine 64-hex-character HMAC-SHA256 outputs.
3. Fix `getCrashPoint` in `src/utils/provablyFair.js` to eliminate the artificial 32.67x multiplier cap.
   Implement the authentic Bustabit / Stake Crash algorithm:
   - Either Stake uniform float formulation:
     If $h < 0.03$ (3% instant crash house edge, or 1% if $h < 0.01$), return 1.00.
     Otherwise: $M = \max(1.00, \lfloor (0.97 / (1 - h)) \times 100 \rfloor / 100)$.
   - Or Bustabit 52-bit integer modulus formulation using HMAC-SHA256 hash.
   Ensure multipliers scale smoothly and can reach 100x, 1000x+, with theoretical RTP = 97% to 99%.
4. In `src/utils/constants.js`:
   - Export `COLORS` object containing `accentGreen: '#00E701'`, `accentRed: '#E9113C'`, `accentBlue: '#0055FF'`, `accentGold: '#F59E0B'`, etc. (needed by `WheelGame.jsx` and other canvas renders).
   - Recalibrate `WHEEL_SEGMENTS` so that expected payouts for all 15 configurations (10, 20, 30, 40, 50 segments across Low, Medium, High risk) yield a positive House Edge of 1.0% to 2.0% (RTP 98.0% to 99.0%), eliminating the current negative house edge (-20% player advantage).
5. Run unit tests / verification scripts to prove:
   - HMAC produces genuine SHA-256 hashes.
   - Crash point generates multipliers > 32.67x and has expected RTP and crash rate.
   - Wheel segments all have RTP <= 99.0%.
6. Write your report in `handoff.md` and update `progress.md`.

## 2026-10-06T15:14:18Z
You are teamwork_preview_worker_m1.
Role: Milestone 1 Worker (Math & Cryptography Remediation).
Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_m1\
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
Parent conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961

Read ORIGINAL_REQUEST.md, PROJECT.md, and DISPATCH.md in your working directory.
Your task:
Implement the core mathematical and cryptographic remediation in src/utils/provablyFair.js and src/utils/constants.js.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership:
You EXCLUSIVELY own src/utils/provablyFair.js and src/utils/constants.js.

Specific requirements:
1. In src/utils/provablyFair.js, remove unused `import crypto from 'crypto';`.
2. Replace the weak pseudo-hash (hashCode + LCG) in hmacSHA256 with a true, cryptographically secure pure JS SHA-256 HMAC implementation (compatible with browser and Node.js without requiring external polyfills).
3. Fix getCrashPoint: Eliminate the artificial 32.67x multiplier cap! Implement the standard Bustabit / Stake provably fair crash algorithm. Ensure multipliers can reach 100x, 1000x+, with proper 1% or 3% instant crash house edge.
4. In src/utils/constants.js:
   - Export `COLORS` with accentGreen, accentRed, accentBlue, accentGold, etc.
   - Recalibrate WHEEL_SEGMENTS across all 15 configurations so that theoretical RTP is between 98.0% and 99.0% (positive house edge 1.0% to 2.0%), fixing the negative house edge bug where the house was losing up to 21.67%.
5. Verify your changes by running a node verification script (e.g. testing SHA-256 HMAC against test vectors, testing crash point distribution over 100k samples, testing wheel RTP).
6. Document your changes, commands run, and verification proofs in handoff.md.
7. Update progress.md.
8. Send a message to parent (c9e493c9-504a-44d3-889b-6f9b5020c961) when done.

