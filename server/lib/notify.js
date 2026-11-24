import { config } from '../config.js';
import { q } from '../db.js';
import { trySend } from './mailer.js';

export const labelOf = (row) => row.title ?? row.name ?? row.ref ?? `#${row.id}`;
const panel = `${config.panelUrl}/revision`;

// Active admins and asesores, optionally without one user (the author never reviews their own item).
export const approvers = (exceptId = 0) =>
  q("SELECT id, email, name FROM users WHERE status = 'active' AND role IN ('admin','asesor') AND id <> ?", [exceptId]);

export async function notifySubmitted(entityKey, row, author) {
  for (const a of await approvers(author.id)) {
    await trySend({
      to: a.email, subject: `Pendiente de revisión: ${labelOf(row)}`,
      text: `${author.name} envió a revisión "${labelOf(row)}" (${entityKey}).\n\nRevísalo aquí: ${panel}\n`,
    });
  }
}

export async function notifyDecision(entityKey, row, authorId, reviewer, decision, comment) {
  const [author] = await q("SELECT email, name FROM users WHERE id = ? AND status = 'active'", [authorId]);
  if (!author) return;
  await trySend({
    to: author.email, subject: `${decision === 'aprobado' ? 'Aprobado' : 'Rechazado'}: ${labelOf(row)}`,
    text: `${reviewer.name} ${decision === 'aprobado' ? 'aprobó' : 'rechazó'} "${labelOf(row)}" (${entityKey}).\n${comment ? `\nComentario: ${comment}\n` : ''}\n${panel}\n`,
  });
}

// Reminder digest: one mail per approver with the pending items that are not their own.
export async function notifyReminders(items) {
  for (const a of await approvers()) {
    const mine = items.filter((i) => i.submitted_by !== a.id);
    if (!mine.length) continue;
    await trySend({
      to: a.email, subject: `Recordatorio: ${mine.length} pendiente(s) de revisión`,
      text: `Siguen sin decisión (nada se publica solo):\n\n${mine.map((i) => `- ${i.label} (${i.entity}), hace ${i.hours} h`).join('\n')}\n\n${panel}\n`,
    });
  }
}
