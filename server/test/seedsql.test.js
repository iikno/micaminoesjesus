// The committed 007 migration must match src/data/*; otherwise the deploy would load a stale catalog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('007_seed_catalogo.sql is in sync with src/data', () => {
  const r = spawnSync(process.execPath, ['--import', './server/seed-loader.js', 'server/cli/gen-seed-sql.js', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});
