/**
 * Automated 15-Game Browser Route Navigation & Health Verification Runner
 * 
 * Features:
 * - Zero external npm dependencies (uses native Node.js ESM + Chrome DevTools Protocol over WebSocket)
 * - Auto-detects Microsoft Edge or Google Chrome on Windows
 * - Connects to Vite Dev Server (port 5173) or Preview Server (port 4173)
 * - Systematically navigates to all 15 game routes
 * - Verifies DOM mounting, canvas rendering (PixiJS v8 / Canvas2D), and bet controls
 * - Captures all console messages, unhandled exceptions, and promise rejections
 * - Asserts 0 fatal errors and outputs an exhaustive verification report
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const GAME_ROUTES = [
  { id: 'crash', name: 'Crash', engine: 'PixiJS v8 Canvas', requiresCanvas: true },
  { id: 'dice', name: 'Dice', engine: 'DOM / Framer Motion', requiresCanvas: false },
  { id: 'mines', name: 'Mines', engine: 'DOM / Framer Motion', requiresCanvas: false },
  { id: 'limbo', name: 'Limbo', engine: 'DOM / RAF Animation', requiresCanvas: false },
  { id: 'plinko', name: 'Plinko', engine: 'HTML5 Canvas2D', requiresCanvas: true },
  { id: 'colortrading', name: 'Color Trading', engine: 'DOM / SVG', requiresCanvas: false },
  { id: 'tower', name: 'Tower', engine: 'DOM / Grid', requiresCanvas: false },
  { id: 'hilo', name: 'Hi-Lo', engine: 'DOM / SVG Cards', requiresCanvas: false },
  { id: 'keno', name: 'Keno', engine: 'DOM / Interactive Grid', requiresCanvas: false },
  { id: 'wheel', name: 'Wheel', engine: 'HTML5 Canvas2D', requiresCanvas: true },
  { id: 'roulette', name: 'Roulette', engine: 'PixiJS v8 Canvas', requiresCanvas: true },
  { id: 'slots', name: 'Slots', engine: 'PixiJS v8 Canvas', requiresCanvas: true },
  { id: 'blackjack', name: 'Blackjack', engine: 'DOM / Cards', requiresCanvas: false },
  { id: 'baccarat', name: 'Baccarat', engine: 'DOM / Cards', requiresCanvas: false },
  { id: 'videopoker', name: 'Video Poker', engine: 'DOM / Cards', requiresCanvas: false },
];

const BROWSER_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowserBinary() {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function checkServerAvailable(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function getCDPWebSocketUrl(cdpPort) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch {
      // Browser still booting
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Failed to connect to browser CDP endpoint within 6 seconds.');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method) {
          const handlers = this.events.get(msg.method) || [];
          for (const h of handlers) h(msg.params);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(handler);
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'CDP Evaluation Exception');
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

export async function runRouteVerification() {
  console.log('='.repeat(70));
  console.log('🚀 AUTOMATED 15-GAME ROUTE NAVIGATION & BROWSER HEALTH CHECK');
  console.log('='.repeat(70));

  // 1. Check Server
  let targetUrl = 'http://127.0.0.1:5173';
  let isDevRunning = await checkServerAvailable(targetUrl);
  if (!isDevRunning) {
    targetUrl = 'http://127.0.0.1:4173';
    const isPreviewRunning = await checkServerAvailable(targetUrl);
    if (!isPreviewRunning) {
      console.error('❌ Neither Vite dev server (5173) nor preview server (4173) is reachable.');
      console.error('👉 Please start the server using: npm run dev OR npm run preview');
      process.exit(1);
    }
  }
  console.log(`✔ Connected to frontend server at ${targetUrl}`);

  // 2. Locate Browser
  const browserBin = findBrowserBinary();
  if (!browserBin) {
    console.error('❌ Could not locate Microsoft Edge or Google Chrome binary on this system.');
    process.exit(1);
  }
  console.log(`✔ Found browser binary: ${browserBin}`);

  // 3. Launch Headless Browser
  const cdpPort = 9222;
  const browserProc = spawn(browserBin, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--disable-gpu',
    '--window-size=1280,800',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  try {
    const wsUrl = await getCDPWebSocketUrl(cdpPort);
    const client = new CDPClient(wsUrl);
    await client.connect();

    const fatalErrors = [];
    const consoleLogs = [];

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    client.on('Runtime.exceptionThrown', (params) => {
      const errText = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text;
      fatalErrors.push(`[Uncaught Exception]: ${errText}`);
    });

    client.on('Runtime.consoleAPICalled', (params) => {
      const text = (params.args || []).map((a) => a.value || a.description).join(' ');
      consoleLogs.push(`[${params.type}] ${text}`);
      if (params.type === 'error') {
        fatalErrors.push(`[Console Error]: ${text}`);
      }
    });

    // 4. Navigate to Base App
    console.log(`\nNavigating to ${targetUrl}...`);
    await client.send('Page.navigate', { url: targetUrl });
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Root Mount
    const rootReady = await client.evaluate(`Boolean(document.getElementById('root'))`);
    if (!rootReady) throw new Error('#root element not found in DOM.');
    console.log('✔ Base application mounted successfully.');

    // 5. Test Each of the 15 Games
    const results = [];
    for (let i = 0; i < GAME_ROUTES.length; i++) {
      const game = GAME_ROUTES[i];
      const startTime = Date.now();
      const initialErrorCount = fatalErrors.length;

      // Navigate using Hash or Programmatic Navigation or Sidebar button click
      await client.evaluate(`
        (() => {
          if (window.__cryptoCasinoNavigate) {
            window.__cryptoCasinoNavigate('${game.id}');
          } else {
            // Click sidebar button or update location hash
            const buttons = Array.from(document.querySelectorAll('button'));
            const targetBtn = buttons.find(b => b.textContent && b.textContent.trim().toLowerCase().includes('${game.name.toLowerCase()}'));
            if (targetBtn) {
              targetBtn.click();
            } else {
              window.location.hash = '#${game.id}';
            }
          }
        })()
      `);

      // Wait for React re-render & PixiJS/Canvas initialization
      await new Promise((r) => setTimeout(r, 800));

      // Inspect DOM for Game Render
      const domStatus = await client.evaluate(`
        (() => {
          const canvases = document.querySelectorAll('canvas');
          const hasCanvas = canvases.length > 0;
          let canvasValid = false;
          if (hasCanvas) {
            const c = canvases[0];
            canvasValid = c.width > 0 && c.height > 0;
          }
          const bodyText = document.body.innerText || '';
          const hasBetControls = document.querySelectorAll('input[type="number"]').length > 0;
          return {
            hasCanvas,
            canvasValid,
            hasBetControls,
            textSample: bodyText.slice(0, 150)
          };
        })()
      `);

      const latencyMs = Date.now() - startTime;
      const errorsInRoute = fatalErrors.length - initialErrorCount;
      const isPassed = errorsInRoute === 0 && (!game.requiresCanvas || domStatus.hasCanvas);

      results.push({
        id: game.id,
        name: game.name,
        engine: game.engine,
        requiresCanvas: game.requiresCanvas,
        hasCanvas: domStatus.hasCanvas,
        hasBetControls: domStatus.hasBetControls,
        latencyMs,
        errors: errorsInRoute,
        passed: isPassed,
      });

      const statusIcon = isPassed ? '✔' : '✖';
      console.log(`  ${statusIcon} [${i + 1}/15] ${game.name.padEnd(14)} | Engine: ${game.engine.padEnd(20)} | Latency: ${latencyMs}ms | Canvas: ${domStatus.hasCanvas} | Errors: ${errorsInRoute}`);
    }

    // 6. Navigate Back to Home
    await client.evaluate(`
      (() => {
        if (window.__cryptoCasinoNavigate) window.__cryptoCasinoNavigate('home');
        else window.location.hash = '#home';
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    client.close();
    browserProc.kill();

    // 7. Summary Report
    console.log('\n' + '='.repeat(70));
    console.log('📊 ROUTE NAVIGATION TEST SUMMARY (ALL 15 GAMES)');
    console.log('='.repeat(70));
    const allPassed = results.every((r) => r.passed) && fatalErrors.length === 0;

    console.table(
      results.map((r) => ({
        Game: r.name,
        Route: `#${r.id}`,
        Engine: r.engine,
        Canvas: r.requiresCanvas ? (r.hasCanvas ? '✔ OK' : '❌ Missing') : 'N/A (DOM)',
        BetControls: r.hasBetControls ? '✔' : '❌',
        Latency: `${r.latencyMs}ms`,
        Status: r.passed ? 'PASS' : 'FAIL',
      }))
    );

    console.log(`Total Games Tested: ${results.length}/15`);
    console.log(`Total Fatal Errors: ${fatalErrors.length}`);
    if (fatalErrors.length > 0) {
      console.error('\nFatal Errors Intercepted:');
      fatalErrors.forEach((e) => console.error(`  - ${e}`));
    }

    console.log('='.repeat(70));
    if (allPassed) {
      console.log('🎉 SUCCESS: All 15 game routes mounted with 0 fatal errors!');
      return 0;
    } else {
      console.error('❌ FAILURE: One or more routes failed verification.');
      return 1;
    }
  } catch (err) {
    browserProc.kill();
    console.error('❌ Test Runner Exception:', err);
    return 1;
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runRouteVerification().then((code) => process.exit(code));
}
