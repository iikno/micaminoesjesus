// npm run create-admin -- --email you@example.org --name "Your Name"
// Sends an invite; with MAIL_DISABLED=1 prints the one-time set-password link instead. No password is ever hard-coded.
import { parseArgs } from 'node:util';
import { config } from '../config.js';
import { inviteUser } from '../lib/users.js';
import { audit } from '../lib/audit.js';
import { invite } from '../lib/schemas.js';
import { pool, tx } from '../db.js';

const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
let data;
try {
  data = invite.parse({ email: values.email, name: values.name, role: 'admin' });
} catch {
  console.error('Usage: npm run create-admin -- --email <email> --name "<name>"');
  process.exit(1);
}

try {
  const r = await tx(async (c) => {
    const out = await inviteUser(c, data);
    if (!out.exists) await audit(c, { ip: 'cli' }, 'invite', 'users', out.id, { email: data.email, role: 'admin' });
    return out;
  });
  if (r.exists) {
    console.error('That user already exists and is active.');
    process.exitCode = 1;
  } else if (config.MAIL_DISABLED || !r.sent) {
    console.log(`${config.MAIL_DISABLED ? 'MAIL_DISABLED' : 'Mail failed'}: one-time set-password link (valid 7 days):\n${r.link}`);
  } else {
    console.log(`Invite sent to ${data.email}.`);
  }
} finally {
  await pool.end();
}
