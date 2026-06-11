/**
 * Verifies the Postgres adapter + schema against a real Postgres engine
 * (PGlite, in-process) — no server needed. Exercises DDL, named & positional
 * params, ON CONFLICT upsert, COUNT() bigint coercion, and a JOIN.
 *
 *   npx ts-node scripts/verify-postgres.ts
 */
import { PGlite } from '@electric-sql/pglite';
import { makePgDb } from '../src/db/engine';
import { SCHEMA, MIGRATIONS } from '../src/db/schema';

async function main() {
  const pg = new PGlite(); // ephemeral in-memory Postgres
  const db = makePgDb((text, values) => pg.query(text, values) as any, (sql) => pg.exec(sql));

  // 1) Schema + migrations
  await db.exec(SCHEMA);
  for (const [table, col, type] of MIGRATIONS) await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`);
  console.log('✓ schema + migrations applied on Postgres');

  // 2) Named-param insert (the @name style)
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO users (id,email,password_hash,name,role,created_at) VALUES (@id,@email,@ph,@name,@role,@t)`,
  ).run({ id: 'u1', email: 'a@test.com', ph: 'x', name: 'Ada', role: 'customer', t: now });

  // 3) Positional-param read
  const u = await db.prepare('SELECT id, email, role FROM users WHERE id = ?').get('u1') as any;
  if (u?.email !== 'a@test.com') throw new Error('named/positional param failed');
  console.log('✓ named + positional params work:', u.email, u.role);

  // 4) ON CONFLICT upsert
  await db.prepare(
    `INSERT INTO subscriptions (user_id, plan, status, provider, updated_at)
     VALUES (?, 'premium', 'active', 'mock', ?)
     ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, status='active', updated_at=excluded.updated_at`,
  ).run('u1', now);
  await db.prepare(
    `INSERT INTO subscriptions (user_id, plan, status, provider, updated_at)
     VALUES (?, 'coached', 'active', 'mock', ?)
     ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, status='active', updated_at=excluded.updated_at`,
  ).run('u1', now);
  const sub = await db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get('u1') as any;
  if (sub?.plan !== 'coached') throw new Error('ON CONFLICT upsert failed');
  console.log('✓ ON CONFLICT upsert works:', sub.plan);

  // 5) COUNT() returns a JS number (bigint coercion), not a string
  const c = await db.prepare('SELECT COUNT(*) n FROM users').get() as any;
  if (typeof c.n !== 'number' || c.n !== 1) throw new Error(`COUNT coercion failed: ${typeof c.n} ${c.n}`);
  console.log('✓ COUNT() coerced to number:', c.n);

  // 6) JOIN
  const row = await db.prepare(
    `SELECT u.email, s.plan FROM users u JOIN subscriptions s ON s.user_id = u.id WHERE u.id = ?`,
  ).get('u1') as any;
  if (row?.plan !== 'coached') throw new Error('JOIN failed');
  console.log('✓ JOIN works:', row.email, '→', row.plan);

  console.log('\n✅ Postgres adapter verified on a real Postgres engine (PGlite).');
  process.exit(0);
}

main().catch((e) => { console.error('❌ verification failed:', e); process.exit(1); });
