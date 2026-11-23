// Every write goes through here, on the same connection (transaction) as the change itself.
export const audit = (c, req, action, entity, entityId, diff = null) =>
  c.q('INSERT INTO audit_log (user_id, action, entity, entity_id, diff, ip) VALUES (?,?,?,?,?,?)',
    [req.user?.id ?? null, action, entity, entityId, diff && JSON.stringify(diff), req.ip]);
