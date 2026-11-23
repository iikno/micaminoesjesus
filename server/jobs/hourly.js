// Coolify Scheduled Task, hourly: `node server/jobs/hourly.js`. Idempotent; never publishes anything unapproved.
import { pathToFileURL } from 'node:url';
import { ENTITIES } from '../lib/entities.js';
import { labelOf, notifyReminders } from '../lib/notify.js';
import { audit } from '../lib/audit.js';
import { promotionDue, reminderDue } from '../lib/review.js';
import { runRegistrationJobs } from '../lib/regsvc.js';
import { AUDIT_MONTHS, CONTACT_MONTHS, SPAM_DAYS, monthsAgo } from '../lib/regrules.js';
import { pool, q, tx } from '../db.js';

export async function runHourly(log = console.log) {
  const now = new Date();

  // Expire sessions (8h idle / 30 days absolute) and stale tokens.
  const s = await q('DELETE FROM sessions WHERE last_seen_at < ? OR created_at < ?', [new Date(now - 8 * 3600e3), new Date(now - 30 * 24 * 3600e3)]);
  const t = await q('DELETE FROM tokens WHERE expires_at < ?', [new Date(now - 30 * 24 * 3600e3)]);

  // Scheduled items that were approved become "publicado" once their time has come (the site already
  // serves them from live_from; this only flips the label).
  let flipped = 0;
  for (const e of Object.values(ENTITIES)) {
    flipped += (await q("UPDATE ?? SET status = 'publicado' WHERE status = 'programado' AND pending_snapshot IS NULL AND live_from <= ?", [e.table, now])).affectedRows;
  }

  // Approved edits of live content wait in pending_snapshot; promote them when their time has come.
  let promoted = 0;
  for (const [key, e] of Object.entries(ENTITIES)) {
    for (const row of await q('SELECT id, pending_snapshot, pending_from FROM ?? WHERE pending_snapshot IS NOT NULL AND pending_from <= ?', [e.table, now])) {
      if (!promotionDue(row, now)) continue;
      await tx(async (c) => {
        await c.q(`UPDATE ${e.table} SET published_snapshot = pending_snapshot, live_from = pending_from, pending_snapshot = NULL, pending_from = NULL,
                   status = IF(status = 'programado', 'publicado', status) WHERE id = ?`, [row.id]);
        await audit(c, { ip: 'job' }, 'publish_scheduled', key, row.id, { live_from: row.pending_from });
      });
      promoted++;
    }
  }

  // Reviews pending for 48h get a reminder, then again every 48h. A scheduled item whose time passed
  // without approval stays "en_revision" and is covered by the same reminder.
  const due = [];
  for (const r of await q("SELECT * FROM reviews WHERE decision = 'pendiente'")) {
    if (!reminderDue(r, now)) continue;
    const [row] = await q(`SELECT * FROM ${ENTITIES[r.entity].table} WHERE id = ?`, [r.entity_id]);
    due.push({ ...r, entity: r.entity, label: row ? labelOf(row) : `#${r.entity_id}`, hours: Math.floor((now - new Date(r.created_at)) / 3600e3) });
  }
  if (due.length) {
    await notifyReminders(due);
    await q('UPDATE reviews SET last_reminded_at = ? WHERE id IN (?)', [now, due.map((d) => d.id)]);
  }
  // F4: registrations (reminders, expiry, waitlist offers, retention) and the other retention windows.
  const reg = await runRegistrationJobs(now);
  const cm = await q("DELETE FROM contact_messages WHERE created_at < ? OR (status = 'spam' AND created_at < ?)", [monthsAgo(now, CONTACT_MONTHS), new Date(now - SPAM_DAYS * 24 * 3600e3)]);
  const al = await q('DELETE FROM audit_log WHERE created_at < ?', [monthsAgo(now, AUDIT_MONTHS)]);
  log(`hourly registrations: ${JSON.stringify(reg)}, contact purged ${cm.affectedRows}, audit purged ${al.affectedRows}`);
  log(`hourly: sessions purged ${s.affectedRows}, tokens purged ${t.affectedRows}, scheduled->published ${flipped}, promoted ${promoted}, reminders ${due.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Advisory lock on a dedicated connection: an overlapping run exits 0 without doing anything.
  const lock = await pool.getConnection();
  try {
    const [[{ got }]] = await lock.query("SELECT GET_LOCK('mcj_hourly', 0) AS got");
    if (got) await runHourly(); else console.log('hourly: another run holds the lock, skipping');
  } catch (e) {
    console.error('hourly failed:', e);
    process.exitCode = 1;
  } finally {
    lock.release();
    await pool.end();
  }
}
