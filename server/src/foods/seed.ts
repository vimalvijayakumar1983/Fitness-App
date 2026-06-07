import 'dotenv/config';
import { db, initSchema } from '../db';
import { makeId } from '../util';
import { SEED_FOODS } from './data';

/** Idempotently seeds the food database. Safe to run multiple times. */
export function seedFoods(): number {
  initSchema();
  const insert = db.prepare(
    `INSERT INTO foods (id, name, brand, serving, calories, protein, carbs, fat, barcode)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  );
  const exists = db.prepare('SELECT 1 FROM foods WHERE name = ? AND serving = ?');

  let added = 0;
  const tx = db.transaction(() => {
    for (const f of SEED_FOODS) {
      if (exists.get(f.name, f.serving)) continue;
      insert.run(
        makeId(),
        f.name,
        f.brand ?? null,
        f.serving,
        f.calories,
        f.protein ?? null,
        f.carbs ?? null,
        f.fat ?? null,
        f.barcode ?? null,
      );
      added++;
    }
  });
  tx();
  return added;
}

// Allow running directly: `npm run seed`
if (require.main === module) {
  const added = seedFoods();
  console.log(`Seeded ${added} new foods (total: ${db.prepare('SELECT COUNT(*) AS c FROM foods').get()}).`);
}
