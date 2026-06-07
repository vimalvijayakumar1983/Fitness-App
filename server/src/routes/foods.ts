import { Router, Response } from 'express';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';

export const foodsRouter = Router();
foodsRouter.use(requireAuth);

/** GET /api/foods/search?q=oat — fuzzy name search in the food database. */
foodsRouter.get('/search', (req: AuthedRequest, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q) return res.json([]);
  const rows = db
    .prepare(
      `SELECT * FROM foods
       WHERE name LIKE ? OR brand LIKE ?
       ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, name
       LIMIT 40`,
    )
    .all(`%${q}%`, `%${q}%`, `${q}%`);
  res.json(rows);
});

/** GET /api/foods/barcode/:code — look up a packaged food by barcode. */
foodsRouter.get('/barcode/:code', (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM foods WHERE barcode = ?').get(req.params.code);
  if (!row) return res.status(404).json({ error: 'No food found for that barcode.' });
  res.json(row);
});
