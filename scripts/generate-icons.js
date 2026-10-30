import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPng(width, height) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.46;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Emerald green background gradient
      let r = 5;
      let g = 110 + Math.floor((y / height) * 35);
      let b = 75 + Math.floor((x / width) * 20);
      let a = 255;

      // Rounded circle border
      if (dist > radius) {
        a = 0; // transparent corners
      } else if (dist > radius - 6) {
        // Gold outer ring
        r = 245;
        g = 190;
        b = 35;
        a = 255;
      } else {
        // Inner design: Golden Tree & Scales
        // Scale balance beam
        if (Math.abs(dy - (-height * 0.12)) < width * 0.02 && Math.abs(dx) < width * 0.32) {
          r = 255; g = 215; b = 0; // Gold
        }
        // Central trunk
        else if (Math.abs(dx) < width * 0.04 && dy > -height * 0.12 && dy < height * 0.32) {
          r = 250; g = 204; b = 21; // Gold
        }
        // Tree foliage / dome
        else if (dy < -height * 0.05 && dist < width * 0.35) {
          r = 16; g = 185; b = 129; // Bright emerald
        }
        // Scale plates
        else if (Math.abs(dx - (-width * 0.28)) < width * 0.08 && Math.abs(dy - (height * 0.02)) < width * 0.04) {
          r = 251; g = 191; b = 36;
        } else if (Math.abs(dx - (width * 0.28)) < width * 0.08 && Math.abs(dy - (height * 0.02)) < width * 0.04) {
          r = 251; g = 191; b = 36;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPng(64, 64));
console.log('Successfully generated PWA PNG icons!');
