/**
 * Automated 15-Game Browser Route Navigation & Health Verification Runner
 * 
 * Features:
 * - Zero external npm dependencies (uses native Node.js ESM + built-in http/crypto WebSocket + CDP)
 * - Compatible with Node 18+ (includes built-in RFC 6455 WebSocket client fallback)
 * - Auto-detects Microsoft Edge or Google Chrome on Windows
 * - Connects to Vite Dev Server (port 5173) or Preview Server (port 4173), auto-starting if needed
 * - Systematically navigates to all 15 game routes in a real Chromium browser
 * - Verifies DOM mounting, canvas rendering (PixiJS v8 / Canvas2D), and bet controls
 * - Captures all console messages, unhandled exceptions, and promise rejections
 * - Asserts 0 fatal errors and outputs an exhaustive verification report
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { EventEmitter } from 'events';

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
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
];

function findBrowserBinary() {
  for (const p of BROWSER_PATHS) {
    if (p && fs.existsSync(p)) return p;
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

// Built-in RFC 6455 WebSocket client for Node environments lacking global WebSocket (Node < 21)
class NodeWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = new URL(url);
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this._connect();
  }

  _connect() {
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: this.url.hostname,
      port: this.url.port,
      path: this.url.pathname + this.url.search,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });

    req.on('upgrade', (res, socket, head) => {
      this.socket = socket;
      if (head && head.length > 0) {
        this.buffer = Buffer.concat([this.buffer, head]);
        this._processBuffer();
      }
      this.socket.on('data', (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this._processBuffer();
      });
      this.socket.on('close', () => {
        this.emit('close');
        if (typeof this.onclose === 'function') this.onclose();
      });
      this.socket.on('error', (err) => {
        this.emit('error', err);
        if (typeof this.onerror === 'function') this.onerror(err);
      });
      this.emit('open');
      if (typeof this.onopen === 'function') this.onopen();
    });

    req.on('error', (err) => {
      this.emit('error', err);
      if (typeof this.onerror === 'function') this.onerror(err);
    });

    req.end();
  }

  _processBuffer() {
    while (this.buffer.length >= 2) {
      const b0 = this.buffer[0];
      const b1 = this.buffer[1];
      const opcode = b0 & 0x0f;
      const isMasked = (b1 & 0x80) !== 0;
      let payloadLen = b1 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (this.buffer.length < 4) return;
        payloadLen = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (this.buffer.length < 10) return;
        payloadLen = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let mask = null;
      if (isMasked) {
        if (this.buffer.length < offset + 4) return;
        mask = this.buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (this.buffer.length < offset + payloadLen) return;

      let payload = this.buffer.subarray(offset, offset + payloadLen);
      this.buffer = this.buffer.subarray(offset + payloadLen);

      if (isMasked && mask) {
        const unmasked = Buffer.alloc(payloadLen);
        for (let i = 0; i < payloadLen; i++) {
          unmasked[i] = payload[i] ^ mask[i % 4];
        }
        payload = unmasked;
      }

      if (opcode === 0x1) {
        const data = payload.toString('utf8');
        this.emit('message', { data });
        if (typeof this.onmessage === 'function') this.onmessage({ data });
      } else if (opcode === 0x8) {
        this.close();
      } else if (opcode === 0x9) {
        this._sendFrame(0x0A, payload);
      }
    }
  }

  _sendFrame(opcode, dataBuf) {
    if (!this.socket || this.socket.destroyed) return;
    const len = dataBuf.length;
    let header;
    const mask = crypto.randomBytes(4);

    if (len <= 125) {
      header = Buffer.alloc(2 + 4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | len;
      mask.copy(header, 2);
    } else if (len <= 65535) {
      header = Buffer.alloc(2 + 2 + 4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
      mask.copy(header, 4);
    } else {
      header = Buffer.alloc(2 + 8 + 4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
      mask.copy(header, 10);
    }

    const maskedData = Buffer.alloc(len);
    for (let i = 0; i < len; i++) {
      maskedData[i] = dataBuf[i] ^ mask[i % 4];
    }

    this.socket.write(Buffer.concat([header, maskedData]));
  }

  send(data) {
    const buf = Buffer.from(data, 'utf8');
    this._sendFrame(0x01, buf);
  }

  close() {
    if (this.socket && !this.socket.destroyed) {
      try {
        const mask = crypto.randomBytes(4);
        const frame = Buffer.alloc(2 + 4);
        frame[0] = 0x88;
        frame[1] = 0x80;
        mask.copy(frame, 2);
        this.socket.write(frame);
      } catch (e) {}
      this.socket.end();
    }
  }
}

const WSClient = typeof globalThis.WebSocket !== 'undefined' ? globalThis.WebSocket : NodeWebSocket;

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
      this.ws = new WSClient(this.wsUrl);
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
      throw new Error(res.exceptionDetails.text || res.exceptionDetails.exception?.description || 'CDP Evaluation Exception');
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function getCDPWebSocketUrl(cdpPort) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      if (res.ok) {
        const targets = await res.json();
        if (Array.isArray(targets) && targets.length > 0) {
          const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
          if (pageTarget && pageTarget.webSocketDebuggerUrl) {
            return pageTarget.webSocketDebuggerUrl;
          }
        }
      }
    } catch {
      // Browser booting
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Failed to connect to browser CDP endpoint within 8 seconds.');
}

export async function runRouteVerification() {
  console.log('='.repeat(70));
  console.log('🚀 AUTOMATED 15-GAME ROUTE NAVIGATION & BROWSER HEALTH CHECK');
  console.log('='.repeat(70));

  // 1. Locate Server or Start Background Preview/Dev Server
  let targetUrl = 'http://127.0.0.1:5173';
  let serverProc = null;
  let isRunning = await checkServerAvailable(targetUrl);

  if (!isRunning) {
    targetUrl = 'http://127.0.0.1:4173';
    isRunning = await checkServerAvailable(targetUrl);
  }

  if (!isRunning) {
    console.log('ℹ No active server detected on 5173 or 4173. Launching Vite dev server...');
    const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
    if (fs.existsSync(viteBin)) {
      serverProc = spawn(process.execPath, [viteBin, '--port', '5173', '--host', '127.0.0.1'], {
        cwd: process.cwd(),
        stdio: 'ignore',
        detached: false,
      });
      targetUrl = 'http://127.0.0.1:5173';
    } else {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      serverProc = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173', '--host', '127.0.0.1'], {
        cwd: process.cwd(),
        stdio: 'ignore',
        detached: false,
        shell: true,
      });
      targetUrl = 'http://127.0.0.1:5173';
    }

    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (await checkServerAvailable(targetUrl)) {
        isRunning = true;
        break;
      }
    }

    if (!isRunning) {
      if (serverProc) serverProc.kill();
      console.error('❌ Could not start or connect to frontend server.');
      process.exit(1);
    }
  }
  console.log(`✔ Connected to frontend server at ${targetUrl}`);

  // 2. Locate Browser
  const browserBin = findBrowserBinary();
  if (!browserBin) {
    if (serverProc) serverProc.kill();
    console.error('❌ Could not locate Microsoft Edge or Google Chrome binary on this system.');
    process.exit(1);
  }
  console.log(`✔ Found browser binary: ${browserBin}`);

  // 3. Launch Headless Browser
  const cdpPort = 9222;
  const tempUserDataDir = path.join(os.tmpdir(), `cdp-crypto-casino-${Date.now()}`);
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const browserProc = spawn(browserBin, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempUserDataDir}`,
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

      // Navigate via window.__cryptoCasinoNavigate or hash
      await client.evaluate(`
        (() => {
          if (window.__cryptoCasinoNavigate) {
            window.__cryptoCasinoNavigate('${game.id}');
          } else {
            window.location.hash = '#${game.id}';
          }
        })()
      `);

      // Allow React state transition & PixiJS canvas initialization
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
      console.log(`  ${statusIcon} [${String(i + 1).padStart(2, ' ')}/15] ${game.name.padEnd(14)} | Engine: ${game.engine.padEnd(20)} | Latency: ${String(latencyMs).padStart(4, ' ')}ms | Canvas: ${String(domStatus.hasCanvas).padEnd(5)} | Errors: ${errorsInRoute}`);
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
    if (serverProc) serverProc.kill();

    // Clean up temporary user data dir
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch {}

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
    if (serverProc) serverProc.kill();
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch {}
    console.error('❌ Test Runner Exception:', err);
    return 1;
  }
}

runRouteVerification().then((code) => process.exit(code));

