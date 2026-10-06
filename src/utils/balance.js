// Balance manager with localStorage persistence
const BALANCE_KEY = 'cryptobet_balance';
const HISTORY_KEY = 'cryptobet_history';
const DEFAULT_BALANCE = 1.00000000;

function dispatchBalanceUpdate(balance) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      const event = typeof CustomEvent === 'function'
        ? new CustomEvent('balance-update', { detail: { balance } })
        : { type: 'balance-update', detail: { balance } };
      window.dispatchEvent(event);
    } catch {
      // Ignore if event dispatch fails in restricted environments
    }
  }
}

export function getBalance() {
  const stored = localStorage.getItem(BALANCE_KEY);
  return stored ? parseFloat(stored) : DEFAULT_BALANCE;
}

export function setBalance(amount) {
  const clamped = Math.max(0, parseFloat(amount.toFixed(8)));
  localStorage.setItem(BALANCE_KEY, clamped.toString());
  dispatchBalanceUpdate(clamped);
  return clamped;
}

export function addToBalance(amount) {
  return setBalance(getBalance() + amount);
}

export function subtractFromBalance(amount) {
  const current = getBalance();
  if (amount > current) return null; // insufficient
  return setBalance(current - amount);
}

export function resetBalance() {
  return setBalance(DEFAULT_BALANCE);
}

// Bet history
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function addHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const history = getHistory();
  const bet = typeof entry.bet === 'number' ? parseFloat(entry.bet.toFixed(8)) : (parseFloat(entry.bet) || 0);
  const payout = typeof entry.payout === 'number' ? parseFloat(entry.payout.toFixed(8)) : (parseFloat(entry.payout) || 0);
  const profit = entry.profit !== undefined && !isNaN(entry.profit)
    ? parseFloat(Number(entry.profit).toFixed(8))
    : parseFloat((payout - bet).toFixed(8));

  const formattedEntry = {
    ...entry,
    bet,
    payout,
    profit,
    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now()
  };

  history.unshift(formattedEntry);
  if (history.length > 100) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return formattedEntry;
}
