# Exhaustive Casino Math, Game Logic & Benchmark Specification Report

**Agent**: `teamwork_preview_spec_miner_survey_3`  
**Role**: Casino Math & Benchmark Spec Miner  
**Project**: Crypto Casino (15 Games Library)  
**Date**: October 6, 2026  
**Status**: COMPLETE  

---

## 1. Executive Summary

This report establishes the authoritative mathematical models, payout formulas, win probabilities, theoretical Return-to-Player (RTP), theoretical House Edge (HE), volatility classifications, Monte Carlo simulation specifications ($\ge 100,000$ iterations per configuration), and competitive market benchmarks against industry leaders (**Stake.com Originals**, **Roobet**, and **BC.Game**) for all 15 casino games in the Crypto Casino library:
1. **Crash**
2. **Dice**
3. **Mines**
4. **Limbo**
5. **Plinko**
6. **Color Trading**
7. **Tower**
8. **Hi-Lo**
9. **Wheel**
10. **Roulette**
11. **Slots**
12. **Blackjack**
13. **Baccarat**
14. **Video Poker**
15. **Keno**

### Key Critical Findings & Mathematical Bugs Discovered
1. **Crash Multiplier Artificial Cap at 32.67x**:
   In `src/utils/provablyFair.js`, the crash point generator checks `if (Math.floor(h * 33) === 0) return 1.00;` using the same uniform float `h \in [0, 1)`. When `h \ge 1/33 \approx 0.030303`, the formula computes `Math.floor((0.99 / h) * 100) / 100`. Because $h$ cannot be less than $1/33$, the maximum multiplier that can ever be generated is $0.99 / (1/33) = 32.67\times$! Any crash point above $32.67\times$ is mathematically impossible. Furthermore, `hmacSHA256` uses a weak 32-bit linear congruential generator (LCG) rather than true cryptographic SHA-256.
2. **Wheel Inverted House Edge (Player Advantage / House Bleed)**:
   In `src/utils/constants.js`, the payout multipliers for `WHEEL_SEGMENTS` across 14 out of 15 configurations yield theoretical RTPs far exceeding $100\%$:
   - 20-segments Low: **119.50% RTP** (House Edge: **-19.50%**)
   - 20-segments Medium: **120.00% RTP** (House Edge: **-20.00%**)
   - 30-segments Medium: **121.67% RTP** (House Edge: **-21.67%**)
   - 40-segments Medium: **121.25% RTP** (House Edge: **-21.25%**)
   - 50-segments Medium: **120.00% RTP** (House Edge: **-20.00%**)
   The casino loses money on every spin across these configurations.
3. **Slots Payout Multiplier Base Bug**:
   In `src/games/SlotsGame.jsx`, `evaluateWins` awards `betAmount * multiplier` for *every* winning payline out of 20 paylines. Because `betAmount` is the total round wager rather than the per-line wager (`betAmount / 20`), the total theoretical RTP is **677.00%** (House Edge: **-577.00%**).
4. **Keno Missing Implementation & Extreme House Edge**:
   In `src/App.jsx`, Keno is stubbed out as `<ComingSoon title="Keno" />`. While `KENO_PAYOUTS` exists in `src/utils/constants.js`, the theoretical RTP drops from $99.00\%$ (Pick 1) down to **14.84%** (Pick 10), which corresponds to an unsustainable **85.16% House Edge**.
5. **Dice Balance Integration Void**:
   In `src/games/DiceGame.jsx`, `handleRoll` does not call `subtractFromBalance` or `addToBalance`, allowing infinite free betting without wallet deduction or balance updates.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Crash | Multiplier Growth Engine | Continuous exponential multiplier curve $e^{0.06 t}$ | Time elapsed $t$ (seconds) | Multiplier float | Crashes when $e^{0.06 t} \ge \text{crashPoint}$ | `src/games/CrashGame.jsx:115` |
