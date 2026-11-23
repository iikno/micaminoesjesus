import { z } from 'zod';

export const SUBJECTS = ['informacion', 'retiros', 'peregrinaciones', 'voluntariado', 'arco', 'otro'];
const s = (max) => z.string().trim().max(max);
export const contactSchema = z.strictObject({
  name: s(120).min(1), email: z.email().max(190).transform((e) => e.toLowerCase()),
  phone: s(30).regex(/^[0-9+()\-\s.]{7,30}$/).nullish().or(z.literal('')),
  subject: z.enum(SUBJECTS), message: s(5000).min(5), consent_privacy: z.literal(true),
  lang: z.enum(['es', 'en']).default('es'), captcha: s(4000).default(''),
});

// ARCO term: 20 business days from receipt (LFPDPPP). Weekends are skipped; official holidays are NOT
// (shortcut: verify the term and holidays with legal counsel before relying on it).
export function arcoDue(receivedAt, days = 20) {
  const d = new Date(receivedAt);
  d.setUTCHours(12, 0, 0, 0);
  for (let n = 0; n < days;) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() % 6) n++; // 0 = Sunday, 6 = Saturday
  }
  return d.toISOString().slice(0, 10);
}
