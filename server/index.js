import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate } from './migrate.js';
import { pool } from './db.js';

// Migrations run before listening, so a new image never serves against an old schema.
await migrate();
const app = await buildApp();
await app.listen({ port: config.PORT, host: '0.0.0.0' });

const stop = async () => { await app.close(); await pool.end(); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
