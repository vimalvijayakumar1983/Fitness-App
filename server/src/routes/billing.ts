import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';
import { getPricing } from '../settings';

/**
 * Stage 3 — billing. Works in two modes:
 *  - Stripe mode (STRIPE_SECRET_KEY set): real Checkout + webhook.
 *  - Dev/mock mode (no key): /checkout instantly activates the tier so the
 *    paywall flow is fully testable before keys are added.
 */
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;

type Tier = 'premium' | 'coached';
type Interval = 'month' | 'year';

const now = () => new Date().toISOString();

function readSub(userId: string) {
  const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId) as any;
  const plan = row?.plan ?? 'free';
  const status = row?.status ?? 'none';
  return { plan, status, isPremium: (plan === 'premium' || plan === 'coached') && (status === 'active' || status === 'trialing') };
}

function writeSub(userId: string, plan: string, status: string, provider: string, customerId?: string, periodEnd?: string) {
  db.prepare(
    `INSERT INTO subscriptions (user_id, plan, status, provider, stripe_customer_id, current_period_end, updated_at)
     VALUES (@uid,@plan,@status,@provider,@cust,@pe,@t)
     ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, status=excluded.status, provider=excluded.provider,
       stripe_customer_id=COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
       current_period_end=excluded.current_period_end, updated_at=excluded.updated_at`,
  ).run({ uid: userId, plan, status, provider, cust: customerId ?? null, pe: periodEnd ?? null, t: now() });
}

export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.get('/subscription', (req: AuthedRequest, res: Response) => {
  res.json({ ...readSub(req.userId!), stripe: !!stripe });
});

billingRouter.post('/checkout', async (req: AuthedRequest, res: Response) => {
  const tier = (req.body?.tier as Tier) ?? 'premium';
  const interval = (req.body?.interval as Interval) ?? 'month';
  const currency = ((req.body?.currency as string) ?? 'usd').toLowerCase();
  const PRICES = getPricing();
  const amount = PRICES[tier]?.[interval]?.[currency] ?? PRICES[tier]?.[interval]?.usd;
  if (!amount) return res.status(400).json({ error: 'Unknown plan or currency.' });

  // Dev/mock mode: no Stripe key → activate immediately so the flow is testable.
  if (!stripe) {
    const periodEnd = new Date(Date.now() + (interval === 'year' ? 365 : 30) * 864e5).toISOString();
    writeSub(req.userId!, tier, 'active', 'mock', undefined, periodEnd);
    return res.json({ mock: true, url: null, ...readSub(req.userId!) });
  }

  const base = process.env.APP_URL || req.headers.origin || '';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          product_data: { name: `${tier === 'coached' ? 'Coached' : 'Premium'} (${interval}ly)` },
          recurring: { interval },
          unit_amount: amount,
        },
      },
    ],
    success_url: `${base}/?billing=success`,
    cancel_url: `${base}/?billing=cancel`,
    client_reference_id: req.userId,
    metadata: { userId: req.userId!, tier },
  });
  res.json({ url: session.url });
});

/** Raw-body webhook handler (mounted before express.json in index.ts). */
export async function billingWebhook(req: Request, res: Response) {
  let event: Stripe.Event;
  try {
    if (stripe && WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature'] as string;
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, WEBHOOK_SECRET);
    } else {
      event = JSON.parse((req.body as Buffer).toString());
    }
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    const userId = (s.client_reference_id || (s.metadata as any)?.userId) as string | undefined;
    const tier = ((s.metadata as any)?.tier as string) || 'premium';
    if (userId) writeSub(userId, tier, 'active', 'stripe', (s.customer as string) ?? undefined);
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const row = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_customer_id = ?').get(sub.customer as string) as any;
    if (row) writeSub(row.user_id, 'free', 'canceled', 'stripe', sub.customer as string);
  }
  res.json({ received: true });
}