| 2 | Crash | Bustabit Provably Fair Point | Calculates crash point from seeds | `serverSeed`, `clientSeed` | Crash multiplier ($\ge 1.00\times$) | Hard-capped at 32.67x due to $h \ge 1/33$ bug | `src/utils/provablyFair.js:52` |
| 3 | Dice | Roll Over / Under Slider | Roll resolution with target 2 to 98 | `target` (2-98), `condition` ('over'/'under') | Roll (0.00-100.00), win flag, profit | Does not deduct/credit balance | `src/games/DiceGame.jsx:17` |
| 4 | Mines | Combinatorial Multipliers | Fair multiplier $(0.99 \times \binom{25}{k}) / \binom{25-m}{k}$ | Mines $m \in [1, 24]$, safe picks $k$ | Truncated multiplier float | Uncaught if $k > 25-m$ | `src/games/MinesGame.jsx:18` |
| 5 | Mines | Fisher-Yates Tile Placement | Shuffles 25 grid indices using seeds | Seed / Random floats | Array of 25 indices, first $m$ are mines | Does not persist balance to `balance.js` | `src/games/MinesGame.jsx:43` |
| 6 | Limbo | Single-Shot Multiplier Draw | Draws float and tests against target multiplier | `targetMultiplier` ($\ge 1.01\times$) | Outcome multiplier, win/loss status | Does not update wallet balance | `src/games/LimboGame.jsx:22` |
| 7 | Plinko | Binomial Path Deflection | Peg collisions mapped via Bernoulli trials ($p=0.5$) | Rows $n \in \{8, 12, 16\}$, Risk | Bucket index $j \in [0, n]$, multiplier | Fixed to 3 row choices | `src/games/PlinkoGame.jsx:35` |
| 8 | Color Trading | 30s Periodic Game Loop | Asian color prediction (0-9, Green, Red, Violet) | Bet on Number (0-9) or Color | Winner number, multiplier (2x, 4.5x, 9x) | Violet/Number HE 10%, Red/Green HE 0% | `src/games/ColorTradingGame.jsx:20` |
| 9 | Tower | Floor Step Multipliers | Geometric step $0.98 \times (\text{cols}/\text{safe})^L$ | Difficulty (Easy/Med/Hard), Floor $L \in [1, 10]$ | Multiplier float, floor status | Does not update wallet balance | `src/games/TowerGame.jsx:12` |
| 10 | Hi-Lo | Dynamic Step Odds | Multipliers adjusted to remaining card rank counts | Current card rank, Guess ('higher'/'lower') | Cumulative multiplier, next card | Reshuffles full 52 deck each draw | `src/games/HiLoGame.jsx:57` |
| 11 | Wheel | Segmented Wheel Spin | Segment landing with 10, 20, 30, 40, 50 segments | Segment count, Risk (Low/Med/High) | Multiplier float (0x to 49.5x) | Payout tables yield up to 121.67% RTP | `src/games/WheelGame.jsx:40` |
| 12 | Roulette | European Single Zero (37) | Standard European board layout and payouts | Bet type, target numbers, bet amount | Spin number (0-36), gross payout | Deprecated PixiJS v7 drawing calls | `src/games/RouletteGame.jsx:70` |
| 13 | Slots | 5x3 Grid 20 Paylines | 8 symbols uniform selection ($p=1/8$) | Bet amount | 5x3 symbol matrix, line wins | Multiplies total bet by line multiplier | `src/games/SlotsGame.jsx:270` |
| 14 | Blackjack | 4-Deck Dealer Stands on 17 | 4-deck blackjack with natural 3:2 and Double | Hit, Stand, Double Down | Dealer/Player total, win/loss/push | No split, insurance, or surrender | `src/games/BlackjackGame.jsx:81` |
| 15 | Baccarat | Punto Banco 3rd Card Tableau | Authentic standard drawing rules (8/9 natural) | Bet on Player, Banker, or Tie | Player/Banker total, winning side | Infinite deck sampling (independent draws) | `src/games/BaccaratGame.jsx:118` |
| 16 | Video Poker | 9/6 Jacks or Better | Draw poker with hold mechanism and 9/6 paytable | 5 cards dealt, hold mask (5 bits) | Replacement cards, final poker rank | Full 9/6 paytable with 99.54% max RTP | `src/games/VideoPokerGame.jsx:43` |
| 17 | Keno | 40-Ball 10-Draw Lottery | Player picks 1 to 10 numbers from 40 | Number of picks $P \in [1, 10]$, selected set | 10 drawn numbers, match count, payout | UI stubbed as `<ComingSoon/>`, HE up to 85% | `src/utils/constants.js:36` |

---

## 3. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Crash | Provably Fair float $h < 0.030303$ | Triggers `Math.floor(h * 33) === 0`, returning instant crash $1.00\times$. Multipliers $> 32.67\times$ are unreachable. |
| 2 | Crash | Target cashout $= 1.00\times$ | Minimum auto cashout clamped to $1.01\times$ in UI input, but instant crash at $1.00\times$ causes immediate loss. |
| 3 | Dice | Target $= 2.00$ on 'Under' | Win chance $= 2.00\%$, Multiplier $= 49.50\times$. Roll $< 2.00$ wins. |
| 4 | Dice | Target $= 98.00$ on 'Over' | Win chance $= 2.00\%$, Multiplier $= 49.50\times$. Roll $> 98.00$ wins. Roll exactly $= 98.00$ loses. |
| 5 | Mines | Pick 24 with 24 Mines | Safe tiles $= 1$. Single pick multiplier $= \lfloor 0.99 \times \binom{25}{1}/\binom{1}{1} \rfloor = 24.75\times$. Win prob $= 1/25 = 4.00\%$. |
| 6 | Mines | Zero safe tiles revealed | Payout multiplier is $1.00\times$; cashout button is disabled until at least 1 tile is clicked. |
| 7 | Limbo | Multiplier target $= 1.01\times$ | Win chance $= 98.0198\%$. Any roll $\ge 1.01$ awards $1.01\times$. Rolls $< 1.01$ bust. |
| 8 | Limbo | Multiplier target $= 1,000,000\times$ | Float must be $\le 0.00000099$. Win chance $= 0.000099\%$. |
| 9 | Plinko | Ball lands in edge bucket ($j=0$ or $j=n$) | Probability is $(0.5)^n$. For 16 rows: $1/65536 \approx 0.001526\%$. Multiplier is $1000\times$ (High risk). |
| 10 | Plinko | Ball lands in center bucket ($j=n/2$) | Probability is $\binom{n}{n/2} / 2^n$. For 16 rows: $12870 / 65536 \approx 19.638\%$. Multiplier is $0.2\times$ (High risk). |
| 11 | Color Trading | Drawn number is 0 | Matched by Red AND Violet. Bet on Red pays $2\times$, bet on Violet pays $4.5\times$. Number 0 pays $9\times$. |
| 12 | Color Trading | Drawn number is 5 | Matched by Green AND Violet. Bet on Green pays $2\times$, bet on Violet pays $4.5\times$. Number 5 pays $9\times$. |
| 13 | Tower | Top floor (Floor 10) reached | Auto-cashout triggered automatically. Easy: $17.40\times$; Medium: $56.51\times$; Hard: $1003.52\times$. |
| 14 | Hi-Lo | Ace drawn as initial card | Rank value $v=1$. Favorable ranks for 'Higher or Same' $= 13/13 = 100\%$. Multiplier $= 0.99 \times (13/13) = 0.99\times$. |
| 15 | Hi-Lo | King drawn as initial card | Rank value $v=13$. Favorable ranks for 'Lower or Same' $= 13/13 = 100\%$. Multiplier $= 0.99 \times (13/13) = 0.99\times$. |
| 16 | Roulette | Ball lands on 0 | Straight bet on 0 pays $36\times$. All outside bets (Dozen, Column, Red, Black, Even, Odd, High, Low) lose. |
| 17 | Roulette | Multiple simultaneous bets | Payouts aggregate across all winning straight, split, corner, street, line, column, dozen, and outside bets. |
| 18 | Slots | 5 Diamonds on multiple paylines | Each 5-Diamond payline pays $1000\times \text{betAmount}$. If 2 paylines align, pays $2000\times \text{betAmount}$. |
| 19 | Blackjack | Both Player & Dealer have Blackjack | Immediate round evaluation: pushes with 100% refund of bet. |
| 20 | Blackjack | Double Down on Hand Value 21 | Button disabled if hand length $> 2$; otherwise allowed, receives 1 card and transitions to dealer turn. |
| 21 | Baccarat | Tie result when betting Player or Banker | Player/Banker bets are pushed (100% refunded), Tie bet pays $8:1$ ($9\times$ gross). |
| 22 | Video Poker | Discard all 5 cards (Hold 0) | Replaces all 5 cards from the remaining 47 cards in deck; re-evaluates rank from scratch. |

