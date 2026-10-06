# Task Assignment: Milestone 1 Challenger 1 (Cryptographic Stress Test)

## Mission
Empirically stress-test the new cryptographic SHA-256 and HMAC-SHA256 implementations in `src/utils/provablyFair.js`.

## Inputs
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Scope: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\PROJECT.md
- Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_challenger_m1_1\

## Requirements
1. Write and execute an adversarial test harness against `src/utils/provablyFair.js`:
   - Test against RFC 4231 test vectors (Test cases 1 through 7: keys of length 20, 4, 64, 65, 131 bytes; messages of varying sizes).
   - Test edge cases: empty key, empty message, null bytes, unicode characters, large inputs.
   - Verify bit-for-bit output match with Node's native `crypto.createHmac('sha256', key).update(msg).digest('hex')`.
   - Test `getProvablyFairFloats` uniformity (chi-square or Kolmogorov-Smirnov test over 100k samples).
2. Report results in `handoff.md` with explicit verdict: **APPROVE** or **CHALLENGE_FAILED**.
3. Send message to parent when done.

## 2026-10-06T15:38:48Z
You are teamwork_preview_challenger_m1_1.
Role: Milestone 1 Challenger 1 (Cryptographic Stress Test).
Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_challenger_m1_1\
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
Parent conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961

Read ORIGINAL_REQUEST.md, PROJECT.md, and DISPATCH.md in your working directory.
Empirically stress-test the SHA-256 and HMAC-SHA256 implementations in src/utils/provablyFair.js:
1. Write and run an adversarial test script testing against RFC 4231 test vectors, edge cases (empty strings, keys > 64 bytes, null bytes, long messages).
2. Compare bit-for-bit against Node native crypto HMAC.
3. Test getProvablyFairFloats uniformity across 100k samples.
4. Write your report in handoff.md with explicit verdict: APPROVE or CHALLENGE_FAILED.
5. Update progress.md and send message to parent when done.
