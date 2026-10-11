import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const CURRENCIES = {
  USDT: {
    symbol: 'USDT',
    icon: '$',
    prefix: '$',
    name: 'Tether USD',
    decimals: 2,
    defaultBalance: 1000.00,
    rateUsd: 1.00,
    color: '#26A17B',
    chips: [1, 5, 25, 100],
    defaultBet: 10.00,
    minBet: 0.10,
    step: 1.00
  },
  BTC: {
    symbol: 'BTC',
    icon: '₿',
    prefix: '₿',
    name: 'Bitcoin',
    decimals: 8,
    defaultBalance: 1.00000000,
    rateUsd: 65000,
    color: '#F7931A',
    chips: [0.0001, 0.001, 0.01, 0.1],
    defaultBet: 0.001,
    minBet: 0.00001,
    step: 0.0001
  },
  ETH: {
    symbol: 'ETH',
    icon: '⟠',
    prefix: 'Ξ',
    name: 'Ethereum',
    decimals: 6,
    defaultBalance: 5.000000,
    rateUsd: 3500,
    color: '#627EEA',
    chips: [0.005, 0.01, 0.05, 0.25],
    defaultBet: 0.01,
    minBet: 0.0005,
    step: 0.005
  },
  SOL: {
    symbol: 'SOL',
    icon: '◎',
    prefix: '◎',
    name: 'Solana',
    decimals: 4,
    defaultBalance: 50.0000,
    rateUsd: 150,
    color: '#9945FF',
    chips: [0.1, 0.5, 2, 10],
    defaultBet: 0.5,
    minBet: 0.01,
    step: 0.1
  },
  BNB: {
    symbol: 'BNB',
    icon: '◆',
    prefix: '◆',
    name: 'BNB Chain',
    decimals: 4,
    defaultBalance: 20.0000,
    rateUsd: 600,
    color: '#F0B90B',
    chips: [0.05, 0.1, 0.5, 2],
    defaultBet: 0.1,
    minBet: 0.005,
    step: 0.05
  }
};

const BALANCES_STORAGE_KEY = 'cryptobet_multi_balances';
const ACTIVE_CURRENCY_KEY = 'cryptobet_active_currency';
const HISTORY_KEY = 'cryptobet_history';

function getInitialBalances() {
  try {
    const saved = localStorage.getItem(BALANCES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        USDT: typeof parsed.USDT === 'number' ? parsed.USDT : CURRENCIES.USDT.defaultBalance,
        BTC: typeof parsed.BTC === 'number' ? parsed.BTC : CURRENCIES.BTC.defaultBalance,
        ETH: typeof parsed.ETH === 'number' ? parsed.ETH : CURRENCIES.ETH.defaultBalance,
        SOL: typeof parsed.SOL === 'number' ? parsed.SOL : CURRENCIES.SOL.defaultBalance,
        BNB: typeof parsed.BNB === 'number' ? parsed.BNB : CURRENCIES.BNB.defaultBalance,
      };
    }
  } catch {}

  return {
    USDT: CURRENCIES.USDT.defaultBalance,
    BTC: CURRENCIES.BTC.defaultBalance,
    ETH: CURRENCIES.ETH.defaultBalance,
    SOL: CURRENCIES.SOL.defaultBalance,
    BNB: CURRENCIES.BNB.defaultBalance,
  };
}

let activeCurrency = 'USDT';
try {
  const savedCur = localStorage.getItem(ACTIVE_CURRENCY_KEY);
  if (savedCur && CURRENCIES[savedCur]) {
    activeCurrency = savedCur;
  }
} catch {}

let currentBalances = getInitialBalances();

// Save balances to localStorage
function persistBalances() {
  try {
    localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(currentBalances));
  } catch {}
}

