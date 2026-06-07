import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './db';
import { seedFoods } from './foods/seed';
import { authRouter } from './auth';
import { logsRouter } from './routes/logs';
import { goalsRouter } from './routes/goals';
import { foodsRouter } from './routes/foods';
import { analyticsRouter } from './routes/analytics';
import { coachRouter } from './routes/coach';

const app = express();
// Photos for food analysis can be a few hundred KB of base64.
app.use(express.json({ limit: '12mb' }));
app.use(cors());

// Health check.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, coach: process.env.ANTHROPIC_API_KEY ? 'online' : 'offline' });
});

app.use('/api/auth', authRouter);
app.use('/api', logsRouter); // /api/meals, /api/exercises, /api/moods, /api/sleep, /api/weights, /api/water
app.use('/api/goals', goalsRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/coach', coachRouter);

// Initialize the database and seed the food table on boot.
initSchema();
const added = seedFoods();
if (added > 0) console.log(`Seeded ${added} foods.`);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Fitness App API listening on http://localhost:${port}`);
  console.log(`AI coach: ${process.env.ANTHROPIC_API_KEY ? 'online (Claude)' : 'offline (rule-based)'}`);
});
