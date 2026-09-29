import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, drawFn) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

function drawBloom(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2;
  const dx = (x - cx) / radius;
  const dy = (y - cy) / radius;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background deep charcoal
  let r = 15;
  let g = 20;
  let b = 28;
  let a = 255;

  // Outer ambient glow
  if (dist < 0.85) {
    const glow = Math.pow(1 - dist / 0.85, 2);
    r += Math.floor(glow * 40);
    g += Math.floor(glow * 150);
    b += Math.floor(glow * 120);
  }

  // Central flower / blossom icon
  // 4 petals
  const angle = Math.atan2(dy, dx);
  const petalR = 0.45 * (0.8 + 0.3 * Math.cos(4 * angle));
  if (dist < petalR) {
    // Petal color: warm orange to electric purple
    const t = (Math.sin(angle * 2) + 1) / 2;
    r = Math.floor(255 * (1 - t) + 168 * t);
    g = Math.floor(130 * (1 - t) + 85 * t);
    b = Math.floor(50 * (1 - t) + 247 * t);
  }

  // Core bud / glowing center
  if (dist < 0.18) {
    const coreT = 1 - dist / 0.18;
    r = 255;
    g = Math.floor(220 + 35 * coreT);
    b = Math.floor(120 * (1 - coreT));
  }

  // Two cute eyes for Tamagotchi spirit Pip!
  const eyeDx1 = Math.abs(dx - (-0.08));
  const eyeDy1 = Math.abs(dy - (-0.02));
  const eyeDx2 = Math.abs(dx - (0.08));
  const eyeDy2 = Math.abs(dy - (-0.02));
  if ((eyeDx1 < 0.03 && eyeDy1 < 0.05) || (eyeDx2 < 0.03 && eyeDy2 < 0.05)) {
    r = 15;
    g = 20;
    b = 28;
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNGs
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawBloom(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawBloom(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawBloom(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawBloom(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, (x, y, w, h) => drawBloom(x, y, w, h, false)));

console.log('Icons generated successfully!');
