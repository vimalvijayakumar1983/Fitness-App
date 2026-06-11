import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';
import { todayISO } from '../util';

export const coachRouter = Router();
coachRouter.use(requireAuth);

const MODEL = 'claude-opus-4-8';

// Instantiate the client only when a key is present, so the coach degrades
// gracefully to a rule-based mode in local/dev without credentials.
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

const SYSTEM_PROMPT = `You are "Coach", the AI health coach for Al Zaabi Health — an AI-powered
preventive, metabolic and longevity health platform. You help users with nutrition, movement,
sleep, metabolic health, and healthy habits. Be warm, concise, and practical.
Give specific, actionable advice grounded in the user's recent data when it is provided.
You are not a doctor — for medical concerns or symptoms, advise the user to consult a professional.
Keep replies short (a few sentences) unless the user asks for detail.`;

/** Builds a one-line snapshot of today's logged data for grounding. */
function todaysContext(userId: string): string {
  const date = todayISO();
  const meals = db
    .prepare('SELECT items FROM meals WHERE user_id = ? AND date = ?')
    .all(userId, date) as { items: string }[];
  let cals = 0;
  for (const m of meals) for (const i of JSON.parse(m.items) as any[]) cals += i.calories || 0;

  const ex = db
    .prepare(
      'SELECT COALESCE(SUM(duration_minutes),0) AS mins, COALESCE(SUM(steps),0) AS steps FROM exercises WHERE user_id = ? AND date = ?',
    )
    .get(userId, date) as { mins: number; steps: number };
  const sleep = db
    .prepare('SELECT COALESCE(SUM(duration_minutes),0) AS mins FROM sleep WHERE user_id = ? AND date = ?')
    .get(userId, date) as { mins: number };
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(userId) as any;

  return [
    `Today's data (${date}):`,
    `- Calories eaten: ${cals}${goals?.daily_calories ? ` / ${goals.daily_calories} goal` : ''}`,
    `- Exercise: ${ex.mins} min, ${ex.steps} steps${goals?.daily_steps ? ` / ${goals.daily_steps} steps goal` : ''}`,
    `- Sleep: ${Math.round(sleep.mins)} min`,
  ].join('\n');
}

/* ----------------------------- Chat ------------------------------ */

const chatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .optional(),
  // Optional client-computed health snapshot (longevity, glucose, program, …).
  context: z.string().max(2000).optional(),
});

coachRouter.post('/chat', async (req: AuthedRequest, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { message, history = [], context: clientContext } = parsed.data;
  const context = [todaysContext(req.userId!), clientContext].filter(Boolean).join('\n\n');

  if (!anthropic) {
    return res.json({ reply: offlineReply(message, context), offline: true });
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user' as const, content: `${context}\n\nUser: ${message}` },
      ],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    res.json({ reply: text, offline: false });
  } catch (err) {
    console.error('Coach chat error:', err);
    res.json({ reply: offlineReply(message, context), offline: true });
  }
});

/* ----------------------- Daily briefing (agent) ------------------ */

const briefingSchema = z.object({
  context: z.string().max(2000).optional(),
  facts: z
    .object({
      name: z.string().optional(),
      partOfDay: z.enum(['morning', 'afternoon', 'evening']).default('morning'),
      longevityScore: z.number().optional(),
      bioAge: z.number().optional(),
      chronoAge: z.number().optional(),
      glucoseAvg: z.number().optional(),
      tirPct: z.number().optional(),
      weightChangeKg: z.number().optional(),
      programName: z.string().optional(),
      tasksLeft: z.number().optional(),
      caloriesIn: z.number().optional(),
      calorieTarget: z.number().optional(),
      activeMinutes: z.number().optional(),
      loggedToday: z.boolean().optional(),
    })
    .default({}),
});

