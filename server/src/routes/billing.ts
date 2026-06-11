import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';
import { getPricing } from '../settings';
import { sendEmail, receiptEmail } from '../email';

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
  const paidPlan = plan === 'premium' || plan === 'coached';
  // 'canceling' keeps access until the period end; only fully past-due/canceled loses it.
  const active = status === 'active' || status === 'trialing' || status === 'canceling';
  return {
    plan,
    status,
    isPremium: paidPlan && active,
    currentPeriodEnd: row?.current_period_end ?? null,
    cancelAtPeriodEnd: status === 'canceling',
  };
}

function writeSub(
  userId: string,
  plan: string,
  status: string,
  provider: string,
  customerId?: string,
  periodEnd?: string,
  subscriptionId?: string,
) {
  db.prepare(
    `INSERT INTO subscriptions (user_id, plan, status, provider, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
     VALUES (@uid,@plan,@status,@provider,@cust,@sub,@pe,@t)
     ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, status=excluded.status, provider=excluded.provider,
       stripe_customer_id=COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
       stripe_subscription_id=COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
       current_period_end=excluded.current_period_end, updated_at=excluded.updated_at`,
  ).run({ uid: userId, plan, status, provider, cust: customerId ?? null, sub: subscriptionId ?? null, pe: periodEnd ?? null, t: now() });
}

export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.get('/subscription', (req: AuthedRequest, res: Response) => {
  res.json({ ...readSub(req.userId!), stripe: !!stripe });
});

billingRouter.post('/checkout', async (req: AuthedRequest, res: Response) => {
  const tier = (req.body?.tier as Tier) ?? 'premium';
  const interval = (req.body?.interval as Interval) ?? 'month';
  const currency = ((req.body?.currency as string) ?? 'aed').toLowerCase();
  const PRICES = getPricing();
  const amount = PRICES[tier]?.[interval]?.[currency] ?? PRICES[tier]?.[interval]?.usd;
  if (!amount) return res.status(400).json({ error: 'Unknown plan or currency.' });

  // Dev/mock mode: no Stripe key → activate immediately so the flow is testable.
  if (!stripe) {
    const periodEnd = new Date(Date.now() + (interval === 'year' ? 365 : 30) * 864e5).toISOString();
    writeSub(req.userId!, tier, 'active', 'mock', undefined, periodEnd);
    void emailReceipt(req.userId!, tier, amount, currency);
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

/**
 * Cancel the subscription. Stripe mode: cancel at period end (keeps access
 * until then). Mock mode: flag as canceling, access until current_period_end.
 */
billingRouter.post('/cancel', async (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(req.userId) as any;
  if (!row || row.plan === 'free') return res.status(400).json({ error: 'No active subscription.' });

  if (stripe && row.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(row.stripe_subscription_id, { cancel_at_period_end: true });
    } catch (e: any) {
      return res.status(502).json({ error: e.message || 'Could not cancel with Stripe.' });
    }
  }
  // Mark as canceling — access continues until current_period_end.
  db.prepare("UPDATE subscriptions SET status='canceling', updated_at=? WHERE user_id=?").run(now(), req.userId);
  res.json({ ok: true, ...readSub(req.userId!) });
});

/** Undo a pending cancellation (re-activate before period end). */
billingRouter.post('/reactivate', async (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(req.userId) as any;
  if (!row || row.status !== 'canceling') return res.status(400).json({ error: 'Nothing to reactivate.' });
  if (stripe && row.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(row.stripe_subscription_id, { cancel_at_period_end: false });
    } catch (e: any) {
      return res.status(502).json({ error: e.message || 'Could not reactivate with Stripe.' });
    }
  }
  db.prepare("UPDATE subscriptions SET status='active', updated_at=? WHERE user_id=?").run(now(), req.userId);
  res.json({ ok: true, ...readSub(req.userId!) });
});

/** Open the Stripe customer billing portal (manage card, invoices). */
billingRouter.post('/portal', async (req: AuthedRequest, res: Response) => {
  if (!stripe) return res.json({ url: null, mock: true });
  const row = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?').get(req.userId) as any;
  if (!row?.stripe_customer_id) return res.status(400).json({ error: 'No billing account yet.' });
  const base = process.env.APP_URL || req.headers.origin || '';
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: base || undefined,
  });
  res.json({ url: session.url });
});

/** Emails a receipt for a completed payment (best-effort). */
async function emailReceipt(userId: string, tier: string, amountMinor: number, currency: string) {
  const u = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
  if (!u) return;
  const label = `${(amountMinor / 100).toFixed(2)} ${currency.toUpperCase()}`;
  await sendEmail(receiptEmail(u.email, tier === 'coached' ? 'Coached' : 'Premium', label));
}

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
    if (userId) {
      writeSub(userId, tier, 'active', 'stripe', (s.customer as string) ?? undefined, undefined, (s.subscription as string) ?? undefined);
      if (s.amount_total != null) void emailReceipt(userId, tier, s.amount_total, s.currency || 'usd');
    }
  } else if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const row = db.prepare('SELECT user_id, plan FROM subscriptions WHERE stripe_customer_id = ?').get(sub.customer as string) as any;
    if (row) {
      const status = sub.cancel_at_period_end ? 'canceling' : sub.status === 'active' ? 'active' : sub.status;
      const periodEnd = (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : undefined;
      writeSub(row.user_id, row.plan, status, 'stripe', sub.customer as string, periodEnd, sub.id);
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const row = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_customer_id = ?').get(sub.customer as string) as any;
    if (row) writeSub(row.user_id, 'free', 'canceled', 'stripe', sub.customer as string);
  }
  res.json({ received: true });
}
