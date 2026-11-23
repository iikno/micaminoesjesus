import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from './config.js';

const dir = fileURLToPath(new URL('./migrations/', import.meta.url));

export async function migrate(log = console.log) {
  const c = await mysql.createConnection({
    host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER, password: config.DB_PASS, database: config.DB_NAME,
    multipleStatements: true, charset: 'utf8mb4',
  });
  try {
    await c.query('SELECT GET_LOCK(?, 60)', ['mcj_migrate']); // two replicas starting together must not race
    await c.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const done = new Set((await c.query('SELECT name FROM schema_migrations'))[0].map((r) => r.name));
    for (const f of readdirSync(dir).filter((n) => /^\d+_.+\.sql$/.test(n)).sort()) {
      if (done.has(f)) continue;
      await c.query(readFileSync(dir + f, 'utf8'));
      await c.query('INSERT INTO schema_migrations (name) VALUES (?)', [f]);
      log(`migrated ${f}`);
    }
  } finally {
    await c.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await migrate();
