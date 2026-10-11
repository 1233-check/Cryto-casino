import { auth } from '../firebase';
import { addToBalance, subtractFromBalance, addHistoryEntry } from './balance';

/**
 * Executes a bet through the authoritative backend engine if available,
 * with seamless fallback to client-side provably fair math.
 */
export async function placeAuthoritativeBet({ game, betAmount, params = {} }) {
  if (betAmount <= 0) throw new Error('Invalid bet amount');

  let token = null;
  try {
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    } else {
      const cached = localStorage.getItem('cryptobet_cached_user');
      if (cached) {
        const u = JSON.parse(cached);
        token = u.id || u.uid || 'guest_player';
      }
    }
  } catch {
    token = 'guest_player';
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    if (token) {
      const response = await fetch(`${apiUrl}/api/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          game,
          betAmount,
          ...params
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    }
  } catch (err) {
    // Backend offline or unreachable, return null to signal client fallback
    console.warn(`[Bet Engine] Backend offline, executing local provably fair engine for ${game}`);
  }

  return null;
}
