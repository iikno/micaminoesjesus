import sharp from 'sharp';

// Magic bytes decide the type; the client's filename and Content-Type are never trusted.
export function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

export class ImageError extends Error {
  constructor(code) {
    super(code);
    this.status = 400;
  }
}

export const MAX_SIDE = 1600;
export const THUMB_SIDE = 480;

// Re-encodes to WebP (sharp drops EXIF/ICC by default): max 1600 px plus a 480 px thumbnail.
// limitInputPixels guards against decompression bombs (a tiny file that decodes to gigapixels).
export async function processImage(buf) {
  if (!sniff(buf)) throw new ImageError('unsupported_image_type');
  try {
    const src = () => sharp(buf, { limitInputPixels: 40e6 }).rotate();
    const full = await src().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const thumb = await src().resize({ width: THUMB_SIDE, height: THUMB_SIDE, fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    return { full: full.data, thumb, width: full.info.width, height: full.info.height };
  } catch (e) {
    if (e instanceof ImageError) throw e;
    throw new ImageError('invalid_image');
  }
}
