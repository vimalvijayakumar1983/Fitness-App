export const SCHEMA = `
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
      items TEXT NOT NULL,
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
      tags TEXT,
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

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      serving TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL,
      carbs REAL,
      fat REAL,
      barcode TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
    CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);

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
      meal_types TEXT NOT NULL,
      diets TEXT NOT NULL,
      time_min INTEGER,
      calories REAL NOT NULL,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_state (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plan_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      segment_id TEXT,
      meals TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_plans (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      meals TEXT NOT NULL,
      template_id TEXT,
      assigned_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'none',
      provider TEXT,
      stripe_customer_id TEXT,
      current_period_end TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      slug TEXT,
      name TEXT NOT NULL,
      condition TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      duration_weeks INTEGER NOT NULL DEFAULT 12,
      image_url TEXT,
      color TEXT,
      outcomes TEXT NOT NULL DEFAULT '[]',
      modules TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS program_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      current_week INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      completed_tasks TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, program_id)
    );
    CREATE INDEX IF NOT EXISTS idx_enroll_user ON program_enrollments(user_id);

    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT,
      specialties TEXT NOT NULL DEFAULT '[]',
      bio TEXT,
      photo_url TEXT,
      rating REAL NOT NULL DEFAULT 5,
      reviews INTEGER NOT NULL DEFAULT 0,
      price_month_usd REAL NOT NULL DEFAULT 99,
      languages TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coach_bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      coach_id TEXT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'requested',
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_booking_user ON coach_bookings(user_id);

    CREATE TABLE IF NOT EXISTS coach_messages (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES coach_bookings(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_msg_booking ON coach_messages(booking_id);

    CREATE TABLE IF NOT EXISTS integration_links (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT,
      created_at TEXT NOT NULL,
      last_sync_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_intlink_user ON integration_links(user_id);

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      emoji TEXT,
      metric TEXT NOT NULL,
      goal REAL NOT NULL,
      unit TEXT,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS challenge_participants (
      challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      progress REAL NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (challenge_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_cp_user ON challenge_participants(user_id);

    CREATE TABLE IF NOT EXISTS push_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_push_user ON push_tokens(user_id);

    CREATE TABLE IF NOT EXISTS password_resets (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      join_code TEXT UNIQUE NOT NULL,
      seats INTEGER NOT NULL DEFAULT 50,
      contact_email TEXT,
      plan TEXT NOT NULL DEFAULT 'premium',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
`;

export const MIGRATIONS: Array<[string, string, string]> = [
  ['users', 'role', "TEXT NOT NULL DEFAULT 'customer'"],
  ['users', 'segment_id', 'TEXT'],
  ['users', 'company_id', 'TEXT'],
  ['subscriptions', 'stripe_subscription_id', 'TEXT'],
];
