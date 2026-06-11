/**
 * Database engine abstraction. The app talks to one async interface; the
 * concrete driver is SQLite (better-sqlite3) for local/dev and Postgres (pg)
 * in production when DATABASE_URL is set.
 *
 *   const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
 *   await db.prepare('INSERT INTO x (id,name) VALUES (@id,@name)').run({ id, name });
 *
 * Statements accept either positional (`?`) or named (`@name`) parameters,
 * exactly like better-sqlite3; the Postgres adapter translates them to `$n`.
 */

export interface RunResult {
  changes: number;
}

export interface Statement {
  get<T = any>(...params: any[]): Promise<T | undefined>;
  all<T = any>(...params: any[]): Promise<T[]>;
  run(...params: any[]): Promise<RunResult>;
}

export interface Db {
  engine: 'sqlite' | 'postgres';
  prepare(sql: string): Statement;
  exec(sql: string): Promise<void>;
  /** Runs fn inside a transaction. */
  tx<T>(fn: () => Promise<T>): Promise<T>;
}

const isPlainObject = (v: any) =>
  v != null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

// ───────────────────────────── SQLite ─────────────────────────────
export function makeSqliteDb(filePath: string): Db {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const sqlite = new Database(filePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const prepare = (sql: string): Statement => {
    const stmt = sqlite.prepare(sql);
    const args = (p: any[]) => (p.length === 1 && (Array.isArray(p[0]) || isPlainObject(p[0])) ? p[0] : p);
    return {
      async get<T>(...p: any[]) { return stmt.get(...([] as any[]).concat(args(p))) as T | undefined; },
      async all<T>(...p: any[]) { return stmt.all(...([] as any[]).concat(args(p))) as T[]; },
      async run(...p: any[]) { const r = stmt.run(...([] as any[]).concat(args(p))); return { changes: r.changes }; },
    };
  };

  return {
    engine: 'sqlite',
    prepare,
    async exec(sql: string) { sqlite.exec(sql); },
    async tx<T>(fn: () => Promise<T>) {
      sqlite.exec('BEGIN');
      try { const r = await fn(); sqlite.exec('COMMIT'); return r; }
      catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
}

// ──────────────────────────── Postgres ────────────────────────────
type PgQuery = (text: string, values?: any[]) => Promise<{ rows: any[]; rowCount?: number | null; affectedRows?: number }>;
type PgExec = (sql: string) => Promise<unknown>;

/** Translates `?` / `@name` parameter styles into Postgres `$n` placeholders. */
function toPg(sql: string, params: any[]): { text: string; values: any[] } {
  if (params.length === 1 && isPlainObject(params[0])) {
    const obj = params[0];
    const map = new Map<string, string>();
    const values: any[] = [];
    const text = sql.replace(/@(\w+)/g, (_m, k: string) => {
      if (!map.has(k)) { values.push(obj[k]); map.set(k, `$${values.length}`); }
      return map.get(k)!;
    });
    return { text, values };
  }
  const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  let i = 0;
  const text = sql.replace(/\?/g, () => `$${++i}`);
  return { text, values: flat };
}

// Postgres returns COUNT()/SUM(int) as bigint; coerce so call sites get numbers.
const coerce = (row: any) => {
  if (!row) return row;
  for (const k of Object.keys(row)) if (typeof row[k] === 'bigint') row[k] = Number(row[k]);
  return row;
};

export function makePgDb(query: PgQuery, exec: PgExec): Db {
  const prepare = (sql: string): Statement => ({
    async get<T>(...p: any[]) { const { text, values } = toPg(sql, p); const r = await query(text, values); return coerce(r.rows[0]) as T | undefined; },
    async all<T>(...p: any[]) { const { text, values } = toPg(sql, p); const r = await query(text, values); return r.rows.map(coerce) as T[]; },
    async run(...p: any[]) { const { text, values } = toPg(sql, p); const r = await query(text, values); return { changes: r.rowCount ?? r.affectedRows ?? 0 }; },
  });
  return {
    engine: 'postgres',
    prepare,
    async exec(sql: string) { await exec(sql); },
    async tx<T>(fn: () => Promise<T>) {
      await exec('BEGIN');
      try { const r = await fn(); await exec('COMMIT'); return r; }
      catch (e) { await exec('ROLLBACK'); throw e; }
    },
  };
}
