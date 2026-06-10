import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import { initSchema, migrate } from './db';
import { seedFoods } from './foods/seed';
import { authRouter, seedAdmin } from './auth';
import { logsRouter } from './routes/logs';
import { goalsRouter } from './routes/goals';
import { foodsRouter } from './routes/foods';
import { analyticsRouter } from './routes/analytics';
import { coachRouter } from './routes/coach';
import { contentRouter } from './routes/content';
import { syncRouter } from './routes/sync';
import { adminRouter, mePlanRouter } from './routes/plans';
import { billingRouter, billingWebhook } from './routes/billing';

const app = express();

// Stripe webhook needs the raw body for signature verification — mount it
// BEFORE express.json so the body isn't parsed.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingWebhook);

// Photos for food analysis can be a few hundred KB of base64.
app.use(express.json({ limit: '12mb' }));

// CORS: open by default. Set CORS_ORIGINS to a comma-separated allowlist of
// your admin + app URLs. Entries may be exact origins (https://app.com) or
// wildcards (*.vercel.app) which match any subdomain — handy for previews.
const corsRules = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
const corsOptions: CorsOptions | undefined =
  corsRules && corsRules.length
    ? {
        origin(origin, cb) {
          // Allow non-browser / same-origin requests (no Origin header).
          if (!origin) return cb(null, true);
          const ok = corsRules.some(
            (rule) => rule === origin || (rule.startsWith('*.') && origin.endsWith(rule.slice(1))),
          );
          cb(null, ok);
        },
      }
    : undefined;
app.use(cors(corsOptions));

// Health check.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, coach: process.env.ANTHROPIC_API_KEY ? 'online' : 'offline' });
});

app.use('/api/auth', authRouter);
// Specific routers first, so the catch-all '/api' (auth-gated) logs router
// doesn't intercept public content reads.
app.use('/api/content', contentRouter);
app.use('/api/sync', syncRouter);
app.use('/api/admin', adminRouter);
app.use('/api/me', mePlanRouter);
app.use('/api/billing', billingRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/coach', coachRouter);
app.use('/api', logsRouter); // /api/meals, /api/exercises, /api/moods, /api/sleep, /api/weights, /api/water

// Initialize the database, run migrations, seed foods and the admin account.
initSchema();
migrate();
seedAdmin();
const added = seedFoods();
if (added > 0) console.log(`Seeded ${added} foods.`);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Fitness App API listening on http://localhost:${port}`);
  console.log(`AI coach: ${process.env.ANTHROPIC_API_KEY ? 'online (Claude)' : 'offline (rule-based)'}`);
});