---

## 4. Mathematical Model & Specification (All 15 Titles)

### 4.1. Crash
- **Mechanics**: Multiplayer curve starts at $1.00\times$ and increases exponentially: $M(t) = e^{0.06 t}$. Players may cash out manually or configure an auto-cashout target $T \ge 1.01\times$.
- **Crash Point Formula**:
  $$\text{crashPoint} = \max\left(1.00, \left\lfloor \frac{0.99}{h} \times 100 \right\rfloor \div 100 \right)$$
- **Theoretical Win Probability**: For target $T$, $P(\text{Win}) = P(\text{crashPoint} \ge T) = \frac{0.99}{T}$.
- **Theoretical RTP**: $P(\text{Win}) \times T = \frac{0.99}{T} \times T = 99.00\%$.
- **Theoretical House Edge**: $1.00\%$.
- **Volatility**: Extreme (High Kurtosis, heavy right tail).
- **Current Bug in Code**: Artificial cap at $32.67\times$ because $h < 1/33$ causes instant bust, preventing any $h$ below $0.030303$ from being evaluated. Must be replaced with standard Stake/Bustabit SHA-256 algorithm.

### 4.2. Dice
- **Mechanics**: Player selects a target number $X \in [2.00, 98.00]$ and condition ('Over' or 'Under'). Random float $R \in [0.00, 100.00)$ is generated.
- **Win Conditions**:
  - Over: $R > X$, Win Chance $= 100 - X$.
  - Under: $R < X$, Win Chance $= X$.
- **Multiplier Formula**:
  $$\text{Multiplier} = \frac{99}{\text{Win Chance}}$$
- **Theoretical Win Probability**: $\frac{\text{Win Chance}}{100}$.
- **Theoretical RTP**:
  $$\text{RTP} = \frac{\text{Win Chance}}{100} \times \frac{99}{\text{Win Chance}} = 0.9900 = 99.00\%$$
- **Theoretical House Edge**: $1.00\%$ across all targets.
- **Volatility**: Dynamic: Low at $X=50$ ($1.98\times$), High at $X=98$ ($49.50\times$).

### 4.3. Mines
- **Mechanics**: $5 \times 5$ grid (25 tiles) containing $m \in [1, 24]$ mines and $S = 25 - m$ safe gems. Player uncovers tiles sequentially without hitting a mine, cashing out after $k \in [1, S]$ safe tiles.
- **Combinatorial Probability**:
  $$P(\text{Uncover } k \text{ Safe}) = \frac{\binom{25-m}{k}}{\binom{25}{k}}$$
- **Multiplier Formula**:
  $$\text{Multiplier}(m, k) = \left\lfloor 0.99 \times \frac{\binom{25}{k}}{\binom{25-m}{k}} \times 100 \right\rfloor \div 100$$
- **Theoretical RTP**:
  $$\text{Unfloored RTP} = 99.00\%$$
  $$\text{Floored RTP} = P(m, k) \times \text{Multiplier}(m, k) \in [98.40\%, 99.00\%]$$
- **Theoretical House Edge**: $1.00\%$ (nominal), up to $1.60\%$ with truncation.
- **Sample Multipliers**:
  - 1 Mine: $k=1 \implies 1.03\times$ ($98.88\%$ RTP); $k=12 \implies 1.90\times$ ($98.80\%$ RTP); $k=24 \implies 24.75\times$ ($99.00\%$ RTP).
  - 3 Mines: $k=1 \implies 1.12\times$ ($98.56\%$ RTP); $k=11 \implies 6.25\times$ ($98.91\%$ RTP); $k=22 \implies 2,277\times$ ($99.00\%$ RTP).
  - 5 Mines: $k=1 \implies 1.23\times$ ($98.40\%$ RTP); $k=10 \implies 17.51\times$ ($98.97\%$ RTP); $k=20 \implies 52,598.7\times$ ($99.00\%$ RTP).
  - 24 Mines: $k=1 \implies 24.75\times$ ($99.00\%$ RTP).

### 4.4. Limbo
- **Mechanics**: Single-round crash variant where player wagers on target multiplier $T \ge 1.01\times$. Random float $f \in (0, 1]$ generates outcome $M = \max(1, \lfloor (0.99 / f) \times 100 \rfloor / 100)$.
- **Win Condition**: $M \ge T \iff f \le \frac{0.99}{T}$.
- **Theoretical Win Probability**: $P(\text{Win}) = \frac{0.99}{T}$.
- **Theoretical RTP**: $P(\text{Win}) \times T = 99.00\%$.
- **Theoretical House Edge**: $1.00\%$ across all multiplier targets.
- **Volatility**: Scale-dependent: Low ($T=1.1\times$, $90\%$ win), Extreme ($T=10,000\times$, $0.0099\%$ win).

