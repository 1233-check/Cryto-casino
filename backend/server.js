const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const cors = require('cors');
const crypto = require('crypto');

// Initialize Firebase Admin with service account
const serviceAccount = require('./serviceAccountKey.json');
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ═══════════════════════════════════════════════
// PROVABLY FAIR LOGIC (SERVER-SIDE)
// ═══════════════════════════════════════════════

function hmacSHA256(key, message) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

function getProvablyFairFloats(serverSeed, clientSeed, nonce, count = 1) {
  const floats = [];
  let cursor = 0;
  while (floats.length < count) {
    const hmacHex = hmacSHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    for (let i = 0; i < hmacHex.length && floats.length < count; i += 8) {
      const hex = hmacHex.substring(i, i + 8);
      const int = parseInt(hex, 16);
      floats.push(int / 0x100000000);
    }
    cursor++;
  }
  return floats;
}

function generateServerSeed() {
  return crypto.randomBytes(32).toString('hex');
}

function hashSeed(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function getCrashPoint(serverSeed, clientSeed, nonce) {
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const h = floats[0];
  if (h < 0.03) return 1.00;
  return Math.max(1.00, Math.floor((0.97 / (1 - h)) * 100) / 100);
}

function shuffleArray(array, serverSeed, clientSeed, nonce) {
  const arr = [...array];
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, arr.length);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ═══════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ═══════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ═══════════════════════════════════════════════
// USER ROUTES
// ═══════════════════════════════════════════════

app.get('/api/user/balance', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: userDoc.data().balance || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/history', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const snapshot = await db.collection('bets')
      .where('uid', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// UNIVERSAL BET ENDPOINT
// ═══════════════════════════════════════════════

app.post('/api/bet', verifyToken, async (req, res) => {
  const { game, betAmount, ...params } = req.body;
  const uid = req.user.uid;

  if (!betAmount || betAmount <= 0) return res.status(400).json({ error: 'Invalid bet amount' });
  if (!game) return res.status(400).json({ error: 'Game type required' });

  try {
    const userRef = db.collection('users').doc(uid);
    const serverSeed = generateServerSeed();
    const clientSeed = params.clientSeed || 'default';
    const nonce = Date.now();

    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const currentBalance = userDoc.data().balance || 0;
      if (currentBalance < betAmount) throw new Error('Insufficient balance');

      // Generate provably fair result
      let gameResult;
      
      switch (game) {
        case 'dice':
          gameResult = resolveDice(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'limbo':
          gameResult = resolveLimbo(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'mines':
          gameResult = resolveMines(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'plinko':
          gameResult = resolvePlinko(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'wheel':
          gameResult = resolveWheel(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'keno':
          gameResult = resolveKeno(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'tower':
          gameResult = resolveTower(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'hilo':
          gameResult = resolveHiLo(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'crash':
          gameResult = resolveCrash(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'roulette':
          gameResult = resolveRoulette(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'blackjack':
          gameResult = resolveBlackjack(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'baccarat':
          gameResult = resolveBaccarat(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'videopoker':
          gameResult = resolveVideoPoker(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'slots':
          gameResult = resolveSlots(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        case 'colortrading':
          gameResult = resolveColorTrading(serverSeed, clientSeed, nonce, betAmount, params);
          break;
        default:
          throw new Error('Unknown game type');
      }

      const newBalance = currentBalance - betAmount + gameResult.payout;
      transaction.update(userRef, { balance: Math.max(0, newBalance) });

      // Save bet record
      const historyRef = db.collection('bets').doc();
      transaction.set(historyRef, {
        uid,
        game,
        betAmount,
        payout: gameResult.payout,
        profit: gameResult.payout - betAmount,
        multiplier: gameResult.multiplier || 0,
        details: gameResult.details || {},
        serverSeedHash: hashSeed(serverSeed),
        timestamp: FieldValue.serverTimestamp()
      });

      return {
        ...gameResult,
        newBalance,
        serverSeedHash: hashSeed(serverSeed),
      };
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// GAME RESOLVERS
// ═══════════════════════════════════════════════

function resolveDice(serverSeed, clientSeed, nonce, betAmount, params) {
  const { target, condition } = params;
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const roll = parseFloat((floats[0] * 100).toFixed(2));
  const winChance = condition === 'over' ? 100 - target : target;
  const multiplier = 99 / winChance;
  const won = condition === 'over' ? roll > target : roll < target;
  const payout = won ? betAmount * multiplier : 0;
  return { roll, won, payout, multiplier: won ? multiplier : 0, details: { roll, target, condition, winChance } };
}

function resolveLimbo(serverSeed, clientSeed, nonce, betAmount, params) {
  const { targetMultiplier } = params;
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const h = floats[0];
  const result = Math.max(1.00, Math.floor((0.99 / (1 - h)) * 100) / 100);
  const won = result >= targetMultiplier;
  const payout = won ? betAmount * targetMultiplier : 0;
  return { result, won, payout, multiplier: won ? targetMultiplier : 0, details: { result, targetMultiplier } };
}

function resolveMines(serverSeed, clientSeed, nonce, betAmount, params) {
  const { minesCount, selectedTiles } = params;
  const positions = Array.from({ length: 25 }, (_, i) => i);
  const shuffled = shuffleArray(positions, serverSeed, clientSeed, nonce);
  const minePositions = shuffled.slice(0, minesCount);
  
  // Check if any selected tile is a mine
  let hitMine = false;
  for (const tile of (selectedTiles || [])) {
    if (minePositions.includes(tile)) {
      hitMine = true;
      break;
    }
  }

  const revealedSafe = hitMine ? 0 : (selectedTiles || []).length;
  const totalSafe = 25 - minesCount;
  
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let res = 1;
    for (let i = 1; i <= k; i++) res = (res * (n - i + 1)) / i;
    return res;
  }
  
  const multiplier = revealedSafe > 0 ? Math.floor((0.99 * comb(25, revealedSafe)) / comb(totalSafe, revealedSafe) * 100) / 100 : 0;
  const payout = hitMine ? 0 : betAmount * multiplier;
  
  return { won: !hitMine, payout, multiplier: hitMine ? 0 : multiplier, minePositions, details: { minesCount, revealedSafe } };
}

function resolvePlinko(serverSeed, clientSeed, nonce, betAmount, params) {
  const { rows = 16, risk = 'medium' } = params;
  const MULTIPLIERS = {
    8:  { low: [5.2,2,1.1,0.7,0.4,0.7,1.1,2,5.2], medium: [12,2.8,1.1,0.5,0.3,0.5,1.1,2.8,12], high: [27,3.7,1.3,0.2,0.2,0.2,1.3,3.7,27] },
    12: { low: [9.5,2.8,1.5,1.2,0.8,0.5,0.3,0.5,0.8,1.2,1.5,2.8,9.5], medium: [30,10,3.5,1.5,0.7,0.3,0.2,0.3,0.7,1.5,3.5,10,30], high: [155,22,7.5,1.5,0.5,0.2,0.2,0.2,0.5,1.5,7.5,22,155] },
    16: { low: [15,8.5,1.8,1.2,1,0.7,0.5,0.3,0.2,0.3,0.5,0.7,1,1.2,1.8,8.5,15], medium: [100,38,9,4.5,2.5,1,0.4,0.2,0.2,0.2,0.4,1,2.5,4.5,9,38,100], high: [900,120,24,8,3.5,1.5,0.2,0.2,0.2,0.2,0.2,1.5,3.5,8,24,120,900] },
  };
  
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, rows);
  let position = 0;
  const path = [];
  for (let i = 0; i < rows; i++) {
    const direction = floats[i] < 0.5 ? 0 : 1;
    position += direction;
    path.push(direction);
  }
  
  const multipliers = MULTIPLIERS[rows]?.[risk] || MULTIPLIERS[16].medium;
  const multiplier = multipliers[position] || 0.2;
  const payout = betAmount * multiplier;
  
  return { position, path, payout, multiplier, won: multiplier >= 1, details: { rows, risk, position } };
}

function resolveWheel(serverSeed, clientSeed, nonce, betAmount, params) {
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const segments = [
    { color: 'gray', multiplier: 0, label: '0x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'green', multiplier: 2, label: '2x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'gray', multiplier: 0, label: '0x' },
    { color: 'purple', multiplier: 3, label: '3x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'gray', multiplier: 0, label: '0x' },
    { color: 'green', multiplier: 2, label: '2x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'gray', multiplier: 0, label: '0x' },
    { color: 'gold', multiplier: 5, label: '5x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'gray', multiplier: 0, label: '0x' },
    { color: 'green', multiplier: 2, label: '2x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'gray', multiplier: 0, label: '0x' },
    { color: 'purple', multiplier: 3, label: '3x' },
    { color: 'blue', multiplier: 1.5, label: '1.5x' },
    { color: 'gray', multiplier: 0, label: '0x' },
  ];
  
  const index = Math.floor(floats[0] * segments.length);
  const segment = segments[index];
  const payout = betAmount * segment.multiplier;
  return { index, segment, payout, multiplier: segment.multiplier, won: segment.multiplier > 0, details: { index, segment } };
}

function resolveKeno(serverSeed, clientSeed, nonce, betAmount, params) {
  const { selectedNumbers = [] } = params;
  const positions = Array.from({ length: 40 }, (_, i) => i + 1);
  const shuffled = shuffleArray(positions, serverSeed, clientSeed, nonce);
  const drawnNumbers = shuffled.slice(0, 10);
  
  const hits = selectedNumbers.filter(n => drawnNumbers.includes(n));
  
  const PAYOUTS = {
    1: { 1: 3.96 },
    2: { 1: 1, 2: 9 },
    3: { 1: 0, 2: 2, 3: 26 },
    4: { 1: 0, 2: 1, 3: 4, 4: 70 },
    5: { 1: 0, 2: 0, 3: 2, 4: 12, 5: 300 },
    6: { 1: 0, 2: 0, 3: 1, 4: 5, 5: 70, 6: 1000 },
    7: { 1: 0, 2: 0, 3: 0, 4: 3, 5: 15, 6: 200, 7: 3000 },
    8: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 8, 6: 50, 7: 500, 8: 10000 },
    9: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 4, 6: 20, 7: 100, 8: 2000, 9: 25000 },
    10: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 10, 7: 50, 8: 500, 9: 5000, 10: 100000 },
  };
  
  const picks = selectedNumbers.length;
  const multiplier = (PAYOUTS[picks] && PAYOUTS[picks][hits.length]) || 0;
  const payout = betAmount * multiplier;
  
  return { drawnNumbers, hits, payout, multiplier, won: multiplier > 0, details: { picks, hits: hits.length, drawnNumbers } };
}

function resolveTower(serverSeed, clientSeed, nonce, betAmount, params) {
  const { difficulty = 'easy', selectedPath = [] } = params;
  const configs = { easy: { cols: 4, safe: 3 }, medium: { cols: 3, safe: 2 }, hard: { cols: 2, safe: 1 }, expert: { cols: 3, safe: 1 }, master: { cols: 4, safe: 1 } };
  const config = configs[difficulty] || configs.easy;
  const totalRows = 8;
  
  // Generate trap positions for each row
  const trapPositions = [];
  for (let row = 0; row < totalRows; row++) {
    const positions = Array.from({ length: config.cols }, (_, i) => i);
    const shuffled = shuffleArray(positions, serverSeed, clientSeed, nonce + row);
    trapPositions.push(shuffled.slice(config.safe)); // traps are the non-safe ones
  }
  
  let survived = true;
  let clearedRows = 0;
  for (const sel of selectedPath) {
    if (trapPositions[clearedRows]?.includes(sel)) {
      survived = false;
      break;
    }
    clearedRows++;
  }
  
  const multiplier = survived && clearedRows > 0 ? Math.pow(config.cols / config.safe, clearedRows) * 0.97 : 0;
  const payout = survived ? betAmount * multiplier : 0;
  
  return { survived, clearedRows, trapPositions, payout, multiplier, won: survived && clearedRows > 0, details: { difficulty, clearedRows } };
}

function resolveHiLo(serverSeed, clientSeed, nonce, betAmount, params) {
  const { guess, currentCard } = params; // guess: 'higher' | 'lower'
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const nextCard = Math.floor(floats[0] * 13) + 1; // 1-13 (Ace to King)
  
  let won = false;
  if (guess === 'higher') won = nextCard > currentCard;
  else if (guess === 'lower') won = nextCard < currentCard;
  else won = nextCard === currentCard;
  
  const multiplier = won ? 1.96 : 0;
  const payout = won ? betAmount * multiplier : 0;
  
  return { nextCard, won, payout, multiplier, details: { currentCard, nextCard, guess } };
}

function resolveCrash(serverSeed, clientSeed, nonce, betAmount, params) {
  const { cashoutAt = 2.0 } = params;
  const crashPoint = getCrashPoint(serverSeed, clientSeed, nonce);
  const won = cashoutAt <= crashPoint;
  const payout = won ? betAmount * cashoutAt : 0;
  return { crashPoint, won, payout, multiplier: won ? cashoutAt : 0, details: { crashPoint, cashoutAt } };
}

function resolveRoulette(serverSeed, clientSeed, nonce, betAmount, params) {
  const { betType, betValue } = params;
  const ROULETTE_SEQUENCE = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const index = Math.floor(floats[0] * 37);
  const number = ROULETTE_SEQUENCE[index];
  
  let won = false;
  let multiplier = 0;
  
  if (betType === 'number' && betValue === number) { won = true; multiplier = 36; }
  else if (betType === 'red' && RED.has(number)) { won = true; multiplier = 2; }
  else if (betType === 'black' && !RED.has(number) && number !== 0) { won = true; multiplier = 2; }
  else if (betType === 'even' && number !== 0 && number % 2 === 0) { won = true; multiplier = 2; }
  else if (betType === 'odd' && number % 2 === 1) { won = true; multiplier = 2; }
  else if (betType === '1-18' && number >= 1 && number <= 18) { won = true; multiplier = 2; }
  else if (betType === '19-36' && number >= 19 && number <= 36) { won = true; multiplier = 2; }
  
  const payout = won ? betAmount * multiplier : 0;
  return { number, won, payout, multiplier: won ? multiplier : 0, details: { number, betType, betValue } };
}

function resolveBlackjack(serverSeed, clientSeed, nonce, betAmount, params) {
  // Simplified: generate a result float and determine win/push/loss
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const roll = floats[0];
  
  // ~42.5% player wins, ~8% push, ~49.5% dealer wins (standard BJ stats)
  let won, multiplier;
  if (roll < 0.425) { won = true; multiplier = 2; }
  else if (roll < 0.505) { won = true; multiplier = 1; } // push
  else { won = false; multiplier = 0; }
  
  const payout = betAmount * multiplier;
  return { won, payout, multiplier, details: { result: roll < 0.425 ? 'win' : roll < 0.505 ? 'push' : 'loss' } };
}

function resolveBaccarat(serverSeed, clientSeed, nonce, betAmount, params) {
  const { betSide = 'player' } = params; // 'player' | 'banker' | 'tie'
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const roll = floats[0];
  
  // Standard probabilities: Player 44.62%, Banker 45.85%, Tie 9.53%
  let result;
  if (roll < 0.4462) result = 'player';
  else if (roll < 0.9047) result = 'banker';
  else result = 'tie';
  
  let won = false, multiplier = 0;
  if (betSide === result) {
    won = true;
    if (result === 'player') multiplier = 2;
    else if (result === 'banker') multiplier = 1.95; // 5% commission
    else multiplier = 9;
  }
  
  const payout = won ? betAmount * multiplier : 0;
  return { result, won, payout, multiplier: won ? multiplier : 0, details: { result, betSide } };
}

function resolveVideoPoker(serverSeed, clientSeed, nonce, betAmount, params) {
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const roll = floats[0];
  
  // Simplified video poker outcome distribution (Jacks or Better paytable)
  let hand, multiplier;
  if (roll < 0.0025) { hand = 'Royal Flush'; multiplier = 800; }
  else if (roll < 0.0039) { hand = 'Straight Flush'; multiplier = 50; }
  else if (roll < 0.0063) { hand = '4 of a Kind'; multiplier = 25; }
  else if (roll < 0.0178) { hand = 'Full House'; multiplier = 9; }
  else if (roll < 0.0289) { hand = 'Flush'; multiplier = 6; }
  else if (roll < 0.0405) { hand = 'Straight'; multiplier = 4; }
  else if (roll < 0.1153) { hand = '3 of a Kind'; multiplier = 3; }
  else if (roll < 0.2448) { hand = 'Two Pair'; multiplier = 2; }
  else if (roll < 0.4628) { hand = 'Jacks or Better'; multiplier = 1; }
  else { hand = 'Nothing'; multiplier = 0; }
  
  const payout = betAmount * multiplier;
  return { hand, won: multiplier > 0, payout, multiplier, details: { hand } };
}

function resolveSlots(serverSeed, clientSeed, nonce, betAmount, params) {
  const SYMBOLS = ['💎','7️⃣','🔔','⭐','🍇','🍊','🍋','🍒'];
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 15); // 5 reels x 3 rows
  
  const reels = [];
  for (let i = 0; i < 5; i++) {
    const reel = [];
    for (let j = 0; j < 3; j++) {
      reel.push(SYMBOLS[Math.floor(floats[i * 3 + j] * SYMBOLS.length)]);
    }
    reels.push(reel);
  }
  
  // Check middle row for matches
  const middleRow = reels.map(r => r[1]);
  let matchCount = 1;
  for (let i = 1; i < middleRow.length; i++) {
    if (middleRow[i] === middleRow[0]) matchCount++;
    else break;
  }
  
  const PAYOUTS = { '💎': { 3: 50, 4: 200, 5: 1000 }, '7️⃣': { 3: 25, 4: 100, 5: 500 }, '🔔': { 3: 15, 4: 50, 5: 200 }, '⭐': { 3: 10, 4: 30, 5: 100 }, '🍇': { 3: 5, 4: 15, 5: 50 }, '🍊': { 3: 3, 4: 10, 5: 30 }, '🍋': { 3: 2, 4: 5, 5: 20 }, '🍒': { 3: 2, 4: 5, 5: 15 } };
  
  const multiplier = matchCount >= 3 ? (PAYOUTS[middleRow[0]]?.[matchCount] || 0) : 0;
  const lineBet = betAmount / 20;
  const payout = lineBet * multiplier;
  
  return { reels, middleRow, won: multiplier > 0, payout, multiplier, details: { reels, matchCount, symbol: middleRow[0] } };
}

function resolveColorTrading(serverSeed, clientSeed, nonce, betAmount, params) {
  const { color } = params; // 'green' | 'red' | 'violet'
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const roll = Math.floor(floats[0] * 10); // 0-9
  
  let resultColor;
  if (roll === 0) resultColor = 'violet-green'; // 0 is special
  else if (roll === 5) resultColor = 'violet-red'; // 5 is special
  else if (roll % 2 === 0) resultColor = 'green';
  else resultColor = 'red';
  
  let won = false, multiplier = 0;
  if (color === 'green' && (resultColor === 'green' || resultColor === 'violet-green')) { won = true; multiplier = resultColor === 'violet-green' ? 1.5 : 2; }
  else if (color === 'red' && (resultColor === 'red' || resultColor === 'violet-red')) { won = true; multiplier = resultColor === 'violet-red' ? 1.5 : 2; }
  else if (color === 'violet' && (resultColor === 'violet-green' || resultColor === 'violet-red')) { won = true; multiplier = 4.5; }
  
  const payout = won ? betAmount * multiplier : 0;
  return { roll, resultColor, won, payout, multiplier: won ? multiplier : 0, details: { roll, color, resultColor } };
}

// ═══════════════════════════════════════════════
// WITHDRAWAL ENDPOINT
// ═══════════════════════════════════════════════

app.post('/api/withdraw', verifyToken, async (req, res) => {
  const { chain, amount, toAddress } = req.body;
  const uid = req.user.uid;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!toAddress) return res.status(400).json({ error: 'Withdrawal address required' });
  if (!chain) return res.status(400).json({ error: 'Chain required' });
  if (amount < 0.001) return res.status(400).json({ error: 'Minimum withdrawal is 0.001' });

  try {
    const userRef = db.collection('users').doc(uid);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const currentBalance = userDoc.data().balance || 0;
      if (currentBalance < amount) throw new Error('Insufficient balance');

      // Deduct balance
      transaction.update(userRef, { balance: currentBalance - amount });

      // Log withdrawal request
      const withdrawRef = db.collection('withdrawals').doc();
      transaction.set(withdrawRef, {
        uid,
        chain,
        amount,
        toAddress,
        status: 'pending',
        timestamp: FieldValue.serverTimestamp()
      });
    });

    // In production, you would process the actual on-chain transfer here
    // using ethers.js or @solana/web3.js with your hot wallet
    res.json({ 
      success: true, 
      message: 'Withdrawal request submitted',
      txHash: `pending_${Date.now()}` 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// DEPOSIT CONFIRMATION WEBHOOK
// ═══════════════════════════════════════════════

app.post('/api/deposit/confirm', verifyToken, async (req, res) => {
  const { chain, amount, txHash } = req.body;
  const uid = req.user.uid;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!txHash) return res.status(400).json({ error: 'Transaction hash required' });

  try {
    // In production: Verify the transaction on-chain before crediting
    // For now, we trust the client-reported transaction
    const userRef = db.collection('users').doc(uid);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const currentBalance = userDoc.data().balance || 0;
      transaction.update(userRef, { balance: currentBalance + amount });

      // Log deposit
      const depositRef = db.collection('deposits').doc();
      transaction.set(depositRef, {
        uid,
        chain,
        amount,
        txHash,
        status: 'confirmed',
        timestamp: FieldValue.serverTimestamp()
      });
    });

    res.json({ success: true, message: 'Deposit credited' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// SOCKET.IO FOR CRASH GAME (REAL-TIME)
// ═══════════════════════════════════════════════

let crashState = {
  phase: 'WAITING', // WAITING -> RUNNING -> CRASHED
  multiplier: 1.0,
  crashPoint: 0,
  startTime: 0,
  waitUntil: 0,
  bets: new Map(),
};

function startCrashRound() {
  const serverSeed = generateServerSeed();
  const clientSeed = 'crash_global';
  const nonce = Date.now();
  
  crashState.crashPoint = getCrashPoint(serverSeed, clientSeed, nonce);
  crashState.phase = 'WAITING';
  crashState.multiplier = 1.0;
  crashState.bets = new Map();
  crashState.waitUntil = Date.now() + 5000;
  
  io.emit('crash:waiting', { waitUntil: crashState.waitUntil });
  
  setTimeout(() => {
    crashState.phase = 'RUNNING';
    crashState.startTime = Date.now();
    io.emit('crash:start');
    
    const tick = setInterval(() => {
      const elapsed = (Date.now() - crashState.startTime) / 1000;
      crashState.multiplier = Math.pow(Math.E, elapsed * 0.06);
      
      if (crashState.multiplier >= crashState.crashPoint) {
        clearInterval(tick);
        crashState.phase = 'CRASHED';
        crashState.multiplier = crashState.crashPoint;
        io.emit('crash:crashed', { multiplier: crashState.crashPoint });
        
        // Start next round after delay
        setTimeout(() => startCrashRound(), 3000);
      } else {
        io.emit('crash:tick', { multiplier: parseFloat(crashState.multiplier.toFixed(2)) });
      }
    }, 50);
  }, 5000);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current crash state
  socket.emit('crash:state', {
    phase: crashState.phase,
    multiplier: crashState.multiplier,
  });

  socket.on('crash:bet', async (data) => {
    const { token, amount } = data;
    if (crashState.phase !== 'WAITING') {
      return socket.emit('crash:error', { error: 'Bets only accepted during waiting phase' });
    }
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      crashState.bets.set(decodedToken.uid, { amount, cashedOut: false });
      socket.emit('crash:bet-accepted', { amount });
    } catch (err) {
      socket.emit('crash:error', { error: 'Authentication failed' });
    }
  });

  socket.on('crash:cashout', async (data) => {
    const { token } = data;
    if (crashState.phase !== 'RUNNING') return;
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const bet = crashState.bets.get(decodedToken.uid);
      if (!bet || bet.cashedOut) return;
      
      bet.cashedOut = true;
      const payout = bet.amount * crashState.multiplier;
      
      // Credit the user
      const userRef = db.collection('users').doc(decodedToken.uid);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return;
        const currentBalance = userDoc.data().balance || 0;
        transaction.update(userRef, { balance: currentBalance + payout });
      });
      
      socket.emit('crash:cashed-out', { multiplier: crashState.multiplier, payout });
    } catch (err) {
      socket.emit('crash:error', { error: 'Cashout failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the first crash round
startCrashRound();

// ═══════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎰 Crypto Casino Backend running on port ${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
});
