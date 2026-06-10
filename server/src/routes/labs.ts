import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { AuthedRequest, requireAuth } from '../auth';

/**
 * AI lab-report analysis. A user uploads a photo/PDF of a blood panel; Claude
 * (vision/document) extracts each marker, flags out-of-range values, and
 * explains them in plain language. Degrades gracefully without an API key.
 */
export const labsRouter = Router();
labsRouter.use(requireAuth);

const MODEL = 'claude-opus-4-8';
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

const SYSTEM = `You are a clinical lab-report analyzer for a preventive & metabolic health app.
From the provided lab report image/PDF, extract every test result. Respond with ONLY valid JSON:
{"summary": string, "markers": [{"name": string, "value": string, "unit": string, "range": string,
"status": "low"|"normal"|"high"|"unknown", "note": string}]}
- "note" is a short plain-language explanation (one sentence).
- "summary" is 1-2 sentences highlighting anything notable.
- Do NOT give a diagnosis or treatment. If the image isn't a lab report, return an empty markers array
  with a summary saying so.`;

const schema = z.object({
  imageBase64: z.string().min(10),
  mediaType: z.string().default('image/jpeg'),
});

labsRouter.post('/analyze', async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Provide imageBase64 and mediaType.' });
  const { imageBase64, mediaType } = parsed.data;

  if (!anthropic) {
    return res.json({
      offline: true,
      summary: 'AI lab analysis is offline. Add ANTHROPIC_API_KEY on the server to enable it.',
      markers: [],
    });
  }

  const block =
    mediaType === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: imageBase64 } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType as any, data: imageBase64 } };

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: [block, { type: 'text', text: 'Extract all lab markers as JSON.' }] }],
    });
    const text = msg.content.filter((c) => c.type === 'text').map((c: any) => c.text).join('\n');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : { summary: 'Could not read the report.', markers: [] };
    res.json({ summary: json.summary ?? '', markers: Array.isArray(json.markers) ? json.markers : [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Analysis failed.' });
  }
});
