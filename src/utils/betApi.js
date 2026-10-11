import { auth } from '../firebase';
import { setBalance, addHistoryEntry, getActiveCurrency } from './balance';

/**
 * Executes a bet through the authoritative backend engine if available,
 * with seamless fallback to client-side provably fair math.
 */
export async function placeAuthoritativeBet({ game, betAmount, params = {} }) {
  if (betAmount <= 0) throw new Error('Invalid bet amount');

  let token = 'guest_player';
  try {
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    } else {
      const cached = localStorage.getItem('cryptobet_cached_user');
      if (cached) {
        const u = JSON.parse(cached);
        token = u.id || u.uid || u.email || 'guest_player';
      } else {
        const wallet = localStorage.getItem('cryptobet_wallet_session');
        if (wallet) {
          const w = JSON.parse(wallet);
          token = w.address || 'wallet_guest';
        }
      }
    }
  } catch {
    token = 'guest_player';
  }

  const currency = params.currency || getActiveCurrency();
  const clientSeed = localStorage.getItem('cryptobet_client_seed') || 'provably_fair_client';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        game,
        betAmount,
        currency,
        clientSeed,
        ...params
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Synchronize client balance with authoritative server ledger
      if (typeof data.newBalance === 'number') {
        setBalance(data.newBalance, data.currency || currency);
      }
      return data;
    }
  } catch (err) {
    // Backend offline or network failure, return null to trigger client fallback
    console.warn(`[Bet Engine] Backend offline, executing local provably fair engine for ${game}:`, err.message);
  }

  return null;
}


