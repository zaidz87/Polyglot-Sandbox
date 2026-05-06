import 'dotenv/config';
import express, { Request, Response } from 'express';
import { rateLimiter } from './rateLimiter';
import { executeCode, SUPPORTED_LANGUAGES } from './executor';
import { authRouter } from './auth';
import { authMiddleware } from './authMiddleware';

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// Parse JSON request bodies (makes req.body available)
app.use(express.json());

// Allow requests from the Vite dev server on port 5173
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------------------------
// Auth routes — /auth/register and /auth/login (public, no JWT required)
// ---------------------------------------------------------------------------
app.use('/auth', authRouter);

// ---------------------------------------------------------------------------
// POST /execute
// Protected by: authMiddleware (JWT) → rateLimiter (Redis, 10 req/min)
// Body: { language: string, code: string }
// ---------------------------------------------------------------------------
app.post('/execute', authMiddleware, rateLimiter, async (req: Request, res: Response) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing language or code in request body.',
      });
    }

    // Validate against the language map — single source of truth from executor.ts
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language. Allowed: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    const result = await executeCode(language, code);
    res.json(result);
  } catch (error: any) {
    console.error('[Execute] Endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during execution.',
    });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[Server] Polyglot API listening on port ${PORT}`);
  console.log(`[Server] Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
});
