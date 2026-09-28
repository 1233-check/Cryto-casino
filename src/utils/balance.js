// Balance manager with localStorage persistence
const BALANCE_KEY = 'cryptobet_balance';
const HISTORY_KEY = 'cryptobet_history';
const DEFAULT_BALANCE = 1.00000000;

export function getBalance() {
  const stored = localStorage.getItem(BALANCE_KEY);
  return stored ? parseFloat(stored) : DEFAULT_BALANCE;
}

export function setBalance(amount) {
  const clamped = Math.max(0, parseFloat(amount.toFixed(8)));
  localStorage.setItem(BALANCE_KEY, clamped.toString());
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
  const history = getHistory();
  history.unshift({ ...entry, timestamp: Date.now() });
  if (history.length > 100) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
