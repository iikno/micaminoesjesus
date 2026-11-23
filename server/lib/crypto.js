import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Key: 32 bytes as 64 hex chars or base64 (REG_ENC_KEY). Format: v1.iv.tag.ciphertext (base64url).
export function parseKey(raw) {
  if (!raw) return null;
  const k = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new Error('REG_ENC_KEY must be 32 bytes (64 hex chars or base64)');
  return k;
}

export function encrypt(key, value) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(value), 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

export function decrypt(key, blob) {
  const [v, iv, tag, ct] = blob.split('.');
  if (v !== 'v1') throw new Error('unknown_cipher_version');
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8'));
}
