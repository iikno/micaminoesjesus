export const MAX_FAILS = 5;
export const LOCK_MINUTES = 15;

export const isLocked = (user, now = new Date()) => !!user.locked_until && new Date(user.locked_until) > now;

// Next counters after a failed password: the 5th failure locks for 15 minutes and resets the counter.
export function afterFailure(user, now = new Date()) {
  const fails = user.failed_logins + 1;
  return fails >= MAX_FAILS
    ? { failed_logins: 0, locked_until: new Date(now.getTime() + LOCK_MINUTES * 60e3) }
    : { failed_logins: fails, locked_until: null };
}
