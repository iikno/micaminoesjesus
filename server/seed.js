// npm run seed  (node --import ./server/seed-loader.js server/seed.js)
// Loads the static site catalog into a LOCAL database by applying the same SQL that production gets through
// migration 007_seed_catalogo.sql. Idempotent and non-destructive: existing rows are never overwritten.
import { config } from './config.js';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { buildSql } from './cli/gen-seed-sql.js';
import mysql from 'mysql2/promise';

// Production is seeded by the migration on deploy; this script is for local databases only.
if (!['localhost', '127.0.0.1', 'db'].includes(config.DB_HOST) && process.env.ALLOW_REMOTE_SEED !== '1') {
  console.error('Refusing to seed a non-local DB_HOST (set ALLOW_REMOTE_SEED=1 to override).');
  process.exit(1);
}

await migrate(); // a fresh DB gets 007 here already; running the current SQL again is a no-op for existing rows
const c = await mysql.createConnection({
  host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER, password: config.DB_PASS, database: config.DB_NAME,
  ssl: config.DB_SSL ? 'Amazon RDS' : undefined, multipleStatements: true, charset: 'utf8mb4',
});
try { await c.query(buildSql()); } finally { await c.end(); }

const [[n]] = await pool.query(`SELECT (SELECT COUNT(*) FROM retreats) retreats, (SELECT COUNT(*) FROM retreats WHERE tipo = 'taller') talleres,
  (SELECT COUNT(*) FROM retreats WHERE tipo = 'retiro') retiros, (SELECT COUNT(*) FROM retreats WHERE tipo = 'hora_santa') horas_santas,
  (SELECT COUNT(*) FROM derej) derej, (SELECT COUNT(*) FROM seasons) seasons, (SELECT COUNT(*) FROM team_members) team, (SELECT COUNT(*) FROM retreat_sessions) sessions`);
console.log('totals:', n);
await pool.end();
