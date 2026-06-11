import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import { initSchema, migrate, engine } from './db';
import { seedFoods } from './foods/seed';
import { seedContent } from './seed/content';
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
import { labsRouter } from './routes/labs';
import { programsRouter, coachesRouter, companyRouter, adminPhase2Router } from './routes/phase2';
import { challengesRouter, adminChallengesRouter } from './routes/challenges';
import { integrationsRouter } from './routes/integrations';
import { seedPhase2 } from './seed/phase2';

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
app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, coach: process.env.ANTHROPIC_API_KEY ? 'online' : 'offline' });
});

app.use('/api/auth', authRouter);
// Specific routers first, so the catch-all '/api' (auth-gated) logs router
// doesn't intercept public content reads.
app.use('/api/content', contentRouter);
app.use('/api/sync', syncRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminPhase2Router); // Phase 2 back-office (programs, coaches, companies)
app.use('/api/admin', adminChallengesRouter); // Challenges back-office
app.use('/api/challenges', challengesRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/me', mePlanRouter);
app.use('/api/billing', billingRouter);
app.use('/api/labs', labsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/coaches', coachesRouter);
app.use('/api/company', companyRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/coach', coachRouter);
app.use('/api', logsRouter); // /api/meals, /api/exercises, /api/moods, /api/sleep, /api/weights, /api/water

// Optional error monitoring (Sentry) — only when SENTRY_DSN is set and the
// package is installed. No hard dependency, so it's a no-op otherwise.
let sentry: any = null;
try {
  if (process.env.SENTRY_DSN) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require('@sentry/node');
    sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  }
} catch {
  sentry = null;
}

// Centralized error handler: logs (and reports), returns a clean JSON error.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  if (sentry) sentry.captureException(err);
  if (res.headersSent) return;
  res.status(err?.status || 500).json({ error: err?.message || 'Internal server error.' });
});

// Last-resort process guards so a stray rejection doesn't crash the server.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  if (sentry) sentry.captureException(reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  if (sentry) sentry.captureException(err);
});

// Initialize the database, run migrations, seed foods and the admin account,
// then start listening. All DB access is async (SQLite or Postgres).
async function start() {
  await initSchema();
  await migrate();
  await seedAdmin();
  const added = await seedFoods();
  if (added > 0) console.log(`Seeded ${added} foods.`);
  await seedContent();
  await seedPhase2();

  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`Fitness App API listening on http://localhost:${port} [${engine}]`);
    console.log(`AI coach: ${process.env.ANTHROPIC_API_KEY ? 'online (Claude)' : 'offline (rule-based)'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
