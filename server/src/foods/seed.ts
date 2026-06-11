import 'dotenv/config';
import { db, initSchema } from '../db';
import { makeId } from '../util';
import { SEED_FOODS } from './data';

/** Idempotently seeds the food database. Safe to run multiple times. */
export async function seedFoods(): Promise<number> {
  await initSchema();
  const insert = db.prepare(
    `INSERT INTO foods (id, name, brand, serving, calories, protein, carbs, fat, barcode)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  );
  const exists = db.prepare('SELECT 1 AS x FROM foods WHERE name = ? AND serving = ?');

  let added = 0;
  await db.tx(async () => {
    for (const f of SEED_FOODS) {
      if (await exists.get(f.name, f.serving)) continue;
      await insert.run(
        makeId(), f.name, f.brand ?? null, f.serving, f.calories,
        f.protein ?? null, f.carbs ?? null, f.fat ?? null, f.barcode ?? null,
      );
      added++;
    }
  });
  return added;
}

// Allow running directly: `npm run seed`
if (require.main === module) {
  seedFoods().then(async (added) => {
    const total = (await db.prepare('SELECT COUNT(*) AS c FROM foods').get()) as any;
    console.log(`Seeded ${added} new foods (total: ${total?.c}).`);
  });
}
