import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || './data/fitness.db';

// Ensure the data directory exists.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/** Creates all tables if they don't already exist. */
export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      type TEXT NOT NULL,
      items TEXT NOT NULL,        -- JSON array of FoodItem
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      activity TEXT NOT NULL,
      duration_minutes REAL NOT NULL,
      calories_burned REAL,
      steps INTEGER,
      avg_heart_rate INTEGER,
      source TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_exercises_user_date ON exercises(user_id, date);

    CREATE TABLE IF NOT EXISTS moods (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      mood INTEGER NOT NULL,
      stress INTEGER,
      energy INTEGER,
      tags TEXT,                  -- JSON array of strings
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_moods_user_date ON moods(user_id, date);

    CREATE TABLE IF NOT EXISTS sleep (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      bedtime TEXT NOT NULL,
      wake_time TEXT NOT NULL,
      duration_minutes REAL NOT NULL,
      quality INTEGER NOT NULL,
      source TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sleep_user_date ON sleep(user_id, date);

    CREATE TABLE IF NOT EXISTS weights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      body_fat_pct REAL
    );
    CREATE INDEX IF NOT EXISTS idx_weights_user_date ON weights(user_id, date);

    CREATE TABLE IF NOT EXISTS water (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      amount_ml REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_water_user_date ON water(user_id, date);

    CREATE TABLE IF NOT EXISTS goals (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      daily_calories INTEGER,
      daily_protein INTEGER,
      daily_steps INTEGER,
      daily_water_ml INTEGER,
      sleep_hours REAL,
      target_weight_kg REAL,
      updated_at TEXT NOT NULL
    );

    -- Shared, read-only food database used for search/logging.
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      serving TEXT NOT NULL,      -- e.g. "1 cup", "100 g"
      calories REAL NOT NULL,
      protein REAL,
      carbs REAL,
      fat REAL,
      barcode TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
    CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);

    -- ── CMS: admin-managed content that the app merges over its bundled data ──
    CREATE TABLE IF NOT EXISTS cms_foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      serving TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'meal',
      image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cms_exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      muscle TEXT NOT NULL,
      equipment TEXT,
      met REAL NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cms_recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT,
      meal_types TEXT NOT NULL,    -- JSON array
      diets TEXT NOT NULL,         -- JSON array
      time_min INTEGER,
      calories REAL NOT NULL,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      ingredients TEXT NOT NULL,   -- JSON array of {name, quantity}
      steps TEXT NOT NULL,         -- JSON array of strings
      image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Customer classifications / segments (VIP, PCOS, Keto cut, Ramadan, …).
    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL
    );

    -- Per-user app state blob for cloud sync (app-owned data).
    CREATE TABLE IF NOT EXISTS user_state (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Reusable meal-plan templates built by staff.
    CREATE TABLE IF NOT EXISTS plan_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      segment_id TEXT,
      meals TEXT NOT NULL,        -- JSON array of plan meals
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- A plan assigned to a specific customer (admin-owned; delivered read-only).
    CREATE TABLE IF NOT EXISTS customer_plans (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      meals TEXT NOT NULL,        -- JSON array of plan meals
      template_id TEXT,
      assigned_at TEXT NOT NULL
    );

    -- Subscription / entitlement per user (free / premium / coached).
    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',     -- free | premium | coached
      status TEXT NOT NULL DEFAULT 'none',   -- none | trialing | active | canceled
      provider TEXT,                          -- stripe | mock
      stripe_customer_id TEXT,
      current_period_end TEXT,
      updated_at TEXT NOT NULL
    );

    -- Key/value app settings (e.g. pricing config), editable from the admin.
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ── Phase 2: Condition-reversal programs (admin-managed, public read) ──
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      slug TEXT,
      name TEXT NOT NULL,
      condition TEXT NOT NULL,        -- diabetes | obesity | hypertension | metabolic | ...
      tagline TEXT,
      description TEXT,
      duration_weeks INTEGER NOT NULL DEFAULT 12,
      image_url TEXT,
      color TEXT,
      outcomes TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
      modules TEXT NOT NULL DEFAULT '[]',   -- JSON array of {week,title,focus,tasks[]}
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- A user's enrollment in a program with weekly progress.
    CREATE TABLE IF NOT EXISTS program_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      current_week INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active', -- active | paused | completed
      completed_tasks TEXT NOT NULL DEFAULT '[]', -- JSON array of "w{week}:{index}" keys
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, program_id)
    );
    CREATE INDEX IF NOT EXISTS idx_enroll_user ON program_enrollments(user_id);

    -- ── Phase 2: Coaching marketplace (admin-managed, public read) ──
    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT,
      specialties TEXT NOT NULL DEFAULT '[]', -- JSON array
      bio TEXT,
      photo_url TEXT,
      rating REAL NOT NULL DEFAULT 5,
      reviews INTEGER NOT NULL DEFAULT 0,
      price_month_usd REAL NOT NULL DEFAULT 99,
      languages TEXT NOT NULL DEFAULT '[]',   -- JSON array
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- A customer's booking/relationship with a coach.
    CREATE TABLE IF NOT EXISTS coach_bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      coach_id TEXT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'requested', -- requested | active | ended
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_booking_user ON coach_bookings(user_id);

    -- ── Phase 2: Corporate wellness (B2B orgs whose employees are members) ──
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      join_code TEXT UNIQUE NOT NULL,
      seats INTEGER NOT NULL DEFAULT 50,
      contact_email TEXT,
      plan TEXT NOT NULL DEFAULT 'premium', -- entitlement granted to employees
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

/**
 * Idempotent column migrations for tables that predate newer columns.
 * better-sqlite3 throws if a column already exists, so each is guarded.
 */
export function migrate(): void {
  const add = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      /* column already exists */
    }
  };
  add(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'`);
  add(`ALTER TABLE users ADD COLUMN segment_id TEXT`);
  add(`ALTER TABLE users ADD COLUMN company_id TEXT`);
}
