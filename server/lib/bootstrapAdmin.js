import { config } from '../config.js';
import { pool, tx } from '../db.js';
import { audit } from './audit.js';
import { hashPassword } from './auth.js';
import { decideBootstrap } from './bootstrap.js';

// Runs after migrations. Own advisory lock so two containers starting together cannot both create an admin.
// Never updates an existing user: once an admin exists, ADMIN_* are ignored.
export async function bootstrapAdmin(log = console.log) {
  const lock = await pool.getConnection();
  try {
    await lock.query("SELECT GET_LOCK('mcj_bootstrap', 30)");
    const [[{ n }]] = await lock.query("SELECT COUNT(*) n FROM users WHERE role = 'admin'");
    const d = decideBootstrap({ user: config.ADMIN_USER, pass: config.ADMIN_PASS, adminExists: n > 0, isProd: config.isProd });
    if (d.action === 'error') throw new Error(`Invalid environment: ${d.reason}`);
    if (d.action === 'skip') {
      if (d.reason === 'admin_exists') log('ADMIN_* ignoradas: ya existe un admin');
      else if (d.reason !== 'not_configured') log(`ADMIN_* ignoradas: ${d.reason}`);
      return;
    }
    const pass_hash = await hashPassword(config.ADMIN_PASS);
    try {
      await tx(async (c) => {
      const r = await c.q("INSERT INTO users (email, name, role, pass_hash, status, email_verified_at) VALUES (?,?, 'admin', ?, 'active', ?)",
        [d.email, config.ADMIN_NAME || 'Administrador', pass_hash, new Date()]);
      await audit(c, { ip: 'bootstrap' }, 'bootstrap_admin', 'users', r.insertId, { email: d.email });
      });
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
      return log('ADMIN_* ignoradas: ese correo ya tiene un usuario que no es admin');
    }
    log(`Admin inicial creado: ${d.email}`);
  } finally {
    await lock.query("SELECT RELEASE_LOCK('mcj_bootstrap')").catch(() => {});
    lock.release();
  }
}
