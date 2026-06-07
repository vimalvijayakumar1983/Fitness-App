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
  `);
}
