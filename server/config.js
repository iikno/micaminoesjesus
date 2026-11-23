import { existsSync } from 'node:fs';
import { z } from 'zod';

// Only ENV_FILE or .env.local are ever loaded. The plain .env may point at production and is never read here.
const file = process.env.ENV_FILE || '.env.local';
if (existsSync(file)) process.loadEnvFile(file);

const bool = z.enum(['0', '1', 'true', 'false', '']).optional().transform((v) => v === '1' || v === 'true');
const opt = z.string().optional();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  PUBLIC_URL: z.url().default('http://localhost:3000'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string(),
  DB_NAME: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  MAIL_DISABLED: bool,
  SMTP_HOST: opt, SMTP_PORT: z.coerce.number().int().optional(), SMTP_SECURE: bool,
  SMTP_USER: opt, SMTP_PASS: opt, SMTP_FROM: z.string().default('no-reply@micaminoesjesus.org'),
  UPLOAD_DIR: z.string().default('./uploads'),
  DIST_DIR: z.string().default('./dist'),
  // Used by later phases (F3 translation/media, F4 contact/captcha); validated as present-or-not only.
  CONTACT_TO: opt, GC_SITE: opt, GC_SECRET: opt, CLAUDE: opt,
  S3_BUCKET: opt, S3_REGION: opt, S3_ACCESS_KEY_ID: opt, S3_SECRET_ACCESS_KEY: opt,
}).refine((e) => e.MAIL_DISABLED || e.SMTP_HOST, { message: 'SMTP_HOST is required unless MAIL_DISABLED=1', path: ['SMTP_HOST'] });

export function parseConfig(env) {
  const r = schema.safeParse(env);
  if (!r.success) {
    // Names and messages only, never values.
    throw new Error('Invalid environment: ' + r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  }
  const c = r.data;
  const origin = new URL(c.PUBLIC_URL).origin;
  return {
    ...c,
    isProd: c.NODE_ENV === 'production',
    secureCookies: origin.startsWith('https:'),
    allowedOrigins: [origin, ...(c.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000'])],
  };
}

export const config = parseConfig(process.env);
