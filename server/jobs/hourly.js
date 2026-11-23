// Coolify Scheduled Task, hourly: `node server/jobs/hourly.js`. Idempotent; never publishes anything unapproved.
import { pathToFileURL } from 'node:url';
import { ENTITIES } from '../lib/entities.js';
import { labelOf, notifyReminders } from '../lib/notify.js';
import { reminderDue } from '../lib/review.js';
import { pool, q } from '../db.js';

export async function runHourly(log = console.log) {
  const now = new Date();

  // Expire sessions (8h idle / 30 days absolute) and stale tokens.
  const s = await q('DELETE FROM sessions WHERE last_seen_at < ? OR created_at < ?', [new Date(now - 8 * 3600e3), new Date(now - 30 * 24 * 3600e3)]);
  const t = await q('DELETE FROM tokens WHERE expires_at < ?', [new Date(now - 30 * 24 * 3600e3)]);

  // Scheduled items that were approved become "publicado" once their time has come (the site already
  // serves them from live_from; this only flips the label).
  let flipped = 0;
  for (const e of Object.values(ENTITIES)) {
    flipped += (await q("UPDATE ?? SET status = 'publicado' WHERE status = 'programado' AND live_from <= ?", [e.table, now])).affectedRows;
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
  log(`hourly: sessions purged ${s.affectedRows}, tokens purged ${t.affectedRows}, scheduled->published ${flipped}, reminders ${due.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await runHourly(); } finally { await pool.end(); }
}
