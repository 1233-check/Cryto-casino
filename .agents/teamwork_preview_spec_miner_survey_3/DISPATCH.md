# Task Assignment: Casino Math & Benchmark Spec Miner

## Mission
Extract and document exact mathematical models for all 15 games in Crypto Casino, specify requirements for the headless Monte Carlo simulation harness (>=100k rounds/game), and catalog market leader benchmarks (Stake, Roobet, BC.Game).

## Context
- Original User Request: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Your Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_spec_miner_survey_3\
- Parent: teamwork_preview_orchestrator_1 (Conv ID: c9e493c9-504a-44d3-889b-6f9b5020c961)

## Instructions
1. Read ORIGINAL_REQUEST.md.
2. Inspect all game implementations and math logic across the 15 titles (`Crash`, `Dice`, `Mines`, `Limbo`, `Plinko`, `Color Trading`, `Tower`, `Hi-Lo`, `Wheel`, `Roulette`, `Slots`, `Blackjack`, `Baccarat`, `Video Poker`, `Keno`).
3. For each game, extract the mathematical model:
   - Theoretical payout multipliers, paytables, odds, House Edge (%), Theoretical RTP (%), and volatility classifications.
   - Specific configurations (e.g. Plinko 8-16 rows, Low/Med/High risk; Mines 1-24 mines; Limbo target multipliers; Blackjack rules/dealer stands; Roulette European/American; Video Poker Jacks or Better paytable; Slots reel strips & paylines).
4. Specify the exact parameters and architecture for a headless Monte Carlo simulation engine that will simulate >=100,000 rounds per game configuration.
5. Research and benchmark all 15 titles against market leaders:
   - Stake Originals (Crash, Dice, Mines, Limbo, Plinko, Hi-Lo, Wheel, Keno, Roulette, Blackjack, Baccarat, Video Poker)
   - Roobet (Crash, Mines, Towers, Dice, Roulette)
   - BC.Game (Classic Dice, Crash, Plinko, Limbo, Hash Dice)
6. Produce a comprehensive report in your working directory at `analysis.md` and `handoff.md`.
7. Send a message to parent when complete.

## 2026-10-06T14:58:15Z
You are teamwork_preview_spec_miner_survey_3.
Your role: Casino Math & Benchmark Spec Miner.
Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_spec_miner_survey_3\
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
Parent conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961

Task:
1. Read ORIGINAL_REQUEST.md at project root.
2. Read your assignment in your working directory DISPATCH.md.
3. Survey the game logic across all 15 casino games (Crash, Dice, Mines, Limbo, Plinko, Color Trading, Tower, Hi-Lo, Wheel, Roulette, Slots, Blackjack, Baccarat, Video Poker, Keno).
4. Extract the mathematical model for each game: payout multipliers, paytables, win probabilities, theoretical RTP (%), theoretical House Edge (%), and volatility profile.
5. Specify architecture and parameters for a headless Monte Carlo simulation harness capable of executing >=100,000 rounds per game across all supported configurations (Plinko row/risk, Mines count, Limbo multipliers, Dice targets, Roulette bet types, Blackjack optimal strategy, Baccarat player/banker/tie, Video Poker paytable, Slots paylines, Wheel segments).
6. Research and document comparative benchmarks for each title against industry standards from market leaders: Stake.com Originals, Roobet, and BC.Game.
7. Write your detailed report in c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_spec_miner_survey_3\analysis.md and handoff.md.
8. Update progress.md with your liveness and status.
9. Send a message to parent (c9e493c9-504a-44d3-889b-6f9b5020c961) when done.
