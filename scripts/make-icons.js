import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height) {
  // Create RGBA image with pickleball court dark navy and neon circle
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const rPaddle = width * 0.36;
  const rBall = width * 0.16;
  const bx = width * 0.68;
  const by = height * 0.32;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dxPaddle = (x - cx) * 0.85;
      const dyPaddle = (y - cy) * 1.1;
      const distPaddle = Math.hypot(dxPaddle, dyPaddle);

      const distBall = Math.hypot(x - bx, y - by);

      if (distBall <= rBall) {
        // Neon Pickleball (Lime Yellow)
        rawData[offset++] = 190; // R
        rawData[offset++] = 242; // G
        rawData[offset++] = 100; // B
        rawData[offset++] = 255; // A
      } else if (distPaddle <= rPaddle) {
        // Sky Blue Paddle Blade
        rawData[offset++] = 56;  // R
        rawData[offset++] = 189; // G
        rawData[offset++] = 248; // B
        rawData[offset++] = 255; // A
      } else {
        // Deep Navy Background
        rawData[offset++] = 9;   // R
        rawData[offset++] = 13;  // G
        rawData[offset++] = 22;  // B
        rawData[offset++] = 255; // A
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // CRC32 calculation
    const toCrc = Buffer.concat([typeBuf, data]);
    let crc = 0xffffffff;
    for (let i = 0; i < toCrc.length; i++) {
      crc ^= toCrc[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512));
console.log('PNG icons generated successfully.');
