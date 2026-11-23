// One permission map: PERMS[role][resource] = allowed actions. Decisions that depend on the row
// (nobody approves their own submission) live in review.js.
const R = ['read'];
const RW = ['read', 'write'];
const ALL = ['read', 'write', 'approve', 'quick_fix'];
const REVIEWER = ['read', 'approve', 'quick_fix']; // asesor: sees, approves/rejects, fixes typos, never edits

export const PERMS = {
  admin: { users: RW, retreats: ALL, sessions: ALL, pilgrimages: ALL, team: ALL, verses: ALL, media: RW, glossary: RW, audit: R, reviews: R, registrations: RW, contact: RW },
  asesor: { retreats: REVIEWER, sessions: REVIEWER, pilgrimages: REVIEWER, team: REVIEWER, verses: REVIEWER, media: R, audit: R, reviews: R, registrations: R },
  pastoral: { retreats: RW, sessions: RW, verses: RW, media: RW, reviews: R, registrations: RW },
  peregrinacion: { pilgrimages: RW, verses: RW, media: RW, reviews: R, registrations: RW },
};

export const can = (role, resource, action) => PERMS[role]?.[resource]?.includes(action) ?? false;

// Roles that can approve at all (used to pick who gets notified).
export const approverRoles = ['admin', 'asesor'];
