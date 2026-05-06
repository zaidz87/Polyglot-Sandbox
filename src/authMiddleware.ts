import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// ---------------------------------------------------------------------------
// Extend Express's Request type to carry the decoded JWT payload.
// This lets downstream handlers access req.user safely in TypeScript.
// ---------------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email: string };
    }
  }
}

// ---------------------------------------------------------------------------
// authMiddleware
// Expects: Authorization: Bearer <jwt>
// On success: attaches decoded payload to req.user and calls next()
// On failure: returns 401
// ---------------------------------------------------------------------------
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};
