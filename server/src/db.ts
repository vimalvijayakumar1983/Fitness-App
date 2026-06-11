import { Db, makeSqliteDb, makePgDb } from './db/engine';
import { SCHEMA, MIGRATIONS } from './db/schema';

/**
 * Picks the database engine: Postgres when DATABASE_URL is set (production),
 * otherwise a local SQLite file. Both expose the same async interface.
 */
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL && /^postgres(ql)?:\/\//.test(DATABASE_URL);

export let db: Db;

if (isPostgres) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool, types } = require('pg');
  // Return COUNT/SUM(int8)=20 and NUMERIC=1700 as JS numbers, not strings.
  types.setTypeParser(20, (v: string) => parseInt(v, 10));
  types.setTypeParser(1700, (v: string) => parseFloat(v));
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  db = makePgDb((text, values) => pool.query(text, values), (sql) => pool.query(sql));
} else {
  db = makeSqliteDb(process.env.DATABASE_PATH || './data/fitness.db');
}

export const engine = db.engine;



/** Creates all tables if they don't already exist. */
export async function initSchema(): Promise<void> {
  await db.exec(SCHEMA);
}

/**
 * Idempotent column migrations for tables that predate newer columns.
 * Postgres supports ADD COLUMN IF NOT EXISTS; SQLite needs a try/catch guard.
 */
export async function migrate(): Promise<void> {
  const cols = MIGRATIONS;
  for (const [table, col, type] of cols) {
    if (isPostgres) {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    } else {
      try { await db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch { /* exists */ }
    }
  }
}
