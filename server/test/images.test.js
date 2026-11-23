import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { ImageError, processImage, sniff } from '../lib/images.js';

const solid = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#c1272d' } });

test('sniff trusts magic bytes only', async () => {
  assert.equal(sniff(await solid(10, 10).png().toBuffer()), 'png');
  assert.equal(sniff(await solid(4, 4).jpeg().toBuffer()), 'jpeg');
  assert.equal(sniff(await solid(4, 4).webp().toBuffer()), 'webp');
  assert.equal(sniff(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(sniff(Buffer.from('GIF89a....')), null);
  assert.equal(sniff(Buffer.alloc(0)), null);
});

test('processImage re-encodes to WebP, max 1600 px, with a 480 px thumb, never enlarging', async () => {
  const big = await processImage(await solid(3200, 2000).png().toBuffer());
  assert.deepEqual([big.width, big.height], [1600, 1000]);
  assert.equal(sniff(big.full), 'webp');
  const t = await sharp(big.thumb).metadata();
  assert.equal(t.format, 'webp');
  assert.equal(t.width, 480);
  const small = await processImage(await solid(300, 200).png().toBuffer());
  assert.deepEqual([small.width, small.height], [300, 200]);
});

test('processImage rejects non-images and images that only pretend to be one', async () => {
  await assert.rejects(processImage(Buffer.from('hello')), (e) => e instanceof ImageError && e.message === 'unsupported_image_type');
  const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('not really a jpeg')]);
  await assert.rejects(processImage(fake), (e) => e instanceof ImageError && e.message === 'invalid_image');
});
