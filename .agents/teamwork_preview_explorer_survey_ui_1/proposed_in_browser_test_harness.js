/**
 * In-Browser Automated Route Sweep & Error Sniffer
 * 
 * Can be pasted directly into DevTools Console or injected via CDP.
 * Sequentially mounts all 15 casino games, verifies DOM & Canvas elements,
 * traps console errors and uncaught exceptions, and outputs a formatted summary table.
 */
(async function runInBrowserCasinoSurvey() {
  const GAMES = [
    { id: 'crash', name: 'Crash', requiresCanvas: true },
    { id: 'dice', name: 'Dice', requiresCanvas: false },
    { id: 'mines', name: 'Mines', requiresCanvas: false },
    { id: 'limbo', name: 'Limbo', requiresCanvas: false },
    { id: 'plinko', name: 'Plinko', requiresCanvas: true },
    { id: 'colortrading', name: 'Color Trading', requiresCanvas: false },
    { id: 'tower', name: 'Tower', requiresCanvas: false },
    { id: 'hilo', name: 'Hi-Lo', requiresCanvas: false },
    { id: 'keno', name: 'Keno', requiresCanvas: false },
    { id: 'wheel', name: 'Wheel', requiresCanvas: true },
    { id: 'roulette', name: 'Roulette', requiresCanvas: true },
    { id: 'slots', name: 'Slots', requiresCanvas: true },
    { id: 'blackjack', name: 'Blackjack', requiresCanvas: false },
    { id: 'baccarat', name: 'Baccarat', requiresCanvas: false },
    { id: 'videopoker', name: 'Video Poker', requiresCanvas: false },
  ];

  const interceptedErrors = [];
  const originalError = console.error;
  console.error = function (...args) {
    interceptedErrors.push(args.join(' '));
    originalError.apply(console, args);
  };

  const uncaughtHandler = (e) => interceptedErrors.push(`[Uncaught] ${e.message}`);
  window.addEventListener('error', uncaughtHandler);

  console.log('%c🎰 Starting Automated 15-Game Frontend Sweep...', 'color: #00E701; font-weight: bold; font-size: 14px;');
  const report = [];

  for (const game of GAMES) {
    const start = performance.now();
    const errorCountBefore = interceptedErrors.length;

    // Navigate
    if (window.__cryptoCasinoNavigate) {
      window.__cryptoCasinoNavigate(game.id);
    } else {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent && b.textContent.trim().toLowerCase().includes(game.name.toLowerCase())
      );
      if (btn) btn.click();
      else window.location.hash = `#${game.id}`;
    }

    // Allow React, PixiJS, Canvas, and Framer Motion to mount
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Verify DOM
    const canvases = document.querySelectorAll('canvas');
    const hasCanvas = canvases.length > 0;
    const betInputs = document.querySelectorAll('input[type="number"]');
    const hasBetControls = betInputs.length > 0;
    const errorsDuringRoute = interceptedErrors.length - errorCountBefore;
    const duration = Math.round(performance.now() - start);

    const passed = errorsDuringRoute === 0 && (!game.requiresCanvas || hasCanvas);

    report.push({
      Game: game.name,
      Route: `#${game.id}`,
      CanvasRequired: game.requiresCanvas,
      CanvasMounted: hasCanvas ? '✔ Yes' : (game.requiresCanvas ? '❌ No' : 'N/A'),
      BetControls: hasBetControls ? '✔ Yes' : '❌ No',
      Duration: `${duration}ms`,
      Errors: errorsDuringRoute,
      Status: passed ? 'PASS' : 'FAIL',
    });
  }

  // Return to home
  if (window.__cryptoCasinoNavigate) window.__cryptoCasinoNavigate('home');
  else window.location.hash = '#home';

  // Restore handlers
  console.error = originalError;
  window.removeEventListener('error', uncaughtHandler);

  console.log('%c📊 Automated 15-Game Survey Results:', 'color: #1475E1; font-weight: bold; font-size: 14px;');
  console.table(report);

  const allPassed = report.every((r) => r.Status === 'PASS') && interceptedErrors.length === 0;
  if (allPassed) {
    console.log('%c🎉 ALL 15 GAMES MOUNTED WITH 0 FATAL CONSOLE ERRORS!', 'color: #00E701; font-weight: bold;');
  } else {
    console.warn('%c⚠️ Issues detected during automated sweep. Intercepted errors:', 'color: #ED4163; font-weight: bold;', interceptedErrors);
  }

  window.__ROUTE_TEST_RESULTS__ = {
    timestamp: new Date().toISOString(),
    totalGames: GAMES.length,
    passedCount: report.filter((r) => r.Status === 'PASS').length,
    fatalErrors: interceptedErrors,
    report,
  };

  return window.__ROUTE_TEST_RESULTS__;
})();
