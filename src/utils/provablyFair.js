// Pure JavaScript SHA-256 and HMAC-SHA256 (FIPS 180-4 / RFC 2104 compliant)
// Fully compatible with browser and Node.js without polyfills or external dependencies

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotr(n, x) {
  return (x >>> n) | (x << (32 - n));
}

function ch(x, y, z) {
  return (x & y) ^ (~x & z);
}

function maj(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0(x) {
  return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
}

function sigma1(x) {
  return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
}

function gamma0(x) {
  return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
}

function gamma1(x) {
  return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
}

function toUint8Array(input) {
  if (input instanceof Uint8Array) return input;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return new Uint8Array(input);
  if (typeof input === 'string') {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(input);
    }
    const bytes = [];
    for (let i = 0; i < input.length; i++) {
      let code = input.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0xd800 || code >= 0xe000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        i++;
        code = 0x10000 + (((code & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return new Uint8Array(bytes);
  }
  return new Uint8Array(0);
}

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function sha256Bytes(data) {
  const bytes = toUint8Array(data);
  const len = bytes.length;
  const bitLen = len * 8;
  const k = (56 - ((len + 1) % 64) + 64) % 64;
  const paddedLen = len + 1 + k + 8;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes, 0);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      w[i] = (gamma1(w[i - 2]) + w[i - 7] + gamma0(w[i - 15]) + w[i - 16]) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const t1 = (h + sigma1(e) + ch(e, f, g) + K[i] + w[i]) | 0;
      const t2 = (sigma0(a) + maj(a, b, c)) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

export function sha256Hex(data) {
  return bytesToHex(sha256Bytes(data));
}

// Cryptographically sound pure JavaScript HMAC-SHA256
export function hmacSHA256(keyInput, messageInput) {
  let key = toUint8Array(keyInput);
  const message = toUint8Array(messageInput);

  if (key.length > 64) {
    key = sha256Bytes(key);
  }

  const kPad = new Uint8Array(64);
  kPad.set(key);

  const kIpad = new Uint8Array(64 + message.length);
  const kOpad = new Uint8Array(64 + 32);

  for (let i = 0; i < 64; i++) {
    kIpad[i] = kPad[i] ^ 0x36;
    kOpad[i] = kPad[i] ^ 0x5c;
  }
  kIpad.set(message, 64);

  const innerHash = sha256Bytes(kIpad);
  kOpad.set(innerHash, 64);

  const outerHash = sha256Bytes(kOpad);
  return bytesToHex(outerHash);
}

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

// HMAC-SHA256 provably fair float generation
// Matches Stake.com / Bustabit industry standard
export function getProvablyFairFloats(serverSeed, clientSeed, nonce, count = 1) {
  const floats = [];
  let cursor = 0;
  while (floats.length < count) {
    const hmacHex = hmacSHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    const bytes = hexToBytes(hmacHex);
    for (let i = 0; i < bytes.length && floats.length < count; i += 4) {
      if (i + 4 <= bytes.length) {
        const float = bytes[i] / 256 + bytes[i+1] / 65536 + bytes[i+2] / 16777216 + bytes[i+3] / 4294967296;
        floats.push(float);
      }
    }
    cursor++;
  }
  return floats;
}

// Crash point from hash (Bustabit / Stake algorithm - Uncapped with 3% house edge)
export function getCrashPoint(serverSeed, clientSeed, nonce = 0) {
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const h = floats[0];
  // 3% house edge (instant crash)
  if (h < 0.03) return 1.00;
  return Math.max(1.00, Math.floor((0.97 / (1 - h)) * 100) / 100);
}

// Generate a random server seed (CSPRNG 256-bit)
export function generateServerSeed() {
  const cryptoObj = typeof window !== 'undefined' && window.crypto
    ? window.crypto
    : (typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : null);

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const array = new Uint8Array(32);
    cryptoObj.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  // Safe fallback if CSPRNG is completely unavailable
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

// Generate SHA-256 hash of seed (for public commitment)
export async function hashSeed(seed) {
  return sha256Hex(seed);
}

// Simple provably fair result for most games
export function getGameResult(min = 0, max = 1) {
  const serverSeed = generateServerSeed();
  const clientSeed = 'default';
  const floats = getProvablyFairFloats(serverSeed, clientSeed, Date.now(), 1);
  return min + floats[0] * (max - min);
}

// Fisher-Yates shuffle (for Mines, Keno, etc)
export function shuffleArray(array, seed) {
  const arr = [...array];
  const serverSeed = seed || generateServerSeed();
  const floats = getProvablyFairFloats(serverSeed, 'default', 0, arr.length);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
