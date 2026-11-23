import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER, password: config.DB_PASS, database: config.DB_NAME,
  charset: 'utf8mb4', timezone: 'Z', dateStrings: ['DATE'], connectionLimit: 10,
});

export const q = async (sql, params) => (await pool.query(sql, params))[0];
export const one = async (sql, params) => (await q(sql, params))[0] ?? null;

// Runs fn(conn) in a transaction; conn has the same q/one helpers.
export async function tx(fn) {
  const conn = await pool.getConnection();
  const c = { q: async (s, p) => (await conn.query(s, p))[0], one: async (s, p) => (await conn.query(s, p))[0][0] ?? null };
  try {
    await conn.beginTransaction();
    const out = await fn(c);
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
