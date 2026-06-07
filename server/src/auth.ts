import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './db';
import { makeId } from './util';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';
const TOKEN_TTL = '30d';

export interface AuthedRequest extends Request {
  userId?: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
}

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export const authRouter = Router();

authRouter.post('/register', (req: Request, res: Response) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email or password (min 6 chars).' });
  }
  const { email, password, name } = parsed.data;

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const id = makeId();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, email.toLowerCase(), passwordHash, name ?? null, new Date().toISOString());

  return res.status(201).json({
    token: signToken(id),
    user: { id, email: email.toLowerCase(), name: name ?? null },
  });
});

authRouter.post('/login', (req: Request, res: Response) => {
  const parsed = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  const { email, password } = parsed.data;

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase()) as UserRow | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  return res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
});

/** Express middleware: requires a valid Bearer token, sets req.userId. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
