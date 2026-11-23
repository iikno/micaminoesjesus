import { can } from './perm.js';

export const STATUSES = ['borrador', 'en_revision', 'programado', 'publicado', 'rechazado'];

export class FlowError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

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

// One approval is enough, but never from the author, and only from a role allowed on that resource.
export function canDecide(user, resource, submittedBy) {
  return can(user.role, resource, 'approve') && user.id !== submittedBy;
}

export const REMINDER_HOURS = 48;

// A pending review is due a reminder 48h after submission, then every 48h after the last one.
export function reminderDue(review, now = new Date()) {
  const since = new Date(review.last_reminded_at ?? review.created_at);
  return now - since >= REMINDER_HOURS * 3600e3;
}