// Sync with Firestore if user is authenticated
auth.onAuthStateChanged((user) => {
  if (user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.balances && typeof data.balances === 'object') {
            let changed = false;
            Object.keys(CURRENCIES).forEach(curr => {
              if (typeof data.balances[curr] === 'number') {
                if (currentBalances[curr] !== data.balances[curr]) {
                  currentBalances[curr] = data.balances[curr];
                  changed = true;
                }
              }
            });
            if (changed) {
              persistBalances();
              dispatchBalanceUpdate();
            }
          } else {
            // First time login: seed default multi-balances into Firestore
            setDoc(userRef, { balances: currentBalances }, { merge: true }).catch(() => {});
          }
        } else {
          // Initialize doc for new user
          setDoc(userRef, { balances: currentBalances }, { merge: true }).catch(() => {});
        }
      }, (err) => {
        console.warn('Firestore balance listener notice:', err?.message || err);
      });
    } catch (e) {
      console.warn('Firestore subscription notice:', e);
    }
  }
});

function dispatchBalanceUpdate() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      const current = currentBalances[activeCurrency] || 0;
      const event = typeof CustomEvent === 'function'
        ? new CustomEvent('balance-update', { 
            detail: { 
              currency: activeCurrency, 
              balance: current, 
              balances: { ...currentBalances } 
            } 
          })
        : { type: 'balance-update', detail: { currency: activeCurrency, balance: current } };
      window.dispatchEvent(event);
    } catch {}
  }
}

export function getActiveCurrency() {
  return activeCurrency;
}

export function getCurrencyConfig(cur = activeCurrency) {
  return CURRENCIES[cur] || CURRENCIES.USDT;
}

export function setActiveCurrency(cur) {
  if (CURRENCIES[cur]) {
    activeCurrency = cur;
    try {
      localStorage.setItem(ACTIVE_CURRENCY_KEY, cur);
    } catch {}
    dispatchBalanceUpdate();
  }
  return activeCurrency;
}

export function getBalance(cur = activeCurrency) {
  return currentBalances[cur] !== undefined ? currentBalances[cur] : (currentBalances[activeCurrency] || 0);
}

export function getAllBalances() {
  return { ...currentBalances };
}

export function setBalance(amount, cur = activeCurrency) {
  const targetCur = CURRENCIES[cur] ? cur : activeCurrency;
  const decimals = CURRENCIES[targetCur]?.decimals || 8;
  const clamped = Math.max(0, parseFloat(Number(amount).toFixed(decimals)));
  currentBalances[targetCur] = clamped;
  persistBalances();
  dispatchBalanceUpdate();

  // Seamlessly sync to Firestore if authenticated
  if (auth && auth.currentUser) {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      setDoc(userRef, { 
        balances: { ...currentBalances },
        lastUpdated: Date.now()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore balance sync notice:', err?.message || err);
      });
    } catch {}
  }

  return clamped;
}

export function addToBalance(amount, cur = activeCurrency) {
  const targetCur = CURRENCIES[cur] ? cur : activeCurrency;
  const current = getBalance(targetCur);
  return setBalance(current + amount, targetCur);
}

export function subtractFromBalance(amount, cur = activeCurrency) {
  const targetCur = CURRENCIES[cur] ? cur : activeCurrency;
  const current = getBalance(targetCur);
  if (amount > current) return null; // Insufficient
  return setBalance(current - amount, targetCur);
}

export function resetBalance(cur = activeCurrency) {
  const targetCur = CURRENCIES[cur] ? cur : activeCurrency;
  return setBalance(CURRENCIES[targetCur].defaultBalance, targetCur);
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function addHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const history = getHistory();
  const cur = entry.currency || activeCurrency;
  const decimals = CURRENCIES[cur]?.decimals || 8;
  const bet = typeof entry.bet === 'number' ? parseFloat(entry.bet.toFixed(decimals)) : (parseFloat(entry.bet) || 0);
  const payout = typeof entry.payout === 'number' ? parseFloat(entry.payout.toFixed(decimals)) : (parseFloat(entry.payout) || 0);
  const profit = entry.profit !== undefined && !isNaN(entry.profit)
    ? parseFloat(Number(entry.profit).toFixed(decimals))
    : parseFloat((payout - bet).toFixed(decimals));

  const formattedEntry = {
    ...entry,
    currency: cur,
    bet,
    payout,
    profit,
    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now()
  };

  history.unshift(formattedEntry);
  if (history.length > 100) history.pop();
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
  return formattedEntry;
}