### 4.5. Plinko
- **Mechanics**: Ball drops through a pyramid of pegs with $n \in \{8, 12, 16\}$ rows. At each peg, the ball bounces left ($0$) or right ($1$) with $p=0.5$. Final bucket index $j \in [0, n]$ is the sum of $n$ Bernoulli trials.
- **Probability Distribution**:
  $$P(j) = \frac{\binom{n}{j}}{2^n}$$
- **Theoretical RTP Table Across All 9 Configurations**:

| Rows | Risk Tier | Payout Range (Min - Max) | Theoretical RTP | House Edge | Volatility |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 8 | Low | 0.5x - 5.6x | **98.9844%** | 1.0156% | Low |
| 8 | Medium | 0.4x - 13.0x | **98.9063%** | 1.0938% | Medium |
| 8 | High | 0.2x - 29.0x | **99.0625%** | 0.9375% | High |
| 12 | Low | 0.5x - 10.0x | **98.9795%** | 1.0205% | Low |
| 12 | Medium | 0.3x - 33.0x | **98.9893%** | 1.0107% | Medium |
| 12 | High | 0.2x - 170.0x | **99.1162%** | 0.8838% | High |
| 16 | Low | 0.5x - 16.0x | **98.9987%** | 1.0013% | Low |
| 16 | Medium | 0.3x - 110.0x | **98.9883%** | 1.0117% | Medium |
| 16 | High | 0.2x - 1000.0x | **98.9764%** | 1.0236% | Extreme |

### 4.6. Color Trading
- **Mechanics**: 30-second game round draws integer $N \in \{0, 1, \dots, 9\}$ with equal probability ($10\%$).
- **Color Mapping**:
  - Green: $\{1, 3, 5, 7, 9\}$ (5 numbers, $50\%$ probability)
  - Red: $\{0, 2, 4, 6, 8\}$ (5 numbers, $50\%$ probability)
  - Violet: $\{0, 5\}$ (2 numbers, $20\%$ probability)
- **Paytables & Mathematical Profile**:
  - **Number Bet (0-9)**: Probability $= 10\%$, Multiplier $= 9\times$, $\text{RTP} = 0.10 \times 9 = \mathbf{90.00\%}$, House Edge $= \mathbf{10.00\%}$.
  - **Color Green**: Probability $= 50\%$, Multiplier $= 2\times$, $\text{RTP} = 0.50 \times 2 = \mathbf{100.00\%}$, House Edge $= \mathbf{0.00\%}$.
  - **Color Red**: Probability $= 50\%$, Multiplier $= 2\times$, $\text{RTP} = 0.50 \times 2 = \mathbf{100.00\%}$, House Edge $= \mathbf{0.00\%}$.
  - **Color Violet**: Probability $= 20\%$, Multiplier $= 4.5\times$, $\text{RTP} = 0.20 \times 4.5 = \mathbf{90.00\%}$, House Edge $= \mathbf{10.00\%}$.

### 4.7. Tower
- **Mechanics**: 10 floors. Each floor contains $C$ columns with $S$ safe tiles and 1 bomb.
  - Easy: $C=4, S=3$ ($P_{\text{step}} = 3/4 = 0.75$)
  - Medium: $C=3, S=2$ ($P_{\text{step}} = 2/3 \approx 0.6667$)
  - Hard: $C=2, S=1$ ($P_{\text{step}} = 1/2 = 0.50$)
- **Floor Multiplier Formula**:
  $$\text{Multiplier}(L) = \left\lfloor 0.98 \times \left(\frac{C}{S}\right)^L \times 100 \right\rfloor \div 100$$
- **Theoretical RTP**: Nominal base RTP is **98.00%** (House Edge: **2.00%**).
- **Floor-by-Floor Payout & Probabilities**:
  - Easy: Floor 1 ($1.30\times$, $75\%$, $97.50\%$ RTP) $\to$ Floor 5 ($4.12\times$, $23.73\%$, $97.77\%$ RTP) $\to$ Floor 10 ($17.40\times$, $5.63\%$, $97.99\%$ RTP).
  - Medium: Floor 1 ($1.47\times$, $66.67\%$, $98.00\%$ RTP) $\to$ Floor 5 ($7.44\times$, $13.17\%$, $97.98\%$ RTP) $\to$ Floor 10 ($56.51\times$, $1.73\%$, $98.00\%$ RTP).
  - Hard: Floor 1 ($1.96\times$, $50.00\%$, $98.00\%$ RTP) $\to$ Floor 5 ($31.36\times$, $3.125\%$, $98.00\%$ RTP) $\to$ Floor 10 ($1003.52\times$, $0.0977\%$, $98.00\%$ RTP).

### 4.8. Hi-Lo
- **Mechanics**: Current card has rank $v \in [1, 13]$ (Ace $= 1$ to King $= 13$). Player predicts whether the next drawn card is "Higher or Same" or "Lower or Same". Full 52-card deck is sampled with replacement.
- **Probabilities & Step Multipliers**:
  - "Higher or Same": Favorable ranks $= 14 - v$, Probability $= \frac{14-v}{13}$, Multiplier $= 0.99 \times \frac{13}{14-v}$.
    $$\text{RTP} = \frac{14-v}{13} \times \left(0.99 \times \frac{13}{14-v}\right) = 0.9900 = \mathbf{99.00\%}$$
  - "Lower or Same": Favorable ranks $= v$, Probability $= \frac{v}{13}$, Multiplier $= 0.99 \times \frac{13}{v}$.
    $$\text{RTP} = \frac{v}{13} \times \left(0.99 \times \frac{13}{v}\right) = 0.9900 = \mathbf{99.00\%}$$
- **Cumulative Multiplier**: Multiplies across consecutive successful guesses. RTP remains exactly **99.00%** per decision step. House Edge $= \mathbf{1.00\%}$.

