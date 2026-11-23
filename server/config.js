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
  PUBLIC_URL: z.url().default('http://localhost:3000'), // required in production (see refine below)
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string(),
  DB_NAME: z.string().min(1),
  DB_SSL: bool, // 1 = TLS to the DB with the bundled Amazon RDS CA (external RDS)
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  MAIL_DISABLED: bool,
  SMTP_HOST: opt, SMTP_PORT: z.coerce.number().int().optional(), SMTP_SECURE: bool,
  SMTP_USER: opt, SMTP_PASS: opt, SMTP_FROM: z.string().default('no-reply@micaminoesjesus.org'),
  UPLOADS_DIR: opt, UPLOAD_DIR: z.string().default('./uploads'), // UPLOAD_DIR is the legacy name
  UPLOAD_MAX_MB: z.coerce.number().int().min(1).max(20).default(8),
  TRANSLATE_PROVIDER: z.enum(['claude']).default('claude'), TRANSLATE_MODEL: z.string().default('claude-haiku-5-5'),
  TRANSLATE_MONTHLY_LIMIT: z.coerce.number().int().min(0).default(100000), // characters of source text per month
  DIST_DIR: z.string().default('./dist'),
  // Used by later phases (F3 translation/media, F4 contact/captcha); validated as present-or-not only.
  CONTACT_TO: opt, GC_SITE: opt, GC_SECRET: opt, CLAUDE: opt, ANTHROPIC_BASE_URL: opt, // CLAUDE = Anthropic API key; the base URL only exists so tests can point at a fake server
  // F4: registrations. REG_ENC_KEY = 32 bytes (64 hex) for AES-256-GCM; ALLERGIES_ENABLED stays off until a legal entity exists.
  REG_ENC_KEY: z.string().regex(/^([0-9a-f]{64}|[A-Za-z0-9+\/]{43}=)$/i, 'REG_ENC_KEY must be 32 bytes: 64 hex chars or base64').optional(), ALLERGIES_ENABLED: bool, RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),
  RECAPTCHA_VERIFY_URL: opt, // test-only: ignored in production
  ADMIN_USER: opt, ADMIN_PASS: opt, ADMIN_NAME: opt, // first admin on first start (see lib/bootstrapAdmin.js); ignored once an admin exists
  S3_BUCKET: opt, S3_REGION: opt, S3_ACCESS_KEY_ID: opt, S3_SECRET_ACCESS_KEY: opt,
}).refine((e) => e.MAIL_DISABLED || e.SMTP_HOST, { message: 'SMTP_HOST is required unless MAIL_DISABLED=1', path: ['SMTP_HOST'] });

// Production-only guards, checked on the raw env so defaults cannot hide a missing variable.
const prodChecks = (env) => {
  if (env.NODE_ENV !== 'production') return [];
  const bad = [];
  if (!env.PUBLIC_URL?.startsWith('https://')) bad.push('PUBLIC_URL: required in production and must start with https://');
  if (env.MAIL_DISABLED === '1' || env.MAIL_DISABLED === 'true') bad.push('MAIL_DISABLED: must not be set in production');
  return bad;
};

export function parseConfig(env) {
  // Compose passes unset optional variables as '' (e.g. TRANSLATE_MONTHLY_LIMIT=): treat them as not set, not as 0 or invalid.
  const r = schema.safeParse(Object.fromEntries(Object.entries(env).filter(([, v]) => v !== '')));
  const bad = [...(r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)), ...prodChecks(env)];
  if (bad.length) {
    // Names and messages only, never values.
    throw new Error('Invalid environment: ' + bad.join('; '));
  }
  const c = r.data;
  const u = new URL(c.PUBLIC_URL);
  const origin = u.origin;
  const www = u.hostname.startsWith('www.') ? u.hostname.slice(4) : 'www.' + u.hostname; // Coolify redirects one to the other; accept both
  const alt = u.hostname === 'localhost' ? [] : [`${u.protocol}//${www}${u.port ? ':' + u.port : ''}`];
  return {
    ...c,
    uploadsDir: c.UPLOADS_DIR || c.UPLOAD_DIR,
    isProd: c.NODE_ENV === 'production',
    captchaUrl: c.NODE_ENV === 'production' ? undefined : c.RECAPTCHA_VERIFY_URL,
    secureCookies: origin.startsWith('https:'),
    allowedOrigins: [origin, ...alt, ...(c.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000'])],
  };
}

export const config = parseConfig(process.env);
