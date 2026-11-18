import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header (Bearer token required)' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'local-dev-jwt-secret-key-change-in-production-12345';

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email?: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User associated with this token no longer exists' });
      return;
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = user.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token', details: String(err) });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header (Bearer token required)' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'local-dev-jwt-secret-key-change-in-production-12345';

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email?: string; role?: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User associated with this token no longer exists' });
      return;
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = user.role;

    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied: Master Administrator privileges required' });
      return;
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token', details: String(err) });
  }
}