### 4.9. Wheel
- **Mechanics**: Wheel divided into $S \in \{10, 20, 30, 40, 50\}$ equal segments. Each segment has an assigned payout multiplier. Outcome chosen uniformly with probability $1/S$.
- **Formula**:
  $$\text{RTP} = \frac{1}{S} \sum_{i=0}^{S-1} \text{multiplier}[i]$$
- **Theoretical RTP Table (Code vs. Industry Standard)**:

| Segments | Risk Tier | Payout Array Max | Code Theoretical RTP | Code House Edge | Stake.com Target RTP | Severity |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 10 | Low | 1.5x | **108.00%** | **-8.00%** | 99.00% | Critical House Bleed |
| 10 | Medium | 2.0x | **90.00%** | +10.00% | 99.00% | Over-penalizing |
| 10 | High | 9.9x | **99.00%** | +1.00% | 99.00% | Aligned |
| 20 | Low | 3.0x | **119.50%** | **-19.50%** | 99.00% | Critical House Bleed |
| 20 | Medium | 5.0x | **120.00%** | **-20.00%** | 99.00% | Critical House Bleed |
| 20 | High | 19.8x | **106.50%** | **-6.50%** | 99.00% | Critical House Bleed |
| 30 | Low | 3.0x | **113.33%** | **-13.33%** | 99.00% | Critical House Bleed |
| 30 | Medium | 8.0x | **121.67%** | **-21.67%** | 99.00% | Critical House Bleed |
| 30 | High | 29.7x | **104.00%** | **-4.00%** | 99.00% | Critical House Bleed |
| 40 | Low | 3.0x | **112.00%** | **-12.00%** | 99.00% | Critical House Bleed |
| 40 | Medium | 10.0x | **121.25%** | **-21.25%** | 99.00% | Critical House Bleed |
| 40 | High | 39.6x | **104.00%** | **-4.00%** | 99.00% | Critical House Bleed |
| 50 | Low | 3.0x | **107.20%** | **-7.20%** | 99.00% | Critical House Bleed |
| 50 | Medium | 12.0x | **120.00%** | **-20.00%** | 99.00% | Critical House Bleed |
| 50 | High | 49.5x | **103.00%** | **-3.00%** | 99.00% | Critical House Bleed |

### 4.10. Roulette
- **Mechanics**: European Roulette with 37 pockets ($0$ and numbers $1$ to $36$). Wheel drawn uniformly with probability $1/37$.
- **Bet Types & Payout Multipliers**:
  - Straight (1 number): Gross payout $= 36\times$, Probability $= 1/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
  - Split (2 numbers): Gross payout $= 18\times$, Probability $= 2/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
  - Street (3 numbers): Gross payout $= 12\times$, Probability $= 3/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
  - Corner (4 numbers): Gross payout $= 9\times$, Probability $= 4/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
  - Line (6 numbers): Gross payout $= 6\times$, Probability $= 6/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
  - Column / Dozen (12 numbers): Gross payout $= 3\times$, Probability $= 12/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
  - Red / Black / Even / Odd / 1-18 / 19-36 (18 numbers): Gross payout $= 2\times$, Probability $= 18/37 \implies \text{RTP} = 36/37 = \mathbf{97.2973\%}$.
- **Theoretical House Edge**: Exactly $\frac{1}{37} = \mathbf{2.7027\%}$ across every single bet type.

### 4.11. Slots
- **Mechanics**: 5 reels $\times$ 3 visible rows, 20 fixed paylines. 8 symbols uniformly distributed ($p = 1/8$ per cell). Evaluates matches from Left to Right (reel 0 onward).
- **Paytable**:
  - 💎: 3 of a kind: 50x; 4: 200x; 5: 1000x
  - 7️⃣: 3 of a kind: 25x; 4: 100x; 5: 500x
  - 🔔: 3 of a kind: 15x; 4: 50x; 5: 200x
  - ⭐: 3 of a kind: 10x; 4: 30x; 5: 100x
  - 🍇: 3 of a kind: 5x; 4: 15x; 5: 50x
  - 🍊: 3 of a kind: 3x; 4: 10x; 5: 30x
  - 🍋: 3 of a kind: 2x; 4: 5x; 5: 20x
  - 🍒: 3 of a kind: 2x; 4: 5x; 5: 15x
- **Mathematical Evaluation**:
  - Probability of exact 3-match on a line: $(1/8)^3 \times (7/8) = 7 / 4096 \approx 0.1709\%$.
  - Probability of exact 4-match on a line: $(1/8)^4 \times (7/8) = 7 / 32768 \approx 0.0214\%$.
  - Probability of exact 5-match on a line: $(1/8)^5 = 1 / 32768 \approx 0.00305\%$.
  - Expected return per single line (relative to line bet): **33.8501%**.
  - **Current Code Behavior**: Awards `betAmount * multiplier` across 20 paylines. Total round RTP is $20 \times 33.8501\% = \mathbf{677.00\%}$ (House Edge: **-577.00%**).
  - **Required Remediation**: Either payline wager must be `betAmount / 20` (and paytable recalibrated to achieve ~96-97% RTP), or total bet multiplier adjusted.

### 4.12. Blackjack
- **Mechanics**: 4 standard 52-card decks (208 cards). Reshuffled each round.
- **Ruleset**:
  - Natural Blackjack pays 3:2 ($1.5\times$ profit).
  - Dealer stands on Soft 17 (S17 rule).
  - Double Down permitted on initial two cards (draws 1 card, doubles bet).
  - No split, insurance, or surrender implemented.
- **Theoretical RTP**:
  - Basic Strategy: **99.40%** (House Edge: **0.60%**).
  - Without splitting: ~**99.12%**.

### 4.13. Baccarat
- **Mechanics**: Authentic Punto Banco drawing tableau. Initial 2 cards each.
  - Naturals (8 or 9) end round immediately.
  - Player stands on 6 or 7, draws 3rd card on $\le 5$.
  - Banker draws according to standard tableau based on banker total and player 3rd card.
  - Infinite shoe model (independent uniform card draws).
