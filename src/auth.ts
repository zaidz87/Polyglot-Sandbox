import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

// ---------------------------------------------------------------------------
// Database setup — auto-creates users.db in project root on first run
// ---------------------------------------------------------------------------
const db = new Database(path.join(process.cwd(), 'users.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  )
`);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export const authRouter = Router();

// ---------------------------------------------------------------------------
// POST /auth/register
// Body: { email: string, password: string }
// ---------------------------------------------------------------------------
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters.' });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);

    return res.status(201).json({ status: 'success', message: 'Account created successfully.' });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/login
// Body: { email: string, password: string }
// Returns: { status, token, email }
// ---------------------------------------------------------------------------
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const user = db
      .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .get(email) as { id: number; email: string; password_hash: string } | undefined;

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ status: 'success', token, email: user.email });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});
