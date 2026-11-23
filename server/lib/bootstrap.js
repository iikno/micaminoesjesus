// First-start administrator from ADMIN_USER / ADMIN_PASS. Pure decision here; the DB work is in bootstrapAdmin().
import { z } from 'zod';

const email = z.email().max(190);

// -> { action: 'skip' | 'create' | 'error', reason, email? }. Never echoes the password.
export function decideBootstrap({ user, pass, adminExists, isProd }) {
  if (!user && !pass) return { action: 'skip', reason: 'not_configured' };
  if (adminExists) return { action: 'skip', reason: 'admin_exists' };
  const bad = [];
  if (!user || !email.safeParse(user).success) bad.push('ADMIN_USER must be a valid email');
  if (!pass || pass.length < 12 || pass.length > 200) bad.push('ADMIN_PASS must be 12 to 200 characters');
  if (bad.length) return isProd ? { action: 'error', reason: bad.join('; ') } : { action: 'skip', reason: bad.join('; ') };
  return { action: 'create', reason: 'no_admin', email: user.toLowerCase() };
}