- **Bet Options & Payouts**:
  - **Player Bet**: Pays 1:1 ($2\times$ gross). Tie pushes.
    - Win Prob: $44.62\%$, Push: $9.52\%$, Loss: $45.86\%$.
    - $\text{RTP} = (0.4462 \times 2) + (0.0952 \times 1) = \mathbf{98.76\%}$ (House Edge: **1.24%**).
  - **Banker Bet**: Pays 0.95:1 ($1.95\times$ gross, 5% commission). Tie pushes.
    - Win Prob: $45.86\%$, Push: $9.52\%$, Loss: $44.62\%$.
    - $\text{RTP} = (0.4586 \times 1.95) + (0.0952 \times 1) = \mathbf{98.94\%}$ (House Edge: **1.06%**).
  - **Tie Bet**: Pays 8:1 ($9\times$ gross). Loses on Player or Banker win.
    - Win Prob: $9.52\%$, Loss: $90.48\%$.
    - $\text{RTP} = 0.0952 \times 9 = \mathbf{85.68\%}$ (House Edge: **14.36%**).

### 4.14. Video Poker
- **Mechanics**: Standard 52-card single deck. Deal 5 cards $\to$ Hold 0 to 5 cards $\to$ Draw replacements from remaining 47 cards $\to$ Evaluate final 5-card poker rank.
- **Paytable**: Full Pay 9/6 Jacks or Better:
  - Royal Flush: $800\times$
  - Straight Flush: $50\times$
  - Four of a Kind: $25\times$
  - Full House: $9\times$
  - Flush: $6\times$
  - Straight: $4\times$
  - Three of a Kind: $3\times$
  - Two Pair: $2\times$
  - Jacks or Better: $1\times$
  - Nothing: $0\times$
- **Theoretical RTP**:
  - Optimal Play Strategy: **99.5439%** (House Edge: **0.4561%**).
  - Random Hold (Baseline): ~**82.50%**.

### 4.15. Keno
- **Mechanics**: Grid of 40 numbers. House draws 10 numbers without replacement. Player selects $P \in [1, 10]$ numbers.
- **Probability Model**: Hypergeometric distribution:
  $$P(k \text{ matches} \mid P) = \frac{\binom{P}{k} \binom{40-P}{10-k}}{\binom{40}{10}}$$
- **Current Paytable & Theoretical RTP**:
  - Pick 1: Match 1 pays $3.96\times \implies \text{RTP} = \mathbf{99.00\%}$ (House Edge: $1.00\%$).
  - Pick 2: Match 1 pays $1\times$, Match 2 pays $9\times \implies \text{RTP} = \mathbf{90.38\%}$ (House Edge: $9.62\%$).
  - Pick 3: Match 2 pays $2\times$, Match 3 pays $26\times \implies \text{RTP} = \mathbf{58.91\%}$ (House Edge: $41.09\%$).
  - Pick 4: Matches: 2:1x, 3:6x, 4:72x $\implies \text{RTP} = \mathbf{61.60\%}$ (House Edge: $38.40\%$).
  - Pick 5: Matches: 3:3x, 4:12x, 5:200x $\implies \text{RTP} = \mathbf{42.95\%}$ (House Edge: $57.05\%$).
  - Pick 6: Matches: 3:1.5x, 4:5x, 5:50x, 6:500x $\implies \text{RTP} = \mathbf{43.52\%}$ (House Edge: $56.48\%$).
  - Pick 7: Matches: 3:1x, 4:3x, 5:12x, 6:100x, 7:1500x $\implies \text{RTP} = \mathbf{42.76\%}$ (House Edge: $57.24\%$).
  - Pick 8: Matches: 4:2x, 5:6x, 6:30x, 7:300x, 8:5000x $\implies \text{RTP} = \mathbf{28.21\%}$ (House Edge: $71.79\%$).
  - Pick 9: Matches: 4:1x, 5:4x, 6:12x, 7:80x, 8:1000x, 9:10000x $\implies \text{RTP} = \mathbf{26.85\%}$ (House Edge: $73.15\%$).
  - Pick 10: Matches: 5:2x, 6:6x, 7:30x, 8:200x, 9:3000x, 10:50000x $\implies \text{RTP} = \mathbf{14.84\%}$ (House Edge: **85.16%**!).
- **Stake.com Benchmark**: Stake Originals maintains $99.00\%$ RTP across all 10 picks by scaling intermediate matches properly.

---

## 5. Headless Monte Carlo Simulation Harness Architecture

To verify win ratios, RTP, and house edge empirically, a headless simulation harness must execute $\ge 100,000$ iterations per game configuration without relying on DOM, canvas, or React components.

```
+-----------------------------------------------------------------------------------+
|                        HEADLESS MONTE CARLO HARNESS CORE                          |
|                                                                                   |
|  +--------------------+     +------------------------+     +-------------------+  |
|  | CLI Orchestrator   | --> | Config Matrix Loader   | --> | Worker Pool (xN)  |  |
|  | (cli_sim.js)       |     | (All 15 Titles/Modes)  |     | (Node Workers)    |  |
|  +--------------------+     +------------------------+     +-------------------+  |
|                                                                      |            |
|                                            +-------------------------+            |
|                                            v                                      |
|                             +------------------------------+                      |
|                             | Pure Game Simulation Models  |                      |
|                             | (Headless JS Engines)        |                      |
|                             | - CrashEngine.js             |                      |
|                             | - PlinkoEngine.js            |                      |
|                             | - RouletteEngine.js          |                      |
|                             | - BlackjackEngine.js         |                      |
|                             | - VideoPokerEngine.js        |                      |
|                             +------------------------------+                      |
|                                            |                                      |
|                                            v                                      |
|                             +------------------------------+                      |
|                             | Streaming Online Aggregator  |                      |
|                             | (Welford's Algorithm: Mean,  |                      |
|                             | Variance, Standard Error)    |                      |
|                             +------------------------------+                      |
|                                            |                                      |
|                                            v                                      |
|                             +------------------------------+                      |
|                             | Formatted JSON / Table Output|                      |
|                             | (Total, Payout, RTP, SE, CI) |                      |
|                             +------------------------------+                      |
+-----------------------------------------------------------------------------------+
```

