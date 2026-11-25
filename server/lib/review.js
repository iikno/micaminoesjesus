import { can } from './perm.js';

export const STATUSES = ['borrador', 'en_revision', 'programado', 'publicado', 'rechazado'];

export class FlowError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

// Optional optimistic check for a save: `seen` is the version the client read (undefined = no check).
export const assertFresh = (row, seen) => {
  if (seen != null && seen !== row.version) throw new FlowError('version_conflict');
};

// Pure state machine: borrador|rechazado -submit-> en_revision -approve-> publicado|programado,
// en_revision -reject(comment)-> rechazado, any edit -> borrador (published content stays live via its snapshot).
export function nextStatus(status, event, { publishAt = null, now = new Date(), comment = '' } = {}) {
  switch (event) {
    case 'edit':
      if (status === 'en_revision') throw new FlowError('Item is under review; wait for a decision');
      return 'borrador';
    case 'submit':
      if (status !== 'borrador' && status !== 'rechazado') throw new FlowError(`Cannot submit from ${status}`);
      return 'en_revision';
    case 'approve':
      if (status !== 'en_revision') throw new FlowError(`Cannot approve from ${status}`);
      return publishAt && new Date(publishAt) > now ? 'programado' : 'publicado';
    case 'reject':
      if (status !== 'en_revision') throw new FlowError(`Cannot reject from ${status}`);
      if (!comment.trim()) throw new FlowError('A comment is required to reject', 400);
      return 'rechazado';
    default:
      throw new FlowError(`Unknown event ${event}`, 400);
  }
}

// One approval is enough, only from a role allowed on that resource; nobody but admin decides their own submission.
export function canDecide(user, resource, submittedBy) {
  return can(user.role, resource, 'approve') && (user.role === 'admin' || user.id !== submittedBy);
}

export const REMINDER_HOURS = 48;

// A pending review is due a reminder 48h after submission, then every 48h after the last one.
export function reminderDue(review, now = new Date()) {
  const since = new Date(review.last_reminded_at ?? review.created_at);
  return now - since >= REMINDER_HOURS * 3600e3;
}

// Where an approval lands. A future publish_at on content that already has a live snapshot goes to the
// pending slot so the live version keeps being served; otherwise it becomes the live snapshot right away.
export function planApproval(row, now = new Date()) {
  const future = row.publish_at && new Date(row.publish_at) > now;
  if (future && row.published_snapshot) return { slot: 'pending', from: new Date(row.publish_at) };
  return { slot: 'live', from: future ? new Date(row.publish_at) : now };
}

export const promotionDue = (row, now = new Date()) => !!row.pending_snapshot && !!row.pending_from && new Date(row.pending_from) <= now;