/** Rule-based briefing so the agent works without an API key. */
function ruleBriefing(f: z.infer<typeof briefingSchema>['facts']): { headline: string; items: string[]; focus: string } {
  const greet = f.partOfDay === 'evening' ? 'Good evening' : f.partOfDay === 'afternoon' ? 'Good afternoon' : 'Good morning';
  const headline = `${greet}${f.name ? `, ${f.name}` : ''} — here's your focus today.`;
  const items: string[] = [];
  if (f.tasksLeft && f.programName) items.push(`Finish ${f.tasksLeft} task${f.tasksLeft > 1 ? 's' : ''} in your ${f.programName} program this week.`);
  if (f.tirPct != null && f.tirPct < 70) items.push(`Glucose time-in-range is ${f.tirPct}% — add a 10-min walk after meals to lift it.`);
  else if (f.glucoseAvg != null) items.push(`Log a fasting glucose reading to keep your trend accurate.`);
  if (f.calorieTarget && f.caloriesIn != null && f.caloriesIn < f.calorieTarget * 0.5 && f.partOfDay !== 'morning') items.push(`You're at ${f.caloriesIn}/${f.calorieTarget} kcal — fuel up with protein.`);
  if (!f.activeMinutes) items.push('No movement logged yet — even 20 minutes counts.');
  if (f.weightChangeKg != null && f.weightChangeKg < 0) items.push(`Nice — you're down ${Math.abs(f.weightChangeKg)}kg recently. Keep the momentum.`);
  if (items.length === 0) items.push('You\'re on track. Log your meals and movement to keep your streak alive.');

  let focus = 'Consistency beats intensity — small wins today compound.';
  if (f.bioAge != null && f.chronoAge != null && f.bioAge > f.chronoAge) focus = `Your biological age is ${(f.bioAge - f.chronoAge).toFixed(0)} yrs above your real age — today's habits can close that gap.`;
  else if (f.longevityScore != null && f.longevityScore >= 80) focus = `Longevity score ${f.longevityScore}/100 — excellent. Protect it with sleep and movement.`;
  return { headline, items: items.slice(0, 4), focus };
}

coachRouter.post('/briefing', async (req: AuthedRequest, res: Response) => {
  const parsed = briefingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { facts, context } = parsed.data;
  const fallback = ruleBriefing(facts);

  if (!anthropic) return res.json({ ...fallback, offline: true });

  try {
    const sys = `You are the proactive daily health agent for Al Zaabi Health. Using the user's data, write a short, warm, specific daily briefing. Respond ONLY as JSON: {"headline": string, "items": string[3-4 short actionable bullets], "focus": string (one motivating sentence)}. Be concrete and reference their numbers. Not medical advice.`;
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: sys,
      messages: [{ role: 'user', content: `${context ?? ''}\n\nFacts: ${JSON.stringify(facts)}\n\nWrite today's briefing as JSON.` }],
    });
    const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : fallback;
    res.json({
      headline: json.headline ?? fallback.headline,
      items: Array.isArray(json.items) && json.items.length ? json.items.slice(0, 4) : fallback.items,
      focus: json.focus ?? fallback.focus,
      offline: false,
    });
  } catch {
    res.json({ ...fallback, offline: true });
  }
});

/* ----------------------- Photo food analysis --------------------- */

const analyzeSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).default('image/jpeg'),
});

// Constrain the model's output to a parseable shape (structured outputs).
const FOOD_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
        },
        required: ['name', 'calories'],
        additionalProperties: false,
      },
    },
    note: { type: 'string' },
  },
  required: ['items'],
  additionalProperties: false,
} as const;

coachRouter.post('/analyze-food', async (req: AuthedRequest, res: Response) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { imageBase64, mediaType } = parsed.data;

  if (!anthropic) {
    return res.status(503).json({
      error: 'Photo food logging requires the AI coach to be configured (ANTHROPIC_API_KEY).',
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        'You are a nutrition vision assistant. Identify the foods in the image and estimate ' +
        'calories and macros (grams) for the visible portion. Be realistic; if unsure, give your best estimate.',
      output_config: { format: { type: 'json_schema', schema: FOOD_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'What foods are in this photo? Estimate calories and macros.' },
          ],
        },
      ],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    res.json(JSON.parse(text));
  } catch (err) {
    console.error('Food analysis error:', err);
    res.status(502).json({ error: 'Could not analyze the photo. Please try again or log manually.' });
  }
});

/** Rule-based fallback so the coach is still useful without an API key. */
function offlineReply(message: string, context: string): string {
  const m = message.toLowerCase();
  let tip = "I'm here to help with food, exercise, sleep and mood. Ask me anything!";
  if (m.includes('protein')) tip = 'Aim for ~1.6–2.2 g of protein per kg of body weight on training days.';
  else if (m.includes('sleep')) tip = 'Target 7–9 hours. A consistent bedtime and less screen time before bed help most.';
  else if (m.includes('weight') || m.includes('lose') || m.includes('fat'))
    tip = 'Sustainable fat loss is ~0.5 kg/week — a modest calorie deficit plus strength training and protein.';
  else if (m.includes('water') || m.includes('hydrat'))
    tip = 'A common target is ~2–3 L/day, more if you exercise or it is hot.';
  else if (m.includes('stress') || m.includes('anxious') || m.includes('mood'))
    tip = 'Short walks, breathing exercises, and regular sleep do a lot for mood. Be kind to yourself.';
  return `${tip}\n\n(Offline mode — set ANTHROPIC_API_KEY to enable full AI coaching.)\n\nFor reference:\n${context}`;
}
