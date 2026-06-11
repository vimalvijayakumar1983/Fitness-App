/**
 * One-time data migration: copies every table from the local SQLite database
 * into Postgres (DATABASE_URL). Run AFTER the Postgres schema exists.
 *
 *   DATABASE_URL=postgres://… SQLITE_PATH=./data/fitness.db npx ts-node scripts/migrate-to-postgres.ts
 *
 * Idempotent per-row via ON CONFLICT DO NOTHING on the primary key where known.
 */
import { makeSqliteDb, makePgDb } from '../src/db/engine';
import { SCHEMA, MIGRATIONS } from '../src/db/schema';

const TABLES = [
  'users', 'meals', 'exercises', 'moods', 'sleep', 'weights', 'water', 'goals', 'foods',
  'cms_foods', 'cms_exercises', 'cms_recipes', 'segments', 'user_state', 'plan_templates',
  'customer_plans', 'subscriptions', 'settings', 'programs', 'program_enrollments', 'coaches',
  'coach_bookings', 'coach_messages', 'integration_links', 'challenges', 'challenge_participants',
  'push_tokens', 'password_resets', 'companies',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url)) throw new Error('Set DATABASE_URL to your Postgres connection string.');
  const sqlitePath = process.env.SQLITE_PATH || './data/fitness.db';

  const sqlite = makeSqliteDb(sqlitePath);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
  const pg = makePgDb((text, values) => pool.query(text, values), (sql) => pool.query(sql));

  await pg.exec(SCHEMA);
  for (const [t, c, ty] of MIGRATIONS) await pg.exec(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS ${c} ${ty}`);

  let total = 0;
  for (const table of TABLES) {
    const rows = await sqlite.prepare(`SELECT * FROM ${table}`).all().catch(() => []);
    if (!rows.length) { console.log(`· ${table}: 0`); continue; }
    for (const row of rows) {
      const cols = Object.keys(row);
      const placeholders = cols.map(() => '?').join(',');
      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      await pg.prepare(sql).run(...cols.map((k) => row[k]));
    }
    total += rows.length;
    console.log(`✓ ${table}: ${rows.length}`);
  }
  console.log(`\n✅ Migrated ${total} rows to Postgres.`);
  await pool.end();
  process.exit(0);
}

main().catch((e) => { console.error('❌ migration failed:', e); process.exit(1); });