### 5.1. Core Architectural Requirements
1. **Zero DOM / Canvas Coupling**:
   Extract all game evaluation logic into pure JavaScript functions decoupled from PIXI, Canvas2D, Framer Motion, and React hooks.
2. **Online Streaming Statistics (Welford's Algorithm)**:
   Avoid storing $100,000+$ round objects in memory to prevent OOM errors. Maintain running sums, running square sums, and online variance:
   $$M_k = M_{k-1} + \frac{x_k - M_{k-1}}{k}, \quad S_k = S_{k-1} + (x_k - M_{k-1})(x_k - M_k)$$
   $$\sigma^2 = \frac{S_n}{n - 1}, \quad \text{Standard Error (SE)} = \frac{\sigma}{\sqrt{n}}$$
   $$95\% \text{ Confidence Interval} = \left[\text{RTP} - 1.96 \cdot \text{SE}, \; \text{RTP} + 1.96 \cdot \text{SE}\right]$$
3. **Reproducible PRNG**:
   Utilize high-speed, cryptographically uniform pseudo-random generation (e.g., PCG32 or Xoroshiro128+ with explicit seed initializers) to allow exact reproducibility of runs.

### 5.2. Simulation Configurations to Execute

| Game | Configurations to Execute | Rounds per Config | Total Rounds |
|---|---|---|---|
| **Crash** | Auto-cashout targets: 1.50x, 2.00x, 5.00x, 10.00x, 30.00x | 100,000 | 500,000 |
| **Dice** | Over/Under at targets: 10, 25, 50, 75, 90, 98 (12 configs) | 100,000 | 1,200,000 |
| **Mines** | Mines count 1, 3, 5, 10, 20 at picks 1, 3, 5, max safe | 100,000 | 1,500,000 |
| **Limbo** | Target multipliers: 1.1x, 1.5x, 2.0x, 10x, 100x, 1000x | 100,000 | 600,000 |
| **Plinko** | All 9 combinations (8, 12, 16 rows $\times$ Low, Med, High) | 100,000 | 900,000 |
| **Color Trading** | Bet on Green, Red, Violet, Number 0, Number 5, Number 7 | 100,000 | 600,000 |
| **Tower** | Easy, Medium, Hard at Cashout Floors 1, 3, 5, 10 (12 configs) | 100,000 | 1,200,000 |
| **Hi-Lo** | 1-Guess Cashout, 2-Guess Cashout, 3-Guess Cashout | 100,000 | 300,000 |
| **Wheel** | All 15 combinations (10, 20, 30, 40, 50 seg $\times$ Low, Med, High)| 100,000 | 1,500,000 |
| **Roulette** | Straight (17, 0), Split, Street, Corner, Line, Dozen, Red, Even | 100,000 | 800,000 |
| **Slots** | 20 Paylines 5x3 reel matrix evaluation | 100,000 | 100,000 |
| **Blackjack** | 4-Deck S17 Optimal Basic Strategy Matrix | 100,000 | 100,000 |
| **Baccarat** | Player Bet, Banker Bet, Tie Bet | 100,000 | 300,000 |
| **Video Poker** | 9/6 Jacks or Better Optimal Hold Matrix (32 hand evaluations) | 100,000 | 100,000 |
| **Keno** | Picks 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (40 balls, 10 drawn) | 100,000 | 1,000,000 |
| **TOTAL** | **Comprehensive Library Suite** | - | **> 10,700,000 Rounds** |

---

## 6. Market Comparison Benchmark (Stake, Roobet, BC.Game)

| Game Title | Metric | Stake.com Originals | Roobet | BC.Game | Crypto Casino (Current Code) | Crypto Casino (Target / Remediated) |
|---|---|---|---|---|---|---|
| **Crash** | RTP (%) | 99.00% | 98.00% - 99.00% | 99.00% | **96.97%** (Capped at 32.67x) | **99.00%** |
| | House Edge | 1.00% | 1.00% - 2.00% | 1.00% | **3.03%** (Capped) | **1.00%** |
| | Max Payout | 1,000,000x | Uncapped | 1,000,000x | **32.67x** (Severe Bug) | **1,000,000x** |
| **Dice** | RTP (%) | 99.00% | 99.00% | 99.00% | **99.00%** | **99.00%** |
| | House Edge | 1.00% | 1.00% | 1.00% | **1.00%** | **1.00%** |
| | Max Payout | 9,900x | 9,900x | 9,900x | **49.50x** | **9,900x** |
| **Mines** | RTP (%) | 99.00% | 99.00% | 99.00% | **98.40% - 99.00%** | **99.00%** |
| | House Edge | 1.00% | 1.00% | 1.00% | **1.00% - 1.60%** | **1.00%** |
| | Max Payout | 5,148,297x | 5,000,000x | 5,148,297x | **3,236,072x** | **5,148,297x** |
| **Limbo** | RTP (%) | 99.00% | N/A | 99.00% | **99.00%** | **99.00%** |
| | House Edge | 1.00% | N/A | 1.00% | **1.00%** | **1.00%** |
| | Max Payout | 1,000,000x | N/A | 1,000,000x | **Uncapped** | **1,000,000x** |
| **Plinko** | RTP (%) | 99.00% | 98.00% - 99.00% | 99.00% | **98.90% - 99.12%** | **99.00%** |
| | House Edge | 1.00% | 1.00% - 2.00% | 1.00% | **0.88% - 1.10%** | **1.00%** |
| | Max Payout | 1,000x | 1,000x | 1,000x | **1,000x** | **1,000x** |
| **Color Trading** | RTP (%) | N/A | N/A | N/A | **90.00% - 100.00%** | **98.00%** (Calibrated) |
| | House Edge | N/A | N/A | N/A | **0.00% - 10.00%** | **2.00%** |
| | Max Payout | N/A | N/A | N/A | **9.00x** | **9.00x** |
| **Tower** | RTP (%) | 98.00% - 99.00% | 98.00% | 98.00% | **97.50% - 98.00%** | **98.00%** |
| | House Edge | 1.00% - 2.00% | 2.00% | 2.00% | **2.00% - 2.50%** | **2.00%** |
| | Max Payout | 1,000x+ | 800x | 1,000x | **1,003.52x** | **1,000x** |
| **Hi-Lo** | RTP (%) | 99.00% | N/A | 99.00% | **99.00%** | **99.00%** |
| | House Edge | 1.00% | N/A | 1.00% | **1.00%** | **1.00%** |
| | Features | Skip card | N/A | Skip card | No skip | Add skip option |
| **Wheel** | RTP (%) | 99.00% | N/A | 99.00% | **90.0% - 121.67%** (Broken) | **99.00%** |
| | House Edge | 1.00% | N/A | 1.00% | **-21.67% to +10%** | **1.00%** |
| | Max Payout | 49.5x | N/A | 50.0x | **49.5x** | **49.5x** |
| **Roulette** | RTP (%) | 97.30% | 97.30% | 97.30% | **97.30%** | **97.30%** |
| | House Edge | 2.70% | 2.70% | 2.70% | **2.70%** | **2.70%** |
| | Rules | European (Single 0) | European | European | European | European |
| **Slots** | RTP (%) | 97.00% - 97.50% | 96.50% | 97.00% | **677.00%** (Broken line bet) | **96.50%** |
| | House Edge | 2.50% - 3.00% | 3.50% | 3.00% | **-577.00%** | **3.50%** |
| | Mechanics | Weighted Reels | Reels | Reels | Uniform $1/8$ Random | Weighted Reels |
| **Blackjack** | RTP (%) | 99.50% | 99.40% | 99.40% | **~99.12% - 99.40%** | **99.50%** |
| | House Edge | 0.50% | 0.60% | 0.60% | **0.60% - 0.88%** | **0.50%** |
| | Rules | S17, Double, Split | S17, Double | S17, Double | S17, Double, No Split | S17, Double, Split |
| **Baccarat** | RTP (%) | P: 98.76%, B: 98.94% | P: 98.76%, B: 98.94% | P: 98.76%, B: 98.94% | P: 98.76%, B: 98.94% | P: 98.76%, B: 98.94% |
| | House Edge | P: 1.24%, B: 1.06% | P: 1.24%, B: 1.06% | P: 1.24%, B: 1.06% | P: 1.24%, B: 1.06% | P: 1.24%, B: 1.06% |
| | Tie Payout | 8:1 (14.36% HE) | 8:1 | 8:1 | 8:1 (14.36% HE) | 8:1 |
| **Video Poker**| RTP (%) | 99.54% | N/A | 99.54% | **99.54%** | **99.54%** |
| | House Edge | 0.46% | N/A | 0.46% | **0.46%** | **0.46%** |
| | Paytable | 9/6 Jacks or Better | N/A | 9/6 Jacks or Better | 9/6 Jacks or Better | 9/6 Jacks or Better |
| **Keno** | RTP (%) | 99.00% (Flat across picks)| N/A | 99.00% | **14.84% - 99.00%** (Stubbed) | **99.00%** (Flat) |
| | House Edge | 1.00% | N/A | 1.00% | **1.00% - 85.16%** | **1.00%** |
| | Grid | 40 balls, 10 drawn | N/A | 40 balls, 10 drawn | 40 balls, 10 drawn | 40 balls, 10 drawn |

---

## 7. Actionable Recommendations for Technical Remediation

1. **Fix Bustabit Crash Formula**:
   Update `src/utils/provablyFair.js` so that:
   - True HMAC-SHA256 is computed using Web Crypto API.
   - Crash point generation uses the canonical formula:
     ```javascript
     const h = floats[0];
     // 1% instant bust
     if (h < 0.01) return 1.00;
     return Math.max(1.00, Math.floor((0.99 / h) * 100) / 100);
     ```
   - This eliminates the $32.67\times$ artificial cap and matches the $99.00\%$ RTP / $1.00\%$ House Edge standard.
2. **Rebalance Wheel Payout Matrices**:
   Replace the segment multiplier arrays in `src/utils/constants.js` so that the average segment value for every risk tier across 10, 20, 30, 40, and 50 segments equals exactly $0.9900$, giving an identical $99.00\%$ RTP regardless of segment count.
3. **Correct Slots Payline Betting Allocation**:
   In `src/games/SlotsGame.jsx`, evaluate line payouts as:
   `const winAmount = (betAmount / PAYLINES.length) * multiplier;`
   and adjust paytable symbols with weighted reel strips to target $96.50\%$ - $97.00\%$ overall RTP.
4. **Implement Full Keno Game & Calibrate Paytable**:
   Replace the `<ComingSoon/>` component in `src/App.jsx` with a complete `KenoGame.jsx` implementation utilizing the provably fair Fisher-Yates generator. Update `KENO_PAYOUTS` to ensure all picks (1 through 10) have a theoretical RTP of $99.00\%$.
5. **Enforce Centralized Balance Management**:
   Ensure `DiceGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `ColorTradingGame.jsx`, and `WheelGame.jsx` uniformly call `subtractFromBalance`, `addToBalance`, and `addHistoryEntry` from `src/utils/balance.js`.

---

*Report authored by teamwork_preview_spec_miner_survey_3.*
